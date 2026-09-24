import { NextResponse } from "next/server";
import type { FbiDump } from "@/lib/fbi/client";
import { fetchFbiDesignationDetail, fetchFbiRencontres, formatDateFr, loggedInClient } from "@/lib/fbi/fetch";
import { assignRefereeToFbiRencontre, checkFbiOfficielEligibility } from "@/lib/fbi/write";
import { pushMatchToFbi } from "@/lib/fbi/push";
import { importFbiRencontresAsMatches } from "@/lib/fbi/import";
import { syncFbiOfficielsToDesignations } from "@/lib/fbi/designation-sync";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { compareWithAlloArbitre } from "@/lib/fbi/sync";
import { getCurrentUser } from "@/lib/current-user";
import { findMatches } from "@/lib/matches";
import { fetchDesignationsExport, fetchDesignationsExportRows } from "@/lib/fbi/searchDesignations";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron (déclaré dans vercel.json, tous les jours à 7h) : se logue sur FBI,
 * récupère les rencontres des 14 prochains jours, importe/complète les
 * matchs AlloArbitre correspondants (import.ts - idempotent, jamais de
 * doublon), puis compare l'état des désignations entre les deux systèmes.
 * N'écrit jamais sur FBI depuis ce chemin (l'écriture FBI se fait via
 * ?assign=/?push=/?pushAll=, plus bas, explicitement).
 *
 * Protégé par CRON_SECRET (header Authorization: Bearer <secret>), comme
 * recommandé par Vercel pour les cron jobs. Tout utilisateur déjà connecté
 * dans le navigateur peut aussi appeler cette route en lecture (même accès
 * que la page /fbi, qui appelle `?detail=` pour la fiche dépliée sous chaque
 * rencontre) ; seuls le cron et les admins déclenchent l'import de matchs.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const hasValidSecret = Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  let currentUser: Awaited<ReturnType<typeof getCurrentUser>> = null;
  if (!hasValidSecret) {
    currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  // Le cron (lecture + écriture des matchs) et les admins peuvent déclencher
  // l'import du calendrier FBI ; un utilisateur non-admin reste en lecture
  // seule sur cette route (comparaison uniquement, jamais d'écriture DB).
  const canImportMatches = hasValidSecret || currentUser?.role === "ADMIN";

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
  // ?verifier=JJ/MM/AAAA[&codes=RFU13,RMU15...][&offset=N] (admin, lecture
  // seule) : demande à FBI, pour chaque désignation AlloArbitre du jour, s'il
  // accepterait l'officiel sur la rencontre (contrôle de neutralité FBI,
  // bloquant sur les divisions jeunes CVL). Par lots bornés dans le temps,
  // comme le push : rappeler avec nextOffset.
  const verifierDate = new URL(request.url).searchParams.get("verifier");
  if (verifierDate) {
    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized (admin requis)" }, { status: 401 });
    }
    const m = verifierDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return NextResponse.json({ error: "Format attendu : ?verifier=JJ/MM/AAAA" }, { status: 400 });
    const codes = (new URL(request.url).searchParams.get("codes") ?? "").split(",").map((c) => c.trim()).filter(Boolean);
    const offset = Math.max(0, Number(new URL(request.url).searchParams.get("offset")) || 0);
    try {
      const dayStart = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`);
      const matches = (await findMatches({ from: dayStart, to: new Date(dayStart.getTime() + 86_400_000), status: "toutes" }))
        .filter((x) => x.fbiIdRencontre && (codes.length === 0 || codes.includes(x.competitionLevel.label)));
      const items = matches.flatMap((x) => x.designations.map((d) => ({ match: x, d })));

      const client = await loggedInClient(onDump);
      await client.get("rechercherDesignation.fbi");
      const startedAt = Date.now();
      const results = [];
      let i = offset;
      for (; i < items.length; i++) {
        if (i > offset && Date.now() - startedAt > 40_000) break;
        const { match, d } = items[i];
        const base = {
          matchId: match.id,
          designationId: d.id,
          niveau: match.competitionLevel.label,
          match: `${match.homeTeam} - ${match.awayTeam}`,
          position: d.position,
          arbitre: `${d.referee.firstName} ${d.referee.lastName}`,
        };
        if (!d.referee.nationalNumber) {
          results.push({ ...base, ok: false, message: "Numéro national manquant dans AlloArbitre" });
          continue;
        }
        const check = await checkFbiOfficielEligibility(client, match.fbiIdRencontre!, verifierDate, d.referee.nationalNumber);
        results.push({ ...base, ...check });
      }
      return NextResponse.json({ total: items.length, nextOffset: i < items.length ? i : null, results });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur inconnue" }, { status: 500 });
    }
  }

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

      // Chaque match = plusieurs allers-retours FBI : au-delà de ~60 s Vercel
      // coupe la fonction et renvoie une page d'erreur HTML. On traite donc
      // par lots bornés dans le temps, le client rappelle avec ?offset=
      // (nextOffset) jusqu'à la fin. L'ordre (date croissante) est stable
      // d'un appel à l'autre : pousser ne change pas la liste des matchs.
      const TIME_BUDGET_MS = 40_000;
      const startedAt = Date.now();
      const offset = pushAll ? Math.max(0, Number(new URL(request.url).searchParams.get("offset")) || 0) : 0;

      const results = [];
      let index = offset;
      for (; index < matches.length; index++) {
        if (pushAll && index > offset && Date.now() - startedAt > TIME_BUDGET_MS) break;
        const m = matches[index];
        results.push(
          await pushMatchToFbi(client, {
            id: m.id,
            date: m.date.toISOString(),
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            fbiIdRencontre: m.fbiIdRencontre,
            designations: m.designations.map((d) => ({ position: d.position, referee: d.referee, conflict: d.conflict })),
          })
        );
      }
      return NextResponse.json({
        ...(debugRunId ? { debugRunId } : {}),
        results,
        total: matches.length,
        nextOffset: index < matches.length ? index : null,
      });
    } catch (error) {
      return NextResponse.json(
        { ...(debugRunId ? { debugRunId } : {}), error: error instanceof Error ? error.message : "Erreur inconnue" },
        { status: 500 }
      );
    }
  }

  // ?detail=<idRencontre> : fiche détail brute parsée (mise au point de /fbi/[id]
  // et détail déplié de /fbi). Reprend au passage dans AlloArbitre les
  // officiels déjà désignés sur FBI (saisis directement là-bas) pour un
  // arbitre déjà connu, sans jamais écraser une désignation existante.
  // ?export=JJ/MM/AAAA (admin, lecture seule) : réponse brute de l'export
  // "Excel" FBI de la journée, pour vérifier s'il liste les officiels.
  const exportDate = new URL(request.url).searchParams.get("export");
  if (exportDate) {
    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized (admin requis)" }, { status: 401 });
    }
    try {
      const client = await loggedInClient(onDump);
      const params = { dateDebut: exportDate, dateFin: exportDate };
      // &full=1 : toutes les rencontres, parsées (officiels compris).
      if (new URL(request.url).searchParams.get("full") === "1") {
        const rencontres = await fetchDesignationsExportRows(client, params);
        return NextResponse.json({ ...(debugRunId ? { debugRunId } : {}), total: rencontres.length, rencontres });
      }
      const rows = await fetchDesignationsExport(client, params);
      return NextResponse.json({ ...(debugRunId ? { debugRunId } : {}), lignes: rows.length, apercu: rows.slice(0, 12) });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur inconnue" }, { status: 500 });
    }
  }

  const detailId = new URL(request.url).searchParams.get("detail");
  if (detailId) {
    try {
      const detail = await fetchFbiDesignationDetail(detailId, onDump);
      let designationsSynced = 0;
      if (currentUser) {
        const { data: match } = await supabaseAdmin
          .from("Match")
          .select("id")
          .eq("fbiIdRencontre", detailId)
          .maybeSingle();
        if (match) {
          const { created } = await syncFbiOfficielsToDesignations(match.id, detail.officiels, currentUser.id);
          designationsSynced = created;
        }
      }
      return NextResponse.json({
        ...(debugRunId ? { debugRunId } : {}),
        idRencontre: detailId,
        ...detail,
        designationsSynced,
      });
    } catch (error) {
      return NextResponse.json(
        { ...(debugRunId ? { debugRunId } : {}), error: error instanceof Error ? error.message : "Erreur inconnue" },
        { status: 500 }
      );
    }
  }

  try {
    const rows = await fetchFbiRencontres({ du: today, au: in14Days }, onDump);
    const importSummary = canImportMatches ? await importFbiRencontresAsMatches(rows) : null;
    const mismatches = await compareWithAlloArbitre(rows);

    return NextResponse.json({
      ...(debugRunId ? { debugRunId } : {}),
      periode: { du: formatDateFr(today), au: formatDateFr(in14Days) },
      rencontresFbi: rows.length,
      import: importSummary,
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
