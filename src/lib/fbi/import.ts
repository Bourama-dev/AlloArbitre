import { supabaseAdmin } from "@/lib/supabase/admin";
import { matchDurationMinutes } from "@/lib/import-matches";
import { cleanPlaceName, geocodeAddress } from "@/lib/geocoding";
import { loadKnownVenueCoords, venueKey } from "@/lib/venue-coords";
import type { FbiDesignationRow } from "./searchDesignations";
import { parseFbiDateTime, teamNamesMatch } from "./sync";

export type FbiImportSummary = {
  created: number;
  updated: number;
  /** Copies en double d'une même rencontre FBI supprimées (sans désignation). */
  duplicatesRemoved: number;
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
  const summary: FbiImportSummary = { created: 0, updated: 0, duplicatesRemoved: 0, competitionLevelsCreated: [], errors: [] };

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
  // Gymnases déjà géocodés : repris tels quels (ville tronquée par FBI,
  // coordonnées corrigées à la main...), sans appel à Google.
  const knownVenues = await loadKnownVenueCoords();
  async function resolveVenueCoords(venue: string | null, ville: string | null) {
    const known = knownVenues.get(venueKey(venue, ville) ?? "");
    if (known) return known;
    // FBI tronque salle/ville ("GYMNASE JOSEPH MAURY (...") : nettoyées avant géocodage.
    const address = [cleanPlaceName(venue), cleanPlaceName(ville)].filter(Boolean).join(", ");
    if (!address || !process.env.GOOGLE_MAPS_API_KEY) return null;
    const key = address.trim().toLowerCase();
    if (!geocodeCache.has(key)) geocodeCache.set(key, await geocodeAddress(address));
    const coords = geocodeCache.get(key) ?? null;
    const vk = venueKey(venue, ville);
    if (coords && vk) knownVenues.set(vk, coords);
    return coords;
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
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      // 1) Par identifiant FBI : il ne change pas quand FBI renumérote le
      //    suffixe des équipes ("USM OLIVET (2)" -> "(1)") ni quand la
      //    rencontre est reportée - la comparaison des noms recréait alors
      //    la même rencontre en double.
      let existing: { id: string; homeTeam: string; awayTeam: string; lat: number | null; lng: number | null } | undefined;
      let matchedById = false;
      if (row.idRencontre) {
        const { data: byId, error: byIdError } = await supabaseAdmin
          .from("Match")
          .select("id, homeTeam, awayTeam, lat, lng")
          .eq("fbiIdRencontre", row.idRencontre)
          .order("createdAt", { ascending: true })
          .limit(1);
        if (byIdError) throw byIdError;
        existing = byId?.[0];
        matchedById = !!existing;
      }

      // 2) Sinon, même jour + même division + équipes compatibles, en
      //    ignorant les matchs déjà rattachés à une AUTRE rencontre FBI
      //    (deux rencontres distinctes aux noms proches ne doivent pas fusionner).
      if (!existing) {
        const { data: candidates, error: findError } = await supabaseAdmin
          .from("Match")
          .select("id, homeTeam, awayTeam, lat, lng, fbiIdRencontre")
          .gte("date", dayStart.toISOString())
          .lt("date", dayEnd.toISOString())
          .eq("competitionLevelId", competitionLevelId);
        if (findError) throw findError;
        existing = (candidates ?? []).find(
          (m) =>
            (!m.fbiIdRencontre || !row.idRencontre || m.fbiIdRencontre === row.idRencontre) &&
            teamNamesMatch(row.equipe1, m.homeTeam) &&
            teamNamesMatch(row.equipe2, m.awayTeam)
        );
      }

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
            // Rencontre retrouvée par son identifiant : libellés d'équipes
            // réalignés sur FBI (suffixe renuméroté, nom corrigé).
            ...(matchedById ? { homeTeam, awayTeam, competitionLevelId } : {}),
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

  await removeDuplicateRencontres(
    rows.map((r) => r.idRencontre).filter((id): id is string => !!id),
    summary
  );

  return summary;
}

/**
 * Doublons créés par les anciens imports (même idRencontre FBI sur plusieurs
 * matchs, quand FBI renumérotait le suffixe des équipes) : on garde le match
 * qui porte des désignations, sinon le plus ancien, et on supprime les copies
 * SANS désignation. Deux copies désignées ne sont jamais supprimées : signalées.
 */
async function removeDuplicateRencontres(ids: string[], summary: FbiImportSummary) {
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 100) {
    const { data, error } = await supabaseAdmin
      .from("Match")
      .select("id, fbiIdRencontre, homeTeam, awayTeam, createdAt, designations:Designation(id)")
      .in("fbiIdRencontre", unique.slice(i, i + 100));
    if (error) throw error;

    const byId = new Map<string, { id: string; homeTeam: string; awayTeam: string; createdAt: string; n: number }[]>();
    for (const m of (data ?? []) as unknown as {
      id: string;
      fbiIdRencontre: string;
      homeTeam: string;
      awayTeam: string;
      createdAt: string;
      designations: { id: string }[];
    }[]) {
      const list = byId.get(m.fbiIdRencontre) ?? [];
      list.push({ id: m.id, homeTeam: m.homeTeam, awayTeam: m.awayTeam, createdAt: m.createdAt, n: m.designations.length });
      byId.set(m.fbiIdRencontre, list);
    }

    for (const [fbiId, list] of byId) {
      if (list.length < 2) continue;
      list.sort((a, b) => b.n - a.n || a.createdAt.localeCompare(b.createdAt));
      const [keep, ...copies] = list;
      if (copies.some((c) => c.n > 0)) {
        summary.errors.push(
          `Rencontre FBI ${fbiId} (${keep.homeTeam} - ${keep.awayTeam}) présente ${list.length} fois avec des désignations sur plusieurs copies : à fusionner à la main.`
        );
      }
      const toDelete = copies.filter((c) => c.n === 0).map((c) => c.id);
      if (toDelete.length === 0) continue;
      const { error: delError } = await supabaseAdmin.from("Match").delete().in("id", toDelete);
      if (delError) throw delError;
      summary.duplicatesRemoved += toDelete.length;
    }
  }
}
