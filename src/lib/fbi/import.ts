import { supabaseAdmin } from "@/lib/supabase/admin";
import { matchDurationMinutes } from "@/lib/import-matches";
import { geocodeAddress } from "@/lib/geocoding";
import type { FbiDesignationRow } from "./searchDesignations";
import { parseFbiDateTime, teamNamesMatch } from "./sync";

export type FbiImportSummary = {
  created: number;
  updated: number;
  competitionLevelsCreated: string[];
  errors: string[];
};

/**
 * Crée/complète les matchs AlloArbitre à partir du calendrier FBI, pour que
 * la désignation (et donc le push vers FBI) ait toujours les rencontres à
 * venir sous la main, sans dépendre d'un import Excel manuel. Idempotent :
 * un match déjà présent (même jour + niveau + équipes compatibles) est
 * complété (date/heure, salle, ville, poule, idRencontre) plutôt que
 * dupliqué. Les niveaux de compétition inconnus sont créés automatiquement
 * (même logique que l'import Excel, cf. import-matches.ts).
 */
export async function importFbiRencontresAsMatches(rows: FbiDesignationRow[]): Promise<FbiImportSummary> {
  const summary: FbiImportSummary = { created: 0, updated: 0, competitionLevelsCreated: [], errors: [] };

  const { data: levels, error: levelsError } = await supabaseAdmin.from("CompetitionLevel").select("id, label");
  if (levelsError) throw levelsError;
  const levelIdByLabel = new Map((levels ?? []).map((l) => [l.label as string, l.id as string]));

  for (const code of new Set(rows.map((r) => r.code).filter(Boolean))) {
    if (levelIdByLabel.has(code)) continue;
    const { data, error } = await supabaseAdmin.from("CompetitionLevel").insert({ label: code }).select("id").single();
    if (error) throw error;
    levelIdByLabel.set(code, data.id as string);
    summary.competitionLevelsCreated.push(code);
  }

  // Un même gymnase revient sur beaucoup de rencontres du même import : ne le
  // géocode qu'une fois par exécution plutôt qu'une fois par rencontre.
  const geocodeCache = new Map<string, { lat: number; lng: number } | null>();
  async function resolveVenueCoords(venue: string | null, ville: string | null) {
    const address = [venue, ville].filter(Boolean).join(", ");
    if (!address || !process.env.GOOGLE_MAPS_API_KEY) return null;
    const key = address.trim().toLowerCase();
    if (!geocodeCache.has(key)) geocodeCache.set(key, await geocodeAddress(address));
    return geocodeCache.get(key) ?? null;
  }

  for (const row of rows) {
    try {
      if (!row.equipe1 || !row.equipe2 || !row.code) continue;
      const fbiDate = parseFbiDateTime(row.date, row.heure);
      if (!fbiDate) {
        summary.errors.push(`Date FBI illisible pour ${row.equipe1} - ${row.equipe2} (${row.date} ${row.heure})`);
        continue;
      }
      const competitionLevelId = levelIdByLabel.get(row.code);
      if (!competitionLevelId) {
        summary.errors.push(`Niveau introuvable pour ${row.equipe1} - ${row.equipe2}`);
        continue;
      }

      const homeTeam = row.equipe1.replace(/\.{3}$/, "").trim();
      const awayTeam = row.equipe2.replace(/\.{3}$/, "").trim();
      const dayStart = new Date(fbiDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const { data: candidates, error: findError } = await supabaseAdmin
        .from("Match")
        .select("id, homeTeam, awayTeam, lat, lng")
        .gte("date", dayStart.toISOString())
        .lt("date", dayEnd.toISOString())
        .eq("competitionLevelId", competitionLevelId);
      if (findError) throw findError;

      const existing = (candidates ?? []).find(
        (m) => teamNamesMatch(row.equipe1, m.homeTeam) && teamNamesMatch(row.equipe2, m.awayTeam)
      );

      const durationMinutes = matchDurationMinutes(row.code);
      // Un match déjà géocodé n'est pas re-résolu à chaque import (le
      // gymnase ne change pas d'une exécution à l'autre) ; sinon un échec de
      // géocodage ne doit jamais effacer des coordonnées déjà connues.
      const coords = existing?.lat != null ? null : await resolveVenueCoords(row.salle, row.ville);

      if (existing) {
        const { error } = await supabaseAdmin
          .from("Match")
          .update({
            date: fbiDate.toISOString(),
            venue: row.salle || null,
            city: row.ville || null,
            poule: row.poule || null,
            durationMinutes,
            fbiIdRencontre: row.idRencontre,
            ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
          })
          .eq("id", existing.id);
        if (error) throw error;
        summary.updated++;
      } else {
        const { error } = await supabaseAdmin.from("Match").insert({
          date: fbiDate.toISOString(),
          homeTeam,
          awayTeam,
          venue: row.salle || null,
          city: row.ville || null,
          poule: row.poule || null,
          refereesRequired: 2,
          competitionLevelId,
          durationMinutes,
          fbiIdRencontre: row.idRencontre,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        });
        if (error) throw error;
        summary.created++;
      }
    } catch (err) {
      summary.errors.push(
        `${row.equipe1} - ${row.equipe2} (${row.date}) : ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return summary;
}
