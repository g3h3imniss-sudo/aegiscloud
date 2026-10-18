import { lookup } from "node:dns/promises";
import type { LookupAddress, LookupOptions } from "node:dns";
import http from "node:http";
import https from "node:https";
import tls from "node:tls";
import { BlockList, isIP } from "node:net";
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { operatorAuthorization } from "@/lib/operator";

const SECURITY_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
];
const MAX_REDIRECTS = 5;
const BLOCKED_IPV4_ADDRESSES = new BlockList();
const BLOCKED_IPV6_ADDRESSES = new BlockList();

for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  BLOCKED_IPV4_ADDRESSES.addSubnet(address, prefix, "ipv4");
}
for (const [address, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["::ffff:0:0", 96],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2002::", 16],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  BLOCKED_IPV6_ADDRESSES.addSubnet(address, prefix, "ipv6");
}

type PinnedLookup = (
  hostname: string,
  options: LookupOptions,
  callback: (
    error: NodeJS.ErrnoException | null,
    address: string | LookupAddress[],
    family?: number,
  ) => void,
) => void;

function pinnedLookup(addresses: LookupAddress[]): PinnedLookup {
  return (_hostname, options, callback) => {
    const candidates = options.family
      ? addresses.filter((item) => item.family === Number(options.family))
      : addresses;
    if (candidates.length === 0) {
      const error = Object.assign(new Error("No address for requested family"), {
        code: "ENOTFOUND",
      }) as NodeJS.ErrnoException;
      callback(error, "");
      return;
    }
    if (options.all) callback(null, candidates);
    else callback(null, candidates[0].address, candidates[0].family);
  };
}

function normalize(input: string): URL | null {
  let value = input.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    const expectedPort = url.protocol === "https:" ? "443" : "80";
    if (url.username || url.password || (url.port && url.port !== expectedPort)) {
      return null;
    }
    url.hostname = hostname;
    return url;
  } catch {
    return null;
  }
}

async function publicAddresses(hostname: string): Promise<LookupAddress[]> {
  const address = hostname.replace(/^\[|\]$/g, "");
  const type = isIP(address);
  const addresses = type
    ? [{ address, family: type }]
    : await lookup(address, { all: true, verbatim: true });
  if (
    addresses.length === 0 ||
    addresses.some((entry) =>
      entry.family === 4
        ? BLOCKED_IPV4_ADDRESSES.check(entry.address, "ipv4")
        : BLOCKED_IPV6_ADDRESSES.check(entry.address, "ipv6"),
    )
  ) {
    throw new Error("Target resolves to a non-public address.");
  }
  return addresses;
}

function readHeaders(url: URL, addresses: LookupAddress[]) {
  return new Promise<{
    status: number;
    headers: http.IncomingHttpHeaders;
  }>((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(
      url,
      {
        method: "GET",
        headers: { "user-agent": "AegisCloud/1.0 (security-check)" },
        lookup: pinnedLookup(addresses),
      },
      (response) => {
        const result = { status: response.statusCode ?? 0, headers: response.headers };
        response.destroy();
        resolve(result);
      },
    );
    request.setTimeout(8000, () => request.destroy(new Error("Request timed out")));
    request.once("error", reject);
    request.end();
  });
}

function tlsInfo(host: string, addresses: LookupAddress[]) {
  return new Promise<{
    authorized: boolean;
    protocol: string | null;
    issuer: string | null;
    validTo: string | null;
  } | null>((resolve) => {
    const ipVersion = isIP(host);
    const socket = tls.connect(
      {
        host,
        port: 443,
        ...(ipVersion ? {} : { servername: host }),
        lookup: pinnedLookup(addresses),
        timeout: 6000,
      },
      () => {
        const certificate = socket.getPeerCertificate();
        const organization = certificate?.issuer?.O;
        resolve({
          authorized: socket.authorized,
          protocol: socket.getProtocol(),
          issuer: Array.isArray(organization)
            ? organization.join(", ")
            : (organization ?? null),
          validTo: certificate?.valid_to ?? null,
        });
        socket.end();
      },
    );
    socket.once("error", () => resolve(null));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

export async function GET(request: Request) {
  const unauthorized = operatorAuthorization(request);
  if (unauthorized) return unauthorized;

  const target = normalize(new URL(request.url).searchParams.get("url") ?? "");
  if (!target) {
    return NextResponse.json(
      { ok: false, error: "URL yanlışdır; yalnız HTTP(S) və standart portlar qəbul edilir." },
      { status: 400 },
    );
  }

  const redirects: { from: string; to: string; status: number }[] = [];
  const visited = new Set<string>();
  let current = target;
  let status = 0;
  let responseHeaders: http.IncomingHttpHeaders = {};
  let finalAddresses: LookupAddress[] = [];

  try {
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      if (visited.has(current.href)) {
        return NextResponse.json(
          { ok: false, error: "Yönləndirmə dövrəsi aşkarlandı." },
          { status: 400 },
        );
      }
      visited.add(current.href);
      finalAddresses = await publicAddresses(current.hostname);
      const response = await readHeaders(current, finalAddresses);
      status = response.status;
      responseHeaders = response.headers;

      const location = response.headers.location;
      if (!location || ![301, 302, 303, 307, 308].includes(status)) break;
      if (i === MAX_REDIRECTS) {
        return NextResponse.json(
          { ok: false, error: "Yönləndirmə limiti keçildi." },
          { status: 400 },
        );
      }
      const next = normalize(new URL(location, current).toString());
      if (!next) {
        return NextResponse.json(
          { ok: false, error: "Yönləndirmə etibarlı HTTP(S) ünvanına deyil." },
          { status: 400 },
        );
      }
      redirects.push({ from: current.href, to: next.href, status });
      current = next;
    }
  } catch (error) {
    const blocked = error instanceof Error && error.message.includes("non-public");
    return NextResponse.json(
      {
        ok: false,
        error: blocked
          ? "Daxili və qeyri-ictimai IP ünvanlarına sorğu qadağandır."
          : "Hədəfə qoşulmaq alınmadı (timeout və ya DNS xətası).",
      },
      { status: blocked ? 400 : 502 },
    );
  }

  const host = current.hostname.replace(/^\[|\]$/g, "");
  const secured = current.protocol === "https:";
  const tlsResult = secured ? await tlsInfo(host, finalAddresses) : null;
  const normalizedHeaders = Object.fromEntries(
    Object.entries(responseHeaders).flatMap(([name, value]) =>
      typeof value === "string" ? [[name.toLowerCase(), value]] : [],
    ),
  );
  const present = SECURITY_HEADERS.filter((header) => header in normalizedHeaders);
  const missing = SECURITY_HEADERS.filter((header) => !(header in normalizedHeaders));

  let logged = false;
  const db = getSupabase();
  if (db) {
    const { error } = await db.rpc("append_audit_log", {
      p_action: "scan",
      p_target: current.href,
      p_status: status,
      p_tls_issuer: tlsResult?.issuer ?? null,
    });
    if (error) console.error("scan audit append failed:", error.message);
    else logged = true;
  }

  return NextResponse.json({
    ok: true,
    target: target.href,
    finalUrl: current.href,
    status,
    redirects,
    tls: tlsResult,
    headers: Object.fromEntries(
      Object.entries(normalizedHeaders).filter(([name]) =>
        ["server", "content-type", "via", "x-powered-by", ...SECURITY_HEADERS].includes(name),
      ),
    ),
    present,
    missing,
    db: Boolean(db),
    logged,
  });
}
