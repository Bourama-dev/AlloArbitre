import { supabaseAdmin } from "@/lib/supabase/admin";
import { cleanPlaceName, geocodeAddressDetailed, GEOCODING_CONFIG_ERRORS, type LatLng } from "@/lib/geocoding";

export type GeocodingBackfillSummary = {
  refereesGeocoded: number;
  matchesGeocoded: number;
  refereesFailed: number;
  /** Lieux de match non géocodables (gymnase, ville - pas de donnée personnelle). */
  venuesFailed: string[];
};

/**
 * Géocode rétroactivement les arbitres et matchs dont l'adresse est connue
 * mais les coordonnées absentes (lat/lng null) - le cas de tout ce qui a été
 * créé avant que GOOGLE_MAPS_API_KEY ne soit configurée, ou importé
 * directement en base (SQL, import FBI) sans passer par les pages de
 * création qui géocodent à la volée. Un même gymnase revenant sur plusieurs
 * matchs n'est géocodé qu'une fois (cache par adresse dans cet appel).
 *
 * S'arrête net avec une erreur explicite si Google refuse la clé
 * (REQUEST_DENIED...) au lieu de marquer chaque adresse en échec.
 */
export async function backfillMissingCoordinates(): Promise<GeocodingBackfillSummary> {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY non configurée : rien à géocoder.");
  }

  const summary: GeocodingBackfillSummary = { refereesGeocoded: 0, matchesGeocoded: 0, refereesFailed: 0, venuesFailed: [] };
  const cache = new Map<string, LatLng | null>();

  async function resolve(address: string): Promise<LatLng | null> {
    const key = address.trim().toLowerCase();
    if (!cache.has(key)) {
      const result = await geocodeAddressDetailed(address);
      if (GEOCODING_CONFIG_ERRORS.has(result.status)) {
        throw new Error(
          `Google Geocoding refuse la requête (${result.status}${result.errorMessage ? ` : ${result.errorMessage}` : ""}). ` +
            "Vérifier dans Google Cloud que l'API Geocoding est activée, que la facturation est active et que la clé " +
            "n'est pas restreinte aux référents HTTP (les appels partent du serveur)."
        );
      }
      cache.set(key, result.coords);
    }
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
      summary.refereesFailed++;
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

  const failedVenues = new Set<string>();
  for (const m of matches ?? []) {
    const address = m.venueAddress || [cleanPlaceName(m.venue), cleanPlaceName(m.city)].filter(Boolean).join(", ");
    if (!address) continue;
    const coords = await resolve(address);
    if (!coords) {
      failedVenues.add(address);
      continue;
    }
    const { error } = await supabaseAdmin.from("Match").update({ lat: coords.lat, lng: coords.lng }).eq("id", m.id);
    if (error) throw error;
    summary.matchesGeocoded++;
  }
  summary.venuesFailed = Array.from(failedVenues);

  return summary;
}
