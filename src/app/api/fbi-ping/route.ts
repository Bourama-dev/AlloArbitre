import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { loggedInClient } from "@/lib/fbi/fetch";
import { fetchDesignationsExportRows, searchDesignations } from "@/lib/fbi/searchDesignations";

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
    // Mêmes lectures que l'envoi d'une désignation (aucune écriture) :
    // recherche de la journée, export de la journée, fiche d'une rencontre.
    const dateParam = new URL(request.url).searchParams.get("date");
    const date =
      dateParam && /^\d{2}\/\d{2}\/\d{4}$/.test(dateParam)
        ? dateParam
        : new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });
    let idRencontre: string | null = null;
    for (let round = 1; round <= 2; round++) {
      await timed(steps, `recherche des désignations du ${date} #${round}`, async () => {
        const rows = await searchDesignations(c, { dateDebut: date, dateFin: date });
        idRencontre = idRencontre ?? rows.find((r) => r.idRencontre)?.idRencontre ?? null;
        return `${rows.length} rencontre(s)`;
      });
      await timed(steps, `export de la journée #${round}`, async () => {
        const rows = await fetchDesignationsExportRows(c, { dateDebut: date, dateFin: date });
        return `${rows.length} ligne(s)`;
      });
      if (idRencontre) {
        const id: string = idRencontre;
        await timed(steps, `fiche rencontre ${id} #${round}`, async () => {
          await c.get("rechercherDesignation.fbi");
          const fiche = await c.post(`afficherRepartitionDesignationAjax.fbi?idRencontre=${id}`, {});
          return `${fiche.length} caractères`;
        });
      }
    }
  }
  return NextResponse.json({ region, at: new Date().toISOString(), steps });
}
