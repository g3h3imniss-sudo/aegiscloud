import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { operatorAuthorization } from "@/lib/operator";

export async function GET(request: Request) {
  const unauthorized = operatorAuthorization(request);
  if (unauthorized) return unauthorized;
  await headers(); // route-u dinamik edir ki, hər sorğuda bazadan oxusun
  const db = getSupabase();
  if (!db) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        rows: [],
        chain: null,
        stats: null,
        error: "Supabase konfiqurasiya edilməyib",
      },
      { status: 503 },
    );
  }

  const { data, error } = await db
    .from("audit_log")
    .select("id, action, target, status, tls_issuer, prev_hash, entry_hash, created_at")
    .order("id", { ascending: false })
    .limit(8);

  const { data: chainData, error: chainError } = await db.rpc("verify_audit_chain");
  const chain = Array.isArray(chainData) ? chainData[0] : chainData;

  const { count, error: countError } = await db
    .from("audit_log")
    .select("*", { count: "exact", head: true });

  const { data: all, error: statsError } = await db
    .from("audit_log")
    .select("target, status")
    .limit(1000);
  if (error || chainError || countError || statsError) {
    console.error("audit query failed:", error ?? chainError ?? countError ?? statsError);
    return NextResponse.json(
      { ok: false, error: "Audit məlumatlarını oxumaq alınmadı" },
      { status: 502 },
    );
  }
  const rows = all ?? [];
  const unique = new Set(rows.map((r) => r.target)).size;
  const ok = rows.filter((r) => (r.status ?? 0) < 400).length;
  const passRate = rows.length ? Math.round((ok / rows.length) * 100) : 0;

  return NextResponse.json({
    ok: true,
    configured: true,
    rows: data ?? [],
    chain: chain ?? null,
    stats: { total: count ?? 0, unique, passRate },
  });
}
