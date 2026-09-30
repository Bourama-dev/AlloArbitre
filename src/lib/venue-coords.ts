/**
 * Réutilisation des coordonnées d'un gymnase déjà connu : un match dont la
 * salle et la ville sont identiques à celles d'un match déjà géocodé reprend
 * ses coordonnées, sans appel à Google.
 *
 * Indispensable quand FBI tronque la ville ("SAINT-DENIS-DE-L'...") : Google
 * ne trouve plus l'adresse, alors que le gymnase a pu être géocodé une fois
 * (ou corrigé à la main) - toutes les rencontres suivantes en profitent.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LatLng } from "@/lib/geocoding";

/** Clé salle + ville, insensible à la casse, aux accents, à la ponctuation et aux espaces. */
export function venueKey(venue: string | null | undefined, city: string | null | undefined): string | null {
  const norm = (s: string | null | undefined) =>
    (s ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, " ")
      .trim();
  const v = norm(venue);
  if (!v) return null;
  return `${v}|${norm(city)}`;
}

/** Coordonnées connues de chaque gymnase (salle + ville) déjà géocodé. */
export async function loadKnownVenueCoords(): Promise<Map<string, LatLng>> {
  const known = new Map<string, LatLng>();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("Match")
      .select("venue, city, lat, lng")
      .not("lat", "is", null)
      .not("venue", "is", null)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const m of data ?? []) {
      const key = venueKey(m.venue as string, m.city as string | null);
      if (key && !known.has(key)) known.set(key, { lat: m.lat as number, lng: m.lng as number });
    }
    if ((data ?? []).length < PAGE) return known;
  }
}
