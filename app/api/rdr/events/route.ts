import { NextResponse } from "next/server";
import { constantTimeTokenMatches } from "@/lib/operator";
import { getR2Config, r2Bucket } from "@/lib/cloudflare-r2";
import { getSupabase } from "@/lib/supabase";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const expectedToken = process.env.RDR_EVENT_TOKEN;
  if (
    !expectedToken ||
    expectedToken.length < 32 ||
    expectedToken.startsWith("replace-with-")
  ) {
    return NextResponse.json(
      { ok: false, error: "RDR event receiver is not configured securely" },
      { status: 503 },
    );
  }
  if (
    !constantTimeTokenMatches(
      expectedToken,
      request.headers.get("x-rdr-event-token") ?? "",
    )
  ) {
    return NextResponse.json({ ok: false, error: "icazə yoxdur" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "yanlış event payload" }, { status: 400 });
  }
  if (!isRecord(payload) || !isRecord(payload.event)) {
    return NextResponse.json({ ok: false, error: "yanlış event payload" }, { status: 400 });
  }

  const event = payload.event;
  const objectInfo = event.object;
  const bucket = r2Bucket();
  const config = getR2Config();
  const db = getSupabase();
  if (!bucket || !config || !db) {
    return NextResponse.json(
      { ok: false, error: "Cloudflare R2 və Supabase konfiqurasiya edilməyib" },
      { status: 503 },
    );
  }

  const isCreate =
    event.action === "PutObject" ||
    event.action === "CopyObject" ||
    event.action === "CompleteMultipartUpload";
  const isDelete = event.action === "DeleteObject" || event.action === "LifecycleDeletion";
  if (
    (!isCreate && !isDelete) ||
    !isRecord(objectInfo) ||
    typeof objectInfo.key !== "string" ||
    objectInfo.key.length < 1 ||
    objectInfo.key.length > 1024 ||
    typeof payload.id !== "string" ||
    payload.id.length < 1 ||
    payload.id.length > 256 ||
    typeof event.eventTime !== "string" ||
    !Number.isFinite(Date.parse(event.eventTime)) ||
    event.bucket !== bucket ||
    (event.account !== undefined && event.account !== config.accountId)
  ) {
    return NextResponse.json(
      { ok: false, error: "R2 event formatı və ya bucket uyğun deyil" },
      { status: 400 },
    );
  }

  const etag =
    typeof objectInfo.eTag === "string"
      ? objectInfo.eTag.replace(/^"|"$/g, "").slice(0, 1024)
      : null;
  let changeType: "added" | "modified" | "deleted" = isDelete ? "deleted" : "modified";
  let previousEtag: string | null = null;
  if (isCreate) {
    const { data: baselineObject, error: baselineError } = await db
      .from("object_baseline")
      .select("etag")
      .eq("bucket", bucket)
      .eq("object_key", objectInfo.key)
      .maybeSingle();
    if (baselineError) {
      console.error("R2 event baseline lookup failed:", baselineError.message);
      return NextResponse.json(
        { ok: false, error: "R2 event baseline yoxlaması alınmadı" },
        { status: 503 },
      );
    }
    changeType = baselineObject ? "modified" : "added";
    previousEtag = baselineObject?.etag ?? null;
  }

  const { error } = await db.from("object_change_events").insert({
    event_id: payload.id,
    bucket,
    object_key: objectInfo.key,
    change_type: changeType,
    previous_etag: previousEtag,
    current_etag: isDelete ? null : etag,
    source: "r2-queue",
    observed_at: new Date(event.eventTime).toISOString(),
  });

  if (error?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (error) {
    console.error("R2 event insert failed:", error.message);
    return NextResponse.json(
      { ok: false, error: "R2 event-i tarixçəyə yazmaq alınmadı" },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, duplicate: false });
}
