import { supabaseAdmin } from "@/lib/supabase/admin";
import { geocodeAddress } from "@/lib/geocoding";

export type GeocodingBackfillSummary = {
  refereesGeocoded: number;
  matchesGeocoded: number;
  failed: string[];
};

/**
 * Géocode rétroactivement les arbitres et matchs dont l'adresse est connue
 * mais les coordonnées absentes (lat/lng null) - le cas de tout ce qui a été
 * créé avant que GOOGLE_MAPS_API_KEY ne soit configurée, ou importé
 * directement en base (SQL, import FBI) sans passer par les pages de
 * création qui géocodent à la volée. Un même gymnase revenant sur plusieurs
 * matchs n'est géocodé qu'une fois (cache par adresse dans cet appel).
 */
export async function backfillMissingCoordinates(): Promise<GeocodingBackfillSummary> {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY non configurée : rien à géocoder.");
  }

  const summary: GeocodingBackfillSummary = { refereesGeocoded: 0, matchesGeocoded: 0, failed: [] };
  const cache = new Map<string, { lat: number; lng: number } | null>();

  async function resolve(address: string) {
    const key = address.trim().toLowerCase();
    if (!cache.has(key)) cache.set(key, await geocodeAddress(address));
    return cache.get(key) ?? null;
  }

  const { data: referees, error: refError } = await supabaseAdmin
    .from("Referee")
    .select("id, address")
    .is("lat", null)
    .not("address", "is", null);
  if (refError) throw refError;

  for (const r of referees ?? []) {
    if (!r.address) continue;
    const coords = await resolve(r.address);
    if (!coords) {
      summary.failed.push(`Arbitre ${r.id} : adresse non géocodable ("${r.address}")`);
      continue;
    }
    const { error } = await supabaseAdmin.from("Referee").update({ lat: coords.lat, lng: coords.lng }).eq("id", r.id);
    if (error) throw error;
    summary.refereesGeocoded++;
  }

  const { data: matches, error: matchError } = await supabaseAdmin
    .from("Match")
    .select("id, venue, city, venueAddress")
    .is("lat", null);
  if (matchError) throw matchError;

  for (const m of matches ?? []) {
    const address = m.venueAddress || [m.venue, m.city].filter(Boolean).join(", ");
    if (!address) continue;
    const coords = await resolve(address);
    if (!coords) {
      summary.failed.push(`Match ${m.id} : lieu non géocodable ("${address}")`);
      continue;
    }
    const { error } = await supabaseAdmin.from("Match").update({ lat: coords.lat, lng: coords.lng }).eq("id", m.id);
    if (error) throw error;
    summary.matchesGeocoded++;
  }

  return summary;
}
