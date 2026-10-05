"use server";

import { getCurrentUser } from "@/lib/current-user";
import { formatDateTimeFr } from "@/lib/dates";
import { divisionAgeCategory } from "@/lib/algo-rules";
import {
  getMatchForSuggestion,
  designateReferee,
  explainSuggestion,
  evaluateMatchCandidates,
  loadCandidateContext,
  type CandidateDesignation,
  type MatchForSuggestion,
} from "@/lib/suggestions";

/**
 * Ordre de priorité des divisions (règle CD45) : les catégories jeunes (U9 à
 * U21, TQR compris) sont pourvues avant les seniors, puis les divisions dont
 * le libellé n'est pas reconnu. Catégorie lue dans le libellé (voir
 * divisionAgeCategory) ; à l'intérieur d'un groupe, ordre chronologique.
 */
function divisionPriorityRank(label: string): number {
  const category = divisionAgeCategory(label);
  if (category == null) return 2;
  return category >= 99 ? 1 : 0;
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

  // Tous les matchs du lot, puis UN seul chargement des arbitres, de leurs
  // désignations autour de la période, des indisponibilités et des
  // disponibilités - au lieu d'un rechargement complet par place vacante.
  const matches = (await Promise.all(matchIds.map((id) => getMatchForSuggestion(id)))).filter(
    (m): m is MatchForSuggestion => m !== null
  );
  const plan: PlanItem[] = [];
  if (matches.length === 0) return plan;

  // Les matchs jeunes sont pourvus avant les seniors : les arbitres
  // disponibles en nombre limité leur sont affectés en priorité.
  matches.sort(
    (a, b) =>
      divisionPriorityRank(a.competitionLevel.label) - divisionPriorityRank(b.competitionLevel.label) ||
      a.date.getTime() - b.date.getTime()
  );

  const times = matches.map((m) => m.date.getTime());
  const ctx = await loadCandidateContext(new Date(Math.min(...times)), new Date(Math.max(...times)));
  // Désignations retenues dans ce lot, comptées comme déjà enregistrées pour
  // la suite du calcul (conflits d'horaire, quotas, doublés, équité).
  const planned = new Map<string, CandidateDesignation[]>();

  for (const match of matches) {
    const matchId = match.id;
    const slotsToFill = match.refereesRequired - match.designations.length;
    if (match.cancelled || slotsToFill <= 0) continue;

    const matchLabel = `${match.homeTeam} vs ${match.awayTeam} · ${formatDateTimeFr(match.date)}`;

    // Divisions que le CD45 ne désigne pas (seniors hors PRF/PRM) : jamais
    // remplies automatiquement, uniquement à la main (club demandeur).
    if (match.competitionLevel.autoDesignation === false) {
      plan.push({
        matchId,
        matchLabel,
        refereeId: null,
        refereeName: null,
        reason: `${match.competitionLevel.label} : division non désignée par le CD45 (seniors : PRF/PRM uniquement). À désigner à la main si le club l'a demandé.`,
      });
      continue;
    }

    const alsoAssigned = new Set<string>();
    for (let i = 0; i < slotsToFill; i++) {
      const { eligible: allSuggestions } = await evaluateMatchCandidates(match, ctx, { planned, alsoAssigned });
      // Auto-désignation : uniquement les arbitres qui ont répondu à la
      // campagne de disponibilités ET coché le créneau du match. Les autres
      // (sans réponse, jour hors campagne) restent désignables à la main.
      const suggestions = allSuggestions.filter((s) => s.availabilityStatus === "disponible");

      if (suggestions.length === 0) {
        const noCampaign = allSuggestions.length > 0 && allSuggestions.every((s) => s.availabilityStatus === "hors-campagne");
        const withoutAnswer = allSuggestions.filter((s) => s.availabilityStatus === "sans-reponse").length;
        plan.push({
          matchId,
          matchLabel,
          refereeId: null,
          refereeName: null,
          reason: noCampaign
            ? "Aucune campagne de disponibilités ne couvre ce jour : à désigner à la main."
            : `Aucun arbitre ayant déclaré ses disponibilités n'est libre sur ce créneau` +
              (withoutAnswer > 0 ? ` (${withoutAnswer} arbitre(s) compatible(s) sans réponse, à désigner à la main si besoin).` : "."),
        });
        continue;
      }

      const pick = suggestions[0];
      plan.push({
        matchId,
        matchLabel,
        refereeId: pick.id,
        refereeName: `${pick.firstName} ${pick.lastName}`,
        reason: explainSuggestion(pick, suggestions.length),
      });

      alsoAssigned.add(pick.id);
      planned.set(pick.id, [
        ...(planned.get(pick.id) ?? []),
        {
          matchId,
          date: match.date,
          durationMinutes: match.durationMinutes,
          venue: match.venue,
          lat: match.lat,
          lng: match.lng,
        },
      ]);
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
