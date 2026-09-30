import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasSchedulingConflict } from "@/lib/dates";
import type { FbiOfficiel } from "./detail";

/**
 * Reprend dans AlloArbitre les officiels déjà désignés sur FBI (saisis
 * directement sur FBI, avant que le match ne soit géré ici) : sans ça, la
 * colonne "Arbitres" affiche "0/2" alors que FBI a déjà un arbitre en place
 * (visible seulement dans le détail déplié). Ne crée jamais de doublon : une
 * position déjà désignée dans AlloArbitre (quel que soit l'arbitre) n'est
 * jamais touchée. Même garde-fou de conflit d'horaire que designateReferee :
 * si l'arbitre reconnu a déjà un autre match AlloArbitre qui chevauche
 * celui-ci, on n'importe pas cette désignation FBI (elle reste visible dans
 * le détail FBI déplié, mais n'entre pas dans AlloArbitre en doublon
 * d'agenda). Respecte aussi DesignationRemoval : si un admin a explicitement
 * retiré cet arbitre de ce match dans AlloArbitre, on ne le réimporte pas
 * juste parce que FBI (non modifié par ce retrait) l'a toujours - sinon la
 * suppression semblerait ne jamais avoir d'effet.
 */
export async function syncFbiOfficielsToDesignations(
  matchId: string,
  officiels: FbiOfficiel[],
  createdById: string
): Promise<{ created: number }> {
  const candidates = officiels.filter((o) => o.licence && (o.ordre === "1" || o.ordre === "2"));
  if (candidates.length === 0) return { created: 0 };

  const [
    { data: match, error: matchError },
    { data: existingDesignations, error: desigError },
    { data: matchingReferees, error: refError },
    { data: removals, error: removalError },
  ] = await Promise.all([
    supabaseAdmin.from("Match").select("date, durationMinutes, venue, lat, lng").eq("id", matchId).single(),
    supabaseAdmin.from("Designation").select("position").eq("matchId", matchId),
    supabaseAdmin
      .from("Referee")
      .select("id, nationalNumber")
      .in(
        "nationalNumber",
        candidates.map((o) => o.licence)
      ),
    supabaseAdmin.from("DesignationRemoval").select("refereeId").eq("matchId", matchId),
  ]);
  if (matchError) throw matchError;
  if (desigError) throw desigError;
  if (refError) throw refError;
  if (removalError) throw removalError;

  const matchDate = new Date(match.date);
  const occupiedPositions = new Set((existingDesignations ?? []).map((d) => d.position));
  const refereeIdByNational = new Map((matchingReferees ?? []).map((r) => [r.nationalNumber as string, r.id as string]));
  const removedRefereeIds = new Set((removals ?? []).map((r) => r.refereeId));

  let created = 0;
  for (const o of candidates) {
    const position = Number(o.ordre);
    if (occupiedPositions.has(position)) continue;
    const refereeId = refereeIdByNational.get(o.licence);
    if (!refereeId) continue;
    if (removedRefereeIds.has(refereeId)) continue;

    const { data: otherDesignations, error: otherError } = await supabaseAdmin
      .from("Designation")
      .select("match:Match!inner(date, durationMinutes, cancelled, venue, lat, lng)")
      .eq("refereeId", refereeId)
      .neq("matchId", matchId);
    if (otherError) throw otherError;

    const hasConflict = (
      (otherDesignations ?? []) as unknown as {
        match: { date: string; durationMinutes: number; cancelled: boolean; venue: string | null; lat: number | null; lng: number | null };
      }[]
    )
      .filter((d) => !d.match.cancelled)
      .some((d) =>
        hasSchedulingConflict(
          { date: matchDate, durationMinutes: match.durationMinutes, venue: match.venue, lat: match.lat, lng: match.lng },
          {
            date: new Date(d.match.date),
            durationMinutes: d.match.durationMinutes,
            venue: d.match.venue,
            lat: d.match.lat,
            lng: d.match.lng,
          }
        )
      );
    if (hasConflict) continue;

    const { error } = await supabaseAdmin
      .from("Designation")
      .insert({ matchId, refereeId, createdById, position })
      .select("id")
      .single();
    // Conflit (arbitre déjà désigné sur un autre match au même id via la contrainte unique
    // (matchId, refereeId)) : ignoré, ce n'est pas une vraie nouvelle désignation.
    if (error && error.code !== "23505") throw error;
    if (!error) created++;
  }

  return { created };
}
