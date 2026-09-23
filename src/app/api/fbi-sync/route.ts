import { NextResponse } from "next/server";
import type { FbiDump } from "@/lib/fbi/client";
import { fetchFbiDesignationDetail, fetchFbiRencontres, formatDateFr, loggedInClient } from "@/lib/fbi/fetch";
import { assignRefereeToFbiRencontre } from "@/lib/fbi/write";
import { pushMatchToFbi } from "@/lib/fbi/push";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { compareWithAlloArbitre } from "@/lib/fbi/sync";
import { getCurrentUser } from "@/lib/current-user";
import { findMatches } from "@/lib/matches";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron (déclaré dans vercel.json, tous les jours à 7h) : se logue sur FBI,
 * récupère l'état des désignations pour les 14 prochains jours, et compare
 * avec AlloArbitre. Renvoie les écarts, n'écrit rien nulle part pour
 * l'instant (lecture seule, cf. décision de ne pas écrire sur FBI dans un
 * premier temps). Pour consulter les rencontres FBI : page /fbi.
 *
 * Protégé par CRON_SECRET (header Authorization: Bearer <secret>), comme
 * recommandé par Vercel pour les cron jobs. Tout utilisateur déjà connecté
 * dans le navigateur peut aussi appeler cette route (même accès que la page
 * /fbi elle-même, qui appelle `?detail=` pour la fiche dépliée sous chaque
 * rencontre), la session Supabase suffit - pas besoin d'être admin.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const hasValidSecret = Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!hasValidSecret) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
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

  // ?assign=<idRencontre>:<position>:<numeroNational> : ÉCRITURE sur FBI (v1,
  // mise au point). dryRun=1 par défaut (construit et renvoie le payload sans
  // l'envoyer) ; dryRun=0 pour l'enregistrer réellement. Réservé aux admins,
  // le CRON_SECRET (job automatique en lecture seule) ne suffit pas ici.
  const assign = new URL(request.url).searchParams.get("assign");
  if (assign) {
    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized (admin requis pour écrire sur FBI)" }, { status: 401 });
    }
    const [idRencontre, positionStr, numeroNational] = assign.split(":");
    const position = Number(positionStr);
    if (!idRencontre || !Number.isInteger(position) || !numeroNational) {
      return NextResponse.json(
        { error: "Format attendu : ?assign=<idRencontre>:<position>:<numeroNational>" },
        { status: 400 }
      );
    }
    const dryRun = new URL(request.url).searchParams.get("dryRun") !== "0";
    try {
      const client = await loggedInClient(onDump);
      const result = await assignRefereeToFbiRencontre(client, idRencontre, { position, numeroNational, dryRun });
      return NextResponse.json({ ...(debugRunId ? { debugRunId } : {}), ...result });
    } catch (error) {
      return NextResponse.json(
        { ...(debugRunId ? { debugRunId } : {}), error: error instanceof Error ? error.message : "Erreur inconnue" },
        { status: 500 }
      );
    }
  }

  // ?push=<matchId> : pousse toutes les désignations AlloArbitre d'un match
  // vers FBI (une position à la fois, jamais d'écrasement d'une position déjà
  // occupée par quelqu'un d'autre). ?pushAll=1 : idem pour tous les matchs à
  // venir ayant au moins une désignation. Réservé aux admins.
  const pushMatchId = new URL(request.url).searchParams.get("push");
  const pushAll = new URL(request.url).searchParams.get("pushAll") === "1";
  if (pushMatchId || pushAll) {
    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized (admin requis pour écrire sur FBI)" }, { status: 401 });
    }
    try {
      const client = await loggedInClient(onDump);
      const now = new Date();
      const matches = pushAll
        ? (await findMatches({ from: now, status: "toutes" })).filter((m) => m.designations.length > 0)
        : (await findMatches({ status: "toutes" })).filter((m) => m.id === pushMatchId);

      if (!pushAll && matches.length === 0) {
        return NextResponse.json({ error: `Match ${pushMatchId} introuvable` }, { status: 404 });
      }

      const results = [];
      for (const m of matches) {
        results.push(
          await pushMatchToFbi(client, {
            id: m.id,
            date: m.date.toISOString(),
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            fbiIdRencontre: m.fbiIdRencontre,
            designations: m.designations.map((d) => ({ position: d.position, referee: d.referee })),
          })
        );
      }
      return NextResponse.json({ ...(debugRunId ? { debugRunId } : {}), results });
    } catch (error) {
      return NextResponse.json(
        { ...(debugRunId ? { debugRunId } : {}), error: error instanceof Error ? error.message : "Erreur inconnue" },
        { status: 500 }
      );
    }
  }

  // ?detail=<idRencontre> : fiche détail brute parsée (mise au point de /fbi/[id]).
  const detailId = new URL(request.url).searchParams.get("detail");
  if (detailId) {
    try {
      const detail = await fetchFbiDesignationDetail(detailId, onDump);
      return NextResponse.json({ ...(debugRunId ? { debugRunId } : {}), idRencontre: detailId, ...detail });
    } catch (error) {
      return NextResponse.json(
        { ...(debugRunId ? { debugRunId } : {}), error: error instanceof Error ? error.message : "Erreur inconnue" },
        { status: 500 }
      );
    }
  }

  try {
    const rows = await fetchFbiRencontres({ du: today, au: in14Days }, onDump);
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
