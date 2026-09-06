/** Géocodage d'adresses via l'API Google Maps Geocoding, et calcul de
 * distance/rémunération à partir de coordonnées GPS déjà géocodées.
 * Inactif (retourne null) tant que GOOGLE_MAPS_API_KEY n'est pas configurée -
 * l'app fonctionne normalement sans, elle ignore juste la priorisation par
 * proximité et le calcul de rémunération. */

export type LatLng = { lat: number; lng: number };

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !address.trim()) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status: string;
    results: { geometry: { location: { lat: number; lng: number } } }[];
  };
  if (data.status !== "OK" || data.results.length === 0) return null;

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
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
