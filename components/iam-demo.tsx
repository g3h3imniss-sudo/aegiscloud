"use client";

import { useState } from "react";

type Stmt = { effect: "Allow" | "Deny"; actions: string[]; resources: string[] };

// Yerli nümunə scope-u; Cloudflare R2 tokenini yoxlamır.
const policy: Stmt[] = [
  { effect: "Allow", actions: ["r2:ListObjects"], resources: ["bucket:aegiscloud-data"] },
  { effect: "Allow", actions: ["r2:GetObject", "r2:PutObject"], resources: ["object:aegiscloud-data/uploads/*"] },
];

const scenarios = [
  { a: "r2:GetObject", r: "object:aegiscloud-data/uploads/report.pdf", want: "Yüklənmiş hesabatı oxumaq" },
  { a: "r2:PutObject", r: "object:aegiscloud-data/uploads/1.png", want: "Yeni fayl yükləmək" },
  { a: "r2:DeleteObject", r: "object:aegiscloud-data/uploads/report.pdf", want: "Faylı silmək (tətbiqin tokeni üçün bağlıdır)" },
  { a: "r2:GetObject", r: "object:competitor-bucket/secret", want: "Başqa bucket-dən oxumaq" },
  { a: "r2:ListVersions", r: "bucket:aegiscloud-data", want: "R2 versiya siyahısı (dəstəklənmir)" },
  { a: "r2:ChangeToken", r: "*", want: "R2 token icazələrini dəyişmək" },
];

function wildcard(pattern: string, value: string) {
  if (pattern === "*") return true;
  if (pattern.endsWith("*")) return value.startsWith(pattern.slice(0, -1));
  return pattern === value;
}

function evaluate(action: string, resource: string) {
  // Uyğun Allow qaydası yoxdursa sorğu standart olaraq rədd edilir.
  let matched: Stmt | null = null;
  for (const s of policy) {
    const a = s.actions.some((p) => wildcard(p, action));
    const r = s.resources.some((p) => wildcard(p, resource));
    if (a && r) {
      if (s.effect === "Deny") return { decision: "DENY" as const, rule: s, action, resource };
      matched = s;
    }
  }
  return { decision: matched ? ("ALLOW" as const) : ("DENY" as const), rule: matched, action, resource };
}

export default function IamDemo() {
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof evaluate> | null>(null);
  const sc = scenarios[idx];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <label className="text-xs text-muted">Sorğu (scenario) seçin</label>
        <select
          className="w-full rounded-md border border-line bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent/60"
          value={idx}
          onChange={(e) => {
            setIdx(Number(e.target.value));
            setResult(null);
          }}
        >
          {scenarios.map((s, i) => (
            <option key={i} value={i}>
              {s.a} → {s.r}
            </option>
          ))}
        </select>

        <div className="panel mt-4 p-4 text-sm">
          <p className="text-muted">{sc.want}</p>
          <p className="mono mt-3 text-xs text-accent-2">
            Action: {sc.a}
            <br />
            Resource: {sc.r}
          </p>
        </div>

        <button
          className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-[#0b0b0d] hover:bg-accent/90"
          onClick={() => setResult(evaluate(sc.a, sc.r))}
        >
          İcazəni yoxla
        </button>

        {result && (
          <div
            className={`mt-4 rounded-md border p-4 text-sm ${
              result.decision === "ALLOW"
                ? "border-accent-2/40 bg-accent-2/5 text-accent-2"
                : "border-red-500/40 bg-red-500/5 text-red-300"
            }`}
          >
            Nəticə: <strong>{result.decision}</strong>
            <p className="mt-1 text-xs opacity-80">
              {result.rule
                ? `Uyğun qayda: ${result.rule.effect} (${result.rule.actions.join(", ")})`
                : "Heç bir Allow qaydası uyğun gəlmədi, standart olaraq rədd edilir."}
            </p>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted">Nümunə R2 token scope-u (canlı Cloudflare bağlantısı deyil)</p>
        <pre className="mono max-h-96 overflow-auto rounded-md border border-line bg-black/30 p-4 text-xs leading-6 text-muted">
{`{
  "bucket": "aegiscloud-data",
  "permissions": ["Object Read", "Object Write"],
  "scope": "this bucket only",
  "delete": false
}`}
        </pre>
        <p className="mt-3 text-xs text-muted">
          Bucket adı nümunə placeholder-ıdır. Bu lokal simulyasiya
          Cloudflare tokeni yaratmır və real icazəni yoxlamır.
        </p>
      </div>
    </div>
  );
}
