import { ListObjectsV2Command, type S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { getR2Client, r2Bucket } from "@/lib/cloudflare-r2";
import { operatorAuthorization } from "@/lib/operator";
import { getSupabase } from "@/lib/supabase";

const MAX_OBJECTS = 10_000;
const WRITE_BATCH_SIZE = 500;

type R2Object = {
  object_key: string;
  etag: string | null;
  size: number;
  last_modified: string | null;
};

async function currentObjects(r2: S3Client, bucket: string): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let continuationToken: string | undefined;

  do {
    const page = await r2.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1000,
        ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
      }),
    );

    for (const item of page.Contents ?? []) {
      if (!item.Key) continue;
      objects.push({
        object_key: item.Key,
        etag: item.ETag?.replace(/^"|"$/g, "") ?? null,
        size: item.Size ?? 0,
        last_modified: item.LastModified?.toISOString() ?? null,
      });
      if (objects.length > MAX_OBJECTS) {
        throw new Error(`R2 bucket exceeds the ${MAX_OBJECTS}-object monitoring limit.`);
      }
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    if (page.IsTruncated && !continuationToken) {
      throw new Error("R2 returned a truncated object listing without a continuation token.");
    }
  } while (continuationToken);

  return objects;
}

function isDifferent(previous: R2Object, current: R2Object): boolean {
  return (
    previous.etag !== current.etag ||
    previous.size !== current.size ||
    previous.last_modified !== current.last_modified
  );
}

export async function GET(request: Request) {
  const unauthorized = operatorAuthorization(request);
  if (unauthorized) return unauthorized;

  const db = getSupabase();
  const bucket = r2Bucket();
  if (!db || !bucket || !getR2Client()) {
    return NextResponse.json(
      { ok: false, error: "Cloudflare R2 və Supabase konfiqurasiya edilməyib" },
      { status: 503 },
    );
  }

  const { data: state, error: baselineError } = await db
    .from("object_baseline_state")
    .select("baseline_at, object_count")
    .eq("bucket", bucket)
    .maybeSingle();
  if (baselineError) {
    console.error("R2 baseline read failed:", baselineError.message);
    return NextResponse.json(
      { ok: false, error: "RDR sxemi hazır deyil və ya baseline oxunmadı" },
      { status: 503 },
    );
  }

  const { data: events, error: eventsError } = await db
    .from("object_change_events")
    .select("id, object_key, change_type, previous_etag, current_etag, source, actor, request_id, observed_at")
    .eq("bucket", bucket)
    .order("observed_at", { ascending: false })
    .limit(50);
  if (eventsError) {
    console.error("R2 change history read failed:", eventsError.message);
    return NextResponse.json(
      { ok: false, error: "R2 dəyişiklik tarixçəsini oxumaq alınmadı" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    bucket,
    baselineAt: state?.baseline_at ?? null,
    baselineCount: state?.object_count ?? 0,
    events: events ?? [],
  });
}

export async function POST(request: Request) {
  const unauthorized = operatorAuthorization(request);
  if (unauthorized) return unauthorized;

  const db = getSupabase();
  const r2 = getR2Client();
  const bucket = r2Bucket();
  if (!db || !r2 || !bucket) {
    return NextResponse.json(
      { ok: false, error: "Cloudflare R2 və Supabase konfiqurasiya edilməyib" },
      { status: 503 },
    );
  }

  let action: unknown;
  try {
    ({ action } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "yanlış sorğu" }, { status: 400 });
  }
  if (action !== "baseline" && action !== "scan") {
    return NextResponse.json({ ok: false, error: "naməlum monitorinq əməliyyatı" }, { status: 400 });
  }

  let objects: R2Object[];
  try {
    objects = await currentObjects(r2, bucket);
  } catch (error) {
    console.error("R2 object listing failed:", error);
    const tooMany = error instanceof Error && error.message.includes("monitoring limit");
    return NextResponse.json(
      {
        ok: false,
        error: tooMany ? error.message : "R2 obyektlərini oxumaq alınmadı",
      },
      { status: tooMany ? 413 : 502 },
    );
  }

  if (action === "baseline") {
    const { data, error } = await db.rpc("replace_object_baseline", {
      p_bucket: bucket,
      p_objects: objects,
    });
    if (error) {
      console.error("R2 baseline write failed:", error.message);
      return NextResponse.json(
        { ok: false, error: "Baseline saxlanmadı; Supabase sxemini tətbiq edin" },
        { status: 503 },
      );
    }
    return NextResponse.json({
      ok: true,
      action,
      objectCount: Number(data ?? objects.length),
      message: "Baseline yeniləndi. Sonrakı yoxlamalar yalnız fərqləri göstərəcək.",
    });
  }

  const baseline: R2Object[] = [];
  for (let offset = 0; offset < MAX_OBJECTS; offset += WRITE_BATCH_SIZE) {
    const { data, error } = await db
      .from("object_baseline")
      .select("object_key, etag, size, last_modified")
      .eq("bucket", bucket)
      .order("object_key", { ascending: true })
      .range(offset, offset + WRITE_BATCH_SIZE - 1);
    if (error) {
      console.error("R2 baseline read failed:", error.message);
      return NextResponse.json(
        { ok: false, error: "Baseline oxunmadı; Supabase sxemini tətbiq edin" },
        { status: 503 },
      );
    }
    baseline.push(...(data ?? []));
    if (!data || data.length < WRITE_BATCH_SIZE) break;
  }
  const { data: baselineState, error: stateError } = await db
    .from("object_baseline_state")
    .select("bucket, object_count")
    .eq("bucket", bucket)
    .maybeSingle();
  if (stateError) {
    console.error("R2 baseline state read failed:", stateError.message);
    return NextResponse.json(
      { ok: false, error: "Baseline statusunu yoxlamaq alınmadı" },
      { status: 503 },
    );
  }
  if (!baselineState) {
    return NextResponse.json(
      { ok: false, error: "Baseline yoxdur. Əvvəlcə baseline yaradın." },
      { status: 409 },
    );
  }
  if (baselineState.object_count > MAX_OBJECTS) {
    return NextResponse.json(
      { ok: false, error: `Baseline ${MAX_OBJECTS} obyekt monitorinq limitini keçir.` },
      { status: 413 },
    );
  }
  if (baseline.length !== baselineState.object_count) {
    console.error("R2 baseline row count does not match the saved baseline state.");
    return NextResponse.json(
      { ok: false, error: "Baseline tam oxunmadı; Supabase pagination-ı yoxlayın" },
      { status: 503 },
    );
  }

  const previousByKey = new Map(
    baseline.map((item) => [item.object_key, item as R2Object]),
  );
  const currentByKey = new Map(objects.map((item) => [item.object_key, item]));
  const changes: {
    bucket: string;
    object_key: string;
    change_type: "added" | "modified" | "deleted";
    previous_etag: string | null;
    current_etag: string | null;
  }[] = [];

  for (const object of objects) {
    const previous = previousByKey.get(object.object_key);
    if (!previous) {
      changes.push({
        bucket,
        object_key: object.object_key,
        change_type: "added",
        previous_etag: null,
        current_etag: object.etag,
      });
    } else if (isDifferent(previous, object)) {
      changes.push({
        bucket,
        object_key: object.object_key,
        change_type: "modified",
        previous_etag: previous.etag,
        current_etag: object.etag,
      });
    }
  }
  for (const previous of baseline) {
    if (!currentByKey.has(previous.object_key)) {
      changes.push({
        bucket,
        object_key: previous.object_key,
        change_type: "deleted",
        previous_etag: previous.etag,
        current_etag: null,
      });
    }
  }

  for (let offset = 0; offset < changes.length; offset += WRITE_BATCH_SIZE) {
    const { error } = await db
      .from("object_change_events")
      .insert(
        changes.slice(offset, offset + WRITE_BATCH_SIZE).map((change) => ({
          ...change,
          source: "baseline-scan",
        })),
      );
    if (error) {
      console.error("R2 change history write failed:", error.message);
      return NextResponse.json(
        { ok: false, error: "Dəyişikliklər aşkarlandı, amma tarixçəyə yazılmadı" },
        { status: 503 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    action,
    checked: objects.length,
    totalChanges: changes.length,
    changes: changes.slice(0, 200),
    truncated: changes.length > 200,
    response: "monitor-only",
  });
}
