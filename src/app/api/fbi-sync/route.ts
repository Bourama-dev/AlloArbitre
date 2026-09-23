import { NextResponse } from "next/server";
import { FbiClient, type FbiDump } from "@/lib/fbi/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { searchDesignations } from "@/lib/fbi/searchDesignations";
import { compareWithAlloArbitre } from "@/lib/fbi/sync";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Espaces / retours à la ligne ou guillemets englobants collés par erreur
 * dans les settings Vercel font échouer le login FBI. On ne retire les
 * guillemets que s'ils entourent toute la valeur (un mot de passe peut
 * légitimement commencer ou finir par un guillemet).
 */
function cleanCredential(value: string | undefined): string {
  const v = (value ?? "").trim();
  return /^(['"])[\s\S]*\1$/.test(v) && v.length >= 2 ? v.slice(1, -1) : v;
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Cron (à déclarer dans vercel.json, ex. tous les jours à 7h) : se logue sur
 * FBI, récupère l'état des désignations pour les 14 prochains jours, et
 * compare avec AlloArbitre. Renvoie les écarts, n'écrit rien nulle part pour
 * l'instant (lecture seule, cf. décision de ne pas écrire sur FBI dans un
 * premier temps).
 *
 * Protégé par CRON_SECRET (header Authorization: Bearer <secret>), comme
 * recommandé par Vercel pour les cron jobs. Un admin déjà connecté dans le
 * navigateur peut aussi appeler cette route directement (pratique pour
 * tester sans avoir à manipuler le secret), la session Supabase suffit.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const hasValidSecret = Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!hasValidSecret) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const identifiant = cleanCredential(process.env.FBI_USERNAME);
  const motDePasse = cleanCredential(process.env.FBI_PASSWORD);
  if (!identifiant || !motDePasse) {
    return NextResponse.json({ error: "FBI_USERNAME / FBI_PASSWORD non configurés" }, { status: 500 });
  }

  const today = new Date();
  const in14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  // ?debug=1 : chaque page renvoyée par FBI est stockée dans la table
  // (temporaire) FbiDebugDump, lisible uniquement en service_role.
  const debugRunId = new URL(request.url).searchParams.get("debug") === "1" ? crypto.randomUUID() : null;
  const onDump = debugRunId
    ? async (dump: FbiDump) => {
        const { error } = await supabaseAdmin.from("FbiDebugDump").insert({ runId: debugRunId, ...dump });
        if (error) console.error("[fbi-sync] dump failed:", error);
      }
    : undefined;

  try {
    const client = new FbiClient(onDump);
    await client.login(identifiant, motDePasse);

    const rows = await searchDesignations(client, {
      dateDebut: formatDateFr(today),
      dateFin: formatDateFr(in14Days),
    });

    const mismatches = await compareWithAlloArbitre(rows);

    return NextResponse.json({
      ...(debugRunId ? { debugRunId } : {}),
      periode: { du: formatDateFr(today), au: formatDateFr(in14Days) },
      rencontresFbi: rows.length,
      ecarts: mismatches.length,
      mismatches,
    });
  } catch (error) {
    return NextResponse.json(
      { ...(debugRunId ? { debugRunId } : {}), error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
