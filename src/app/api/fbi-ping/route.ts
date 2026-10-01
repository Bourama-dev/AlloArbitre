import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { loggedInClient } from "@/lib/fbi/fetch";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Step = { step: string; ms: number; ok: boolean; info?: string; error?: string; code?: string | null };

function describe(err: unknown): { error: string; code: string | null } {
  const e = err as Error & { cause?: { code?: string } };
  return { error: `${e?.name ?? "Error"}: ${e?.message ?? String(err)}`, code: e?.cause?.code ?? null };
}

async function timed(steps: Step[], step: string, fn: () => Promise<string | void>) {
  const started = Date.now();
  try {
    const info = await fn();
    steps.push({ step, ms: Date.now() - started, ok: true, ...(info ? { info } : {}) });
    return true;
  } catch (err) {
    steps.push({ step, ms: Date.now() - started, ok: false, ...describe(err) });
    return false;
  }
}

/**
 * Sonde TEMPORAIRE de diagnostic de la liaison avec FBI.
 * - sans paramètre : page publique de connexion FBI (aucun identifiant) ;
 * - ?login=1 (staff connecté uniquement) : rejoue une session d'envoi en
 *   LECTURE SEULE (connexion, page de recherche des désignations, puis
 *   plusieurs requêtes à la suite) et donne durée et code d'erreur de chaque
 *   étape. Aucune écriture sur FBI.
 * À supprimer une fois la coupure FBI expliquée.
 */
export async function GET(request: Request) {
  const region = process.env.VERCEL_REGION ?? null;
  const login = new URL(request.url).searchParams.get("login") === "1";

  if (!login) {
    const steps: Step[] = [];
    await timed(steps, "page publique connexion.fbi", async () => {
      const res = await fetch("https://extranet.ffbb.com/fbi/connexion.fbi", { signal: AbortSignal.timeout(30_000) });
      return `HTTP ${res.status}`;
    });
    return NextResponse.json({ region, steps });
  }

  if (!(await getCurrentUser())) return NextResponse.json({ error: "Réservé au staff connecté." }, { status: 401 });

  const steps: Step[] = [];
  let client: Awaited<ReturnType<typeof loggedInClient>> | null = null;
  await timed(steps, "connexion + identification FBI", async () => {
    client = await loggedInClient();
  });
  if (client) {
    const c = client as Awaited<ReturnType<typeof loggedInClient>>;
    for (let i = 1; i <= 8; i++) {
      await timed(steps, `page recherche désignations #${i}`, async () => {
        const html = await c.get("rechercherDesignation.fbi");
        return `${html.length} caractères`;
      });
    }
  }
  return NextResponse.json({ region, at: new Date().toISOString(), steps });
}
