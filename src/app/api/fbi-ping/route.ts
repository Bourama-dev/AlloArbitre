import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Sonde TEMPORAIRE de diagnostic : le serveur Vercel arrive-t-il à joindre
 * FBI ? Charge seulement la page publique de connexion (aucun identifiant,
 * aucune donnée) et renvoie le statut HTTP ou le code d'erreur réseau.
 * À supprimer une fois la coupure FBI expliquée.
 */
export async function GET() {
  const started = Date.now();
  try {
    const res = await fetch("https://extranet.ffbb.com/fbi/connexion.fbi", {
      signal: AbortSignal.timeout(30_000),
      headers: { "User-Agent": "Mozilla/5.0 (AlloArbitre)" },
    });
    return NextResponse.json({ ok: res.ok, status: res.status, ms: Date.now() - started, region: process.env.VERCEL_REGION ?? null });
  } catch (err) {
    const e = err as Error & { cause?: { code?: string; message?: string; errno?: number } };
    return NextResponse.json({
      ok: false,
      ms: Date.now() - started,
      region: process.env.VERCEL_REGION ?? null,
      error: e.message,
      name: e.name,
      cause: e.cause ? { code: e.cause.code ?? null, message: e.cause.message ?? null, errno: e.cause.errno ?? null } : null,
    });
  }
}
