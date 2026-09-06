"use server";

import { getCurrentUser } from "@/lib/current-user";
import { overlaps, formatDateTimeFr } from "@/lib/dates";
import {
  getMatchForSuggestion,
  suggestReferees,
  designateReferee,
  explainSuggestion,
} from "@/lib/suggestions";

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
  const pendingByReferee = new Map<string, { date: Date; durationMinutes: number }[]>();

  for (const matchId of matchIds) {
    const match = await getMatchForSuggestion(matchId);
    if (!match) continue;
    const slotsToFill = match.refereesRequired - match.designations.length;
    if (match.cancelled || slotsToFill <= 0) continue;

    const matchLabel = `${match.homeTeam} vs ${match.awayTeam} · ${formatDateTimeFr(match.date)}`;

    for (let i = 0; i < slotsToFill; i++) {
      const { suggestions } = await suggestReferees(matchId);
      const pickIndex = suggestions.findIndex((s) => {
        const pending = pendingByReferee.get(s.id) ?? [];
        return !pending.some((p) =>
          overlaps(match.date, match.durationMinutes, p.date, p.durationMinutes)
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
      list.push({ date: match.date, durationMinutes: match.durationMinutes });
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
