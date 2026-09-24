import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasSchedulingConflict } from "@/lib/dates";
import { parseFbiDateTime } from "./sync";
import { geocodeAddress } from "@/lib/geocoding";
import type { FbiOfficiel, FbiRencontreInfo } from "./detail";

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

function findInfo(infos: FbiRencontreInfo[], label: string): string | undefined {
  return infos.find((i) => i.label.toLowerCase() === label.toLowerCase())?.value;
}

/**
 * Une rencontre FBI peut être reprogrammée (date/heure/salle) après avoir été
 * importée dans AlloArbitre : sans reprise, le match affiché ici reste figé
 * sur l'ancien créneau (constaté en prod - date affichée différente de la
 * fiche détail FBI dépliée juste en dessous), ce qui fausse aussi bien
 * l'agenda visible que le calcul de conflit d'horaire (hasSchedulingConflict
 * travaillant sur le Match.date d'AlloArbitre). Appelé à chaque ouverture du
 * détail FBI d'un match ; ne touche rien si rien n'a changé.
 */
export async function syncMatchScheduleFromFbiDetail(
  matchId: string,
  infos: FbiRencontreInfo[]
): Promise<{ updated: boolean }> {
  const dateStr = findInfo(infos, "Date");
  const heureStr = findInfo(infos, "Heure");
  const salle = findInfo(infos, "Salle");
  const ville = findInfo(infos, "Ville");
  const fbiDate = dateStr && heureStr ? parseFbiDateTime(dateStr, heureStr) : null;

  const { data: match, error: matchError } = await supabaseAdmin
    .from("Match")
    .select("date, venue, city, lat, lng")
    .eq("id", matchId)
    .single();
  if (matchError) throw matchError;

  const update: Record<string, unknown> = {};
  if (fbiDate && fbiDate.getTime() !== new Date(match.date).getTime()) {
    update.date = fbiDate.toISOString();
  }
  const venueChanged = salle !== undefined && salle !== "" && salle !== match.venue;
  const cityChanged = ville !== undefined && ville !== "" && ville !== match.city;
  if (venueChanged) update.venue = salle;
  if (cityChanged) update.city = ville;

  if (Object.keys(update).length === 0) return { updated: false };

  // Le gymnase a changé : les coordonnées connues ne sont plus valables, il
  // faut les re-géocoder (sinon le calcul de trajet entre deux matchs
  // utiliserait l'ancien lieu).
  if (venueChanged || cityChanged) {
    const address = [update.venue ?? match.venue, update.city ?? match.city].filter(Boolean).join(", ");
    const coords = address ? await geocodeAddress(address) : null;
    update.lat = coords?.lat ?? null;
    update.lng = coords?.lng ?? null;
  }

  const { error } = await supabaseAdmin.from("Match").update(update).eq("id", matchId);
  if (error) throw error;
  return { updated: true };
}
