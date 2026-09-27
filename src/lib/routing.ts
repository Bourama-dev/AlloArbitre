/**
 * Distances routières réelles (domicile de l'arbitre -> gymnase) via l'API
 * Google Routes (computeRouteMatrix), avec un cache en base (table
 * RouteDistance) : un couple domicile/gymnase n'est demandé qu'une seule
 * fois, puis relu - les adresses bougent rarement d'une saison à l'autre.
 *
 * Même clé que le géocodage (GOOGLE_MAPS_API_KEY), mais l'API "Routes" doit
 * être activée sur le projet Google Cloud. Sans clé, API désactivée ou en
 * erreur : les couples non résolus sont simplement absents du résultat et
 * l'appelant retombe sur la distance à vol d'oiseau.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LatLng } from "@/lib/geocoding";

export type RoadDistance = { km: number; minutes: number };

/** Coordonnées arrondies à ~10 m : même domicile / même gymnase = même clé. */
export function coordKey(p: LatLng): string {
  return `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
}

const ROUTE_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
// 1 destination x 50 origines = 50 éléments par requête, bien sous la limite
// de l'API ; les lots partent en parallèle.
const ORIGINS_PER_REQUEST = 50;

let routesDisabledLogged = false;

async function fetchMatrix(dest: LatLng, origins: LatLng[], apiKey: string): Promise<(RoadDistance | null)[]> {
  const waypoint = (p: LatLng) => ({ waypoint: { location: { latLng: { latitude: p.lat, longitude: p.lng } } } });
  const res = await fetch(ROUTE_MATRIX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration,condition",
    },
    body: JSON.stringify({
      origins: origins.map(waypoint),
      destinations: [waypoint(dest)],
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
    }),
  });
  if (!res.ok) {
    if (!routesDisabledLogged) {
      routesDisabledLogged = true;
      console.error(`[routing] Google Routes HTTP ${res.status} : ${(await res.text()).slice(0, 300)}`);
    }
    return origins.map(() => null);
  }
  const elements = (await res.json()) as {
    originIndex: number;
    distanceMeters?: number;
    duration?: string;
    condition?: string;
  }[];
  const out: (RoadDistance | null)[] = origins.map(() => null);
  for (const e of elements) {
    if (e.condition !== "ROUTE_EXISTS" || e.distanceMeters == null) continue;
    out[e.originIndex] = {
      km: e.distanceMeters / 1000,
      minutes: e.duration ? parseInt(e.duration, 10) / 60 : 0,
    };
  }
  return out;
}

/**
 * Distances routières de chaque origine vers `dest`, indexées par
 * coordKey(origine). Lit le cache, n'interroge Google que pour les couples
 * manquants et les enregistre.
 */
export async function roadDistancesTo(dest: LatLng, origins: LatLng[]): Promise<Map<string, RoadDistance>> {
  const result = new Map<string, RoadDistance>();
  const destKey = coordKey(dest);
  const byKey = new Map<string, LatLng>();
  for (const o of origins) byKey.set(coordKey(o), o);
  if (byKey.size === 0) return result;

  const keys = [...byKey.keys()];
  const { data: cached, error } = await supabaseAdmin
    .from("RouteDistance")
    .select("originKey, distanceKm, durationMinutes")
    .eq("destKey", destKey)
    .in("originKey", keys);
  if (error) {
    console.error("[routing] lecture du cache :", error.message);
  }
  for (const row of cached ?? []) {
    result.set(row.originKey as string, { km: row.distanceKm as number, minutes: row.durationMinutes as number });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const missing = keys.filter((k) => !result.has(k));
  if (!apiKey || missing.length === 0) return result;

  const batches: string[][] = [];
  for (let i = 0; i < missing.length; i += ORIGINS_PER_REQUEST) {
    batches.push(missing.slice(i, i + ORIGINS_PER_REQUEST));
  }
  try {
    const answers = await Promise.all(batches.map((b) => fetchMatrix(dest, b.map((k) => byKey.get(k)!), apiKey)));
    const rows: { originKey: string; destKey: string; distanceKm: number; durationMinutes: number }[] = [];
    batches.forEach((batch, bi) =>
      batch.forEach((key, i) => {
        const d = answers[bi][i];
        if (!d) return;
        result.set(key, d);
        rows.push({ originKey: key, destKey, distanceKm: d.km, durationMinutes: d.minutes });
      })
    );
    if (rows.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from("RouteDistance")
        .upsert(rows, { onConflict: "originKey,destKey" });
      if (upsertError) console.error("[routing] écriture du cache :", upsertError.message);
    }
  } catch (err) {
    console.error("[routing] Google Routes indisponible :", err instanceof Error ? err.message : err);
  }
  return result;
}

/** Distance routière d'un seul couple (cache puis Google), ou null. */
export async function roadDistance(origin: LatLng, dest: LatLng): Promise<RoadDistance | null> {
  return (await roadDistancesTo(dest, [origin])).get(coordKey(origin)) ?? null;
}

/** Lecture du cache uniquement (aucun appel Google) : pour les écrans de contrôle en masse. */
export async function cachedRoadDistances(
  pairs: { origin: LatLng; dest: LatLng }[]
): Promise<Map<string, RoadDistance>> {
  const out = new Map<string, RoadDistance>();
  const destKeys = [...new Set(pairs.map((p) => coordKey(p.dest)))];
  if (destKeys.length === 0) return out;
  const originKeys = [...new Set(pairs.map((p) => coordKey(p.origin)))];
  // Lots de clés : une URL PostgREST trop longue est refusée.
  const CHUNK = 80;
  for (let i = 0; i < originKeys.length; i += CHUNK) {
    for (let j = 0; j < destKeys.length; j += CHUNK) {
      const { data, error } = await supabaseAdmin
        .from("RouteDistance")
        .select("originKey, destKey, distanceKm, durationMinutes")
        .in("destKey", destKeys.slice(j, j + CHUNK))
        .in("originKey", originKeys.slice(i, i + CHUNK));
      if (error) {
        console.error("[routing] lecture du cache :", error.message);
        return out;
      }
      for (const row of data ?? []) {
        out.set(`${row.originKey}>${row.destKey}`, { km: row.distanceKm as number, minutes: row.durationMinutes as number });
      }
    }
  }
  return out;
}
