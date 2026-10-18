import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getR2Client, r2Bucket } from "@/lib/cloudflare-r2";
import { operatorAuthorization } from "@/lib/operator";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function GET(request: Request) {
  const unauthorized = operatorAuthorization(request);
  if (unauthorized) return unauthorized;

  const r2 = getR2Client();
  const bucket = r2Bucket();
  if (!r2 || !bucket) {
    return NextResponse.json(
      { ok: false, configured: false, files: [], error: "Cloudflare R2 konfiqurasiya edilməyib" },
      { status: 503 },
    );
  }

  try {
    const result = await r2.send(
      new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 20 }),
    );
    const files = await Promise.all(
      (result.Contents ?? [])
        .filter((item): item is typeof item & { Key: string } => Boolean(item.Key))
        .map(async (item) => ({
          name: item.Key,
          size: item.Size ?? null,
          updated: item.LastModified?.toISOString() ?? null,
          url: await getSignedUrl(
            r2,
            new GetObjectCommand({
              Bucket: bucket,
              Key: item.Key,
              ResponseContentDisposition: "attachment",
            }),
            { expiresIn: 120 },
          ),
        })),
    );

    return NextResponse.json({ ok: true, configured: true, files });
  } catch (error) {
    console.error("R2 list/sign URL failed:", error);
    return NextResponse.json(
      { ok: false, error: "R2 fayllarını oxumaq alınmadı" },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = operatorAuthorization(request);
  if (unauthorized) return unauthorized;

  const r2 = getR2Client();
  const bucket = r2Bucket();
  if (!r2 || !bucket) {
    return NextResponse.json(
      { ok: false, error: "Cloudflare R2 konfiqurasiya edilməyib" },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "yanlış fayl sorğusu" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "fayl yoxdur" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "fayl 4 MB-dan böyükdür" },
      { status: 413 },
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "file";
  const key = `uploads/${randomUUID()}-${safeName}`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentLength: file.size,
        ContentType: file.type || "application/octet-stream",
      }),
    );
    return NextResponse.json({ ok: true, path: key });
  } catch (error) {
    console.error("R2 upload failed:", error);
    return NextResponse.json(
      { ok: false, error: "R2-yə yükləmək alınmadı" },
      { status: 502 },
    );
  }
}
