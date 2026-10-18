import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { operatorAuthorization } from "@/lib/operator";

export async function GET(request: Request) {
  const unauthorized = operatorAuthorization(request);
  if (unauthorized) return unauthorized;
  const db = getSupabase();
  if (!db) {
    return NextResponse.json(
      { ok: false, configured: false, rows: [], error: "Supabase konfiqurasiya edilməyib" },
      { status: 503 },
    );
  }

  const { data, error } = await db
    .from("risks")
    .select("id, asset, threat, likelihood, impact, control, created_at")
    .order("id", { ascending: true });

  if (error) {
    console.error("risks select:", error.message);
    const missing = /does not exist|schema cache/i.test(error.message);
    return NextResponse.json({
      ok: true,
      configured: true,
      rows: [],
      notice: missing ? "schema" : "read",
    });
  }
  return NextResponse.json({ ok: true, configured: true, rows: data ?? [] });
}

export async function POST(request: Request) {
  const unauthorized = operatorAuthorization(request);
  if (unauthorized) return unauthorized;
  const db = getSupabase();
  if (!db) return NextResponse.json({ ok: false, error: "baza əlçatan deyil" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "yanlış sorğu" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "yanlış sorğu" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const asset = typeof input.asset === "string" ? input.asset.trim() : "";
  const threat = typeof input.threat === "string" ? input.threat.trim() : "";
  const control = typeof input.control === "string" ? input.control.trim() : "";
  const likelihood = input.likelihood;
  const impact = input.impact;

  if (
    !asset ||
    !threat ||
    asset.length > 200 ||
    threat.length > 500 ||
    control.length > 500 ||
    !Number.isInteger(likelihood) ||
    !Number.isInteger(impact) ||
    Number(likelihood) < 1 ||
    Number(likelihood) > 5 ||
    Number(impact) < 1 ||
    Number(impact) > 5
  ) {
    return NextResponse.json({ ok: false, error: "aktiv və təhdid tələb olunur" }, { status: 400 });
  }

  const { error } = await db.from("risks").insert({
    asset,
    threat,
    likelihood: Number(likelihood),
    impact: Number(impact),
    control: control || null,
  });

  if (error) {
    console.error("risks insert:", error.message);
    return NextResponse.json({ ok: false, error: "əlavə etmək alınmadı" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const unauthorized = operatorAuthorization(request);
  if (unauthorized) return unauthorized;
  const db = getSupabase();
  if (!db) return NextResponse.json({ ok: false, error: "baza əlçatan deyil" }, { status: 503 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "id düzgün deyil" }, { status: 400 });
  }

  const { error } = await db.from("risks").delete().eq("id", id);
  if (error) {
    console.error("risks delete:", error.message);
    return NextResponse.json({ ok: false, error: "silmək alınmadı" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
