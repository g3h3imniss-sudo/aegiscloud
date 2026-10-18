import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    ok: true,
    platform: process.env.VERCEL ? "vercel" : "node",
    region: process.env.VERCEL_REGION ?? "local",
    env: process.env.VERCEL_ENV ?? "development",
    node: process.version,
    now: new Date().toISOString(),
    db: dbConfigured(),
  });
}
