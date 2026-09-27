/**
 * Règles de désignation paramétrables par le comité (voir /admin/parametres,
 * /admin/niveaux et /admin/groupes) :
 * - distance kilométrique maximale domicile -> gymnase (Settings) ;
 * - âge minimum de l'arbitre par division (CompetitionLevel.minRefereeAge) ;
 * - groupes de désignation : une division rattachée à au moins un groupe
 *   n'est ouverte qu'aux arbitres membres d'un de ces groupes. Une division
 *   sans groupe reste ouverte à tous (comportement historique).
 */
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CommitteeSettings = { maxDistanceKm: number | null };

export async function getSettings(): Promise<CommitteeSettings> {
  const { data, error } = await supabaseAdmin.from("Settings").select("maxDistanceKm").eq("id", 1).maybeSingle();
  if (error) throw error;
  return { maxDistanceKm: (data?.maxDistanceKm as number | null) ?? null };
}

export type DivisionRules = {
  minRefereeAge: number | null;
  /** Groupes autorisés sur la division ; vide = division ouverte à tous. */
  allowedGroups: { id: string; label: string }[];
};

export async function getDivisionRules(competitionLevelId: string): Promise<DivisionRules> {
  const [{ data: level, error: levelError }, { data: groups, error: groupsError }] = await Promise.all([
    supabaseAdmin.from("CompetitionLevel").select("minRefereeAge").eq("id", competitionLevelId).maybeSingle(),
    supabaseAdmin
      .from("RefereeGroupDivision")
      .select("groupId, group:RefereeGroup(label)")
      .eq("competitionLevelId", competitionLevelId),
  ]);
  if (levelError) throw levelError;
  if (groupsError) throw groupsError;
  return {
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

/** Raisons bloquantes liées à la division (âge, groupe). Vide = autorisé. */
export function divisionReasons(
  rules: DivisionRules,
  referee: { birthDate: string | null; groupIds: string[] },
  matchDate: Date
): string[] {
  const reasons: string[] = [];
  if (rules.minRefereeAge != null) {
    const age = ageAt(referee.birthDate, matchDate);
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
