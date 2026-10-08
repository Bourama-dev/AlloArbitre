/**
 * Règles de désignation paramétrables par le comité (voir /reglement,
 * /admin/divisions) :
 * - distance kilométrique maximale domicile -> gymnase (Settings) ;
 * - âge minimum de l'arbitre par division (CompetitionLevel.minRefereeAge) ;
 * - groupes de désignation : une division rattachée à au moins un groupe
 *   n'est ouverte qu'aux arbitres membres d'un de ces groupes. Une division
 *   sans groupe reste ouverte à tous (comportement historique).
 */
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CommitteeSettings = {
  maxDistanceKm: number | null;
  /** Sans réponse aux disponibilités à la clôture : exclu des suggestions. */
  requireAvailability: boolean;
};

export async function getSettings(): Promise<CommitteeSettings> {
  const { data, error } = await supabaseAdmin.from("Settings").select("maxDistanceKm, requireAvailability").eq("id", 1).maybeSingle();
  if (error) throw error;
  return {
    maxDistanceKm: (data?.maxDistanceKm as number | null) ?? null,
    requireAvailability: (data?.requireAvailability as boolean | undefined) ?? false,
  };
}

export type DivisionRules = {
  /** Libellé de la division, pour reconnaître sa catégorie d'âge (U15, senior...). */
  label?: string | null;
  minRefereeAge: number | null;
  /** Groupes autorisés sur la division ; vide = division ouverte à tous. */
  allowedGroups: { id: string; label: string }[];
};

export async function getDivisionRules(competitionLevelId: string): Promise<DivisionRules> {
  const [{ data: level, error: levelError }, { data: groups, error: groupsError }] = await Promise.all([
    supabaseAdmin.from("CompetitionLevel").select("label, minRefereeAge").eq("id", competitionLevelId).maybeSingle(),
    supabaseAdmin
      .from("RefereeGroupDivision")
      .select("groupId, group:RefereeGroup(label)")
      .eq("competitionLevelId", competitionLevelId),
  ]);
  if (levelError) throw levelError;
  if (groupsError) throw groupsError;
  return {
    label: (level?.label as string | undefined) ?? null,
    minRefereeAge: (level?.minRefereeAge as number | null) ?? null,
    allowedGroups: ((groups ?? []) as unknown as { groupId: string; group: { label: string } | { label: string }[] }[]).map(
      (g) => ({ id: g.groupId, label: (Array.isArray(g.group) ? g.group[0]?.label : g.group?.label) ?? "?" })
    ),
  };
}

/** Âge révolu à `date` (dates de match à l'heure du gymnase, lues en UTC). */
export function ageAt(birthDate: string | null | undefined, date: Date): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.slice(0, 10).split("-").map(Number);
  let age = date.getUTCFullYear() - y;
  const beforeBirthday = date.getUTCMonth() + 1 < m || (date.getUTCMonth() + 1 === m && date.getUTCDate() < d);
  if (beforeBirthday) age--;
  return age;
}

export { divisionAgeCategory } from "@/lib/algo-rules-shared";

/**
 * Raisons bloquantes liées à la division (âge minimum fixé pour la division,
 * groupes). Les interdictions par niveau / âge d'arbitre sont des règles
 * modifiables (page Règles, voir checkRefereeRules). Vide = autorisé.
 */
export function divisionReasons(
  rules: DivisionRules,
  referee: { birthDate: string | null; groupIds: string[] },
  matchDate: Date
): string[] {
  const reasons: string[] = [];
  const refereeAge = ageAt(referee.birthDate, matchDate);
  if (rules.minRefereeAge != null) {
    const age = refereeAge;
    if (age != null && age < rules.minRefereeAge) {
      reasons.push(`Trop jeune : ${age} ans (minimum ${rules.minRefereeAge} ans sur cette division)`);
    }
  }
  if (rules.allowedGroups.length > 0 && !rules.allowedGroups.some((g) => referee.groupIds.includes(g.id))) {
    reasons.push(`Hors groupe autorisé (${rules.allowedGroups.map((g) => g.label).join(", ")})`);
  }
  return reasons;
}

export function maxDistanceReason(km: number | null, maxKm: number | null, byRoad: boolean): string | null {
  if (km == null || maxKm == null || km <= maxKm) return null;
  return `Trop loin : ${km.toFixed(1)} km ${byRoad ? "par la route" : "à vol d'oiseau"} (maximum ${maxKm} km fixé par le comité)`;
}
