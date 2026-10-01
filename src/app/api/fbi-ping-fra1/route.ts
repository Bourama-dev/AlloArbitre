import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
// Sonde TEMPORAIRE : la page publique de FBI est-elle joignable depuis la région Vercel fra1 ?
export const preferredRegion = "fra1";

export async function GET() {
  const started = Date.now();
  try {
    const res = await fetch("https://extranet.ffbb.com/fbi/connexion.fbi", { signal: AbortSignal.timeout(20_000) });
    return NextResponse.json({ region: process.env.VERCEL_REGION ?? null, ok: res.ok, status: res.status, ms: Date.now() - started });
  } catch (err) {
    const e = err as Error & { cause?: { code?: string } };
    return NextResponse.json({ region: process.env.VERCEL_REGION ?? null, ok: false, ms: Date.now() - started, error: e.message, code: e.cause?.code ?? null });
  }
}
