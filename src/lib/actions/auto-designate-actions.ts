"use server";

import { getCurrentUser } from "@/lib/current-user";
import { hasSchedulingConflict, formatDateTimeFr, type MatchSlot } from "@/lib/dates";
import {
  getMatchForSuggestion,
  suggestReferees,
  designateReferee,
  explainSuggestion,
} from "@/lib/suggestions";

/**
 * Ordre de priorité des niveaux de compétition (règle CD45) : les créneaux
 * les plus exigeants doivent être pourvus en premier pour ne pas épuiser sur
 * des matchs de niveau inférieur les arbitres qualifiés qui se font rares.
 * Comparaison sur le libellé (ex. "PRF", "PNM", "DM2 - A"...) : premier motif
 * qui matche, sinon priorité la plus basse.
 */
const LEVEL_PRIORITY = ["PRF", "PNM", "DM2", "DM3", "DM4"];
function levelPriorityRank(label: string): number {
  const upper = label.toUpperCase();
  const idx = LEVEL_PRIORITY.findIndex((p) => upper.includes(p));
  return idx === -1 ? LEVEL_PRIORITY.length : idx;
}

export type PlanItem = {
  matchId: string;
  matchLabel: string;
  refereeId: string | null;
  refereeName: string | null;
  reason: string;
};

/**
 * Calcule (sans rien enregistrer) le plan d'auto-désignation pour les matchs
 * sélectionnés : pour chaque créneau vacant, la meilleure suggestion
 * disponible et la raison de son choix. Un arbitre déjà retenu pour un
 * autre match de ce même lot n'est pas re-proposé sur un créneau qui le
 * chevaucherait. Affiché dans un récapitulatif que l'utilisateur doit
 * valider explicitement (voir applyAutoDesignation) avant toute création
 * réelle de désignation.
 */
export async function previewAutoDesignation(matchIds: string[]): Promise<PlanItem[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  const plan: PlanItem[] = [];
  const pendingByReferee = new Map<string, MatchSlot[]>();

  const matches = (
    await Promise.all(matchIds.map((id) => getMatchForSuggestion(id)))
  ).filter((m): m is NonNullable<typeof m> => !!m && !m.cancelled && m.refereesRequired > m.designations.length);

  // Les matchs de niveau prioritaire (PRF/PNM en tête) sont pourvus avant les
  // autres, pour que les arbitres qualifiés disponibles en nombre limité leur
  // soient affectés en priorité plutôt qu'à des matchs de niveau inférieur.
  matches.sort(
    (a, b) =>
      levelPriorityRank(a.competitionLevel.label) - levelPriorityRank(b.competitionLevel.label) ||
      a.date.getTime() - b.date.getTime()
  );

  for (const match of matches) {
    const matchId = match.id;
    const slotsToFill = match.refereesRequired - match.designations.length;

    const matchLabel = `${match.homeTeam} vs ${match.awayTeam} · ${formatDateTimeFr(match.date)}`;

    for (let i = 0; i < slotsToFill; i++) {
      const { suggestions } = await suggestReferees(matchId);
      const pickIndex = suggestions.findIndex((s) => {
        const pending = pendingByReferee.get(s.id) ?? [];
        return !pending.some((p) =>
          hasSchedulingConflict(
            { date: match.date, durationMinutes: match.durationMinutes, venue: match.venue, lat: match.lat, lng: match.lng },
            p
          )
        );
      });

      if (pickIndex === -1) {
        plan.push({
          matchId,
          matchLabel,
          refereeId: null,
          refereeName: null,
          reason: "Aucun arbitre disponible.",
        });
        continue;
      }

      const pick = suggestions[pickIndex];
      plan.push({
        matchId,
        matchLabel,
        refereeId: pick.id,
        refereeName: `${pick.firstName} ${pick.lastName}`,
        reason: explainSuggestion(pick, suggestions.length),
      });

      const list = pendingByReferee.get(pick.id) ?? [];
      list.push({ date: match.date, durationMinutes: match.durationMinutes, venue: match.venue, lat: match.lat, lng: match.lng });
      pendingByReferee.set(pick.id, list);
    }
  }

  return plan;
}

export type AutoDesignateSummary = {
  assigned: number;
  errors: string[];
};

/**
 * Applique réellement les couples (match, arbitre) validés par l'utilisateur
 * dans le récapitulatif d'auto-désignation. Chaque désignation repasse par
 * designateReferee, qui revérifie les règles (conflit d'horaire, quotas...)
 * au moment de l'écriture - un couple peut donc encore être rejeté si l'état
 * a changé depuis le calcul du plan.
 */
export async function applyAutoDesignation(
  picks: { matchId: string; refereeId: string }[]
): Promise<AutoDesignateSummary> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  const summary: AutoDesignateSummary = { assigned: 0, errors: [] };
  for (const pick of picks) {
    const result = await designateReferee(pick.matchId, pick.refereeId, user.id);
    if (result.ok) summary.assigned++;
    else summary.errors.push(result.error);
  }
  return summary;
}

/**
 * Désigne un même arbitre sur plusieurs matchs choisis manuellement (multi-
 * désignation depuis la fiche arbitre). Chaque match repasse par
 * designateReferee - un match est ignoré avec une erreur explicite s'il viole
 * une règle (conflit d'horaire, quota, niveau...).
 */
export async function applyRefereeToMatches(
  refereeId: string,
  matchIds: string[]
): Promise<AutoDesignateSummary> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");

  const summary: AutoDesignateSummary = { assigned: 0, errors: [] };
  for (const matchId of matchIds) {
    const result = await designateReferee(matchId, refereeId, user.id);
    if (result.ok) summary.assigned++;
    else summary.errors.push(result.error);
  }
  return summary;
}
