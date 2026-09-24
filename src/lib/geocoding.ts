/** Géocodage d'adresses via l'API Google Maps Geocoding, et calcul de
 * distance/rémunération à partir de coordonnées GPS déjà géocodées.
 * Inactif (retourne null) tant que GOOGLE_MAPS_API_KEY n'est pas configurée -
 * l'app fonctionne normalement sans, elle ignore juste la priorisation par
 * proximité et le calcul de rémunération. */

export type LatLng = { lat: number; lng: number };

export type GeocodeResult = {
  coords: LatLng | null;
  /** Statut Google (OK, ZERO_RESULTS, REQUEST_DENIED...) ou HTTP_<code>. */
  status: string;
  errorMessage?: string;
};

/**
 * Statuts qui signalent un problème de configuration de la clé (API non
 * activée, facturation, restriction de clé...) plutôt qu'une adresse
 * introuvable : inutile d'insister sur les adresses suivantes.
 */
export const GEOCODING_CONFIG_ERRORS = new Set(["REQUEST_DENIED", "OVER_DAILY_LIMIT", "OVER_QUERY_LIMIT", "INVALID_REQUEST"]);

/**
 * Nettoie les libellés tronqués par FBI ("GYMNASE JOSEPH MAURY (...",
 * "LA CHAPELLE-SAINT...") : les "..." et parenthèses ouvertes non fermées
 * font échouer ou dévier le géocodage.
 */
export function cleanPlaceName(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/\s*\([^)]*$/, "")
    .replace(/\.{2,}\s*$/, "")
    .replace(/[\s,-]+$/, "")
    .trim();
}

export async function geocodeAddressDetailed(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { coords: null, status: "NO_API_KEY" };
  if (!address.trim()) return { coords: null, status: "EMPTY_ADDRESS" };

  // region/components : toutes nos adresses sont en France, évite qu'un
  // "GYMNASE MUNICIPAL, SANDILLON" parte à l'étranger.
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&region=fr&components=country:FR&language=fr&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return { coords: null, status: `HTTP_${res.status}` };

  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    results: { geometry: { location: { lat: number; lng: number } } }[];
  };
  if (data.status !== "OK" || data.results.length === 0) {
    if (data.status !== "ZERO_RESULTS") {
      console.error(`[geocoding] ${data.status}${data.error_message ? ` : ${data.error_message}` : ""}`);
    }
    return { coords: null, status: data.status, errorMessage: data.error_message };
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { coords: { lat, lng }, status: "OK" };
}

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  return (await geocodeAddressDetailed(address)).coords;
}

/** Distance à vol d'oiseau en km (formule de Haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const MATCH_FLAT_FEE = 40;
const RATE_PER_KM = 0.35;

/** 40€/match + 0,35€/km comptés sur l'aller-retour (distance one-way * 2). */
export function estimatePayment(oneWayDistanceKm: number): number {
  return MATCH_FLAT_FEE + RATE_PER_KM * oneWayDistanceKm * 2;
}
