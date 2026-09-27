import { NextResponse } from "next/server";
import { runAvailabilityCron } from "@/lib/availability-campaign";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron quotidien (vercel.json) : relances avant clôture et rapports de
 * clôture des campagnes de disponibilités. Protégé par CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const log = await runAvailabilityCron();
  return NextResponse.json({ ok: true, log });
}
