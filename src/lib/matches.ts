import { supabaseAdmin } from "@/lib/supabase/admin";
import { matchStatus } from "@/lib/match-status";
import type { MatchStatus } from "@/lib/match-status";
import { MAX_PER_DAY } from "@/lib/designation-rules";

export type { MatchStatus } from "@/lib/match-status";
export { matchStatus } from "@/lib/match-status";

export type MatchWithRelations = {
  id: string;
  date: Date;
  durationMinutes: number;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  city: string | null;
  venueAddress: string | null;
  lat: number | null;
  lng: number | null;
  poule: string | null;
  notes: string | null;
  refereesRequired: number;
  cancelled: boolean;
  competitionLevelId: string;
  competitionLevel: { id: string; label: string };
  designations: {
    id: string;
    refereeId: string;
    position: number;
    referee: {
      id: string;
      firstName: string;
      lastName: string;
      lat: number | null;
      lng: number | null;
      nationalNumber: string | null;
    };
  }[];
};

const MATCH_SELECT = `
  id, date, durationMinutes, homeTeam, awayTeam, venue, city, venueAddress, lat, lng, poule, notes, refereesRequired, cancelled, competitionLevelId,
  competitionLevel:CompetitionLevel(id, label),
  designations:Designation(id, refereeId, position, referee:Referee(id, firstName, lastName, lat, lng, nationalNumber))
`;

function mapMatch(row: {
  id: string;
  date: string;
  durationMinutes: number;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  city: string | null;
  venueAddress: string | null;
  lat: number | null;
  lng: number | null;
  poule: string | null;
  notes: string | null;
  refereesRequired: number;
  cancelled: boolean;
  competitionLevelId: string;
  competitionLevel: { id: string; label: string };
  designations: MatchWithRelations["designations"] | null;
}): MatchWithRelations {
  return {
    ...row,
    date: new Date(row.date),
    designations: (row.designations ?? []).slice().sort((a, b) => a.position - b.position),
  };
}

export async function listCompetitionLevels() {
  const { data, error } = await supabaseAdmin
    .from("CompetitionLevel")
    .select("id, label")
    .order("label", { ascending: true });
  if (error) throw error;
  return data as { id: string; label: string }[];
}

export async function listMatchCities() {
  const { data, error } = await supabaseAdmin
    .from("Match")
    .select("city")
    .not("city", "is", null);
  if (error) throw error;
  const cities = Array.from(new Set((data ?? []).map((r) => r.city as string)));
  return cities.sort();
}

export async function listMatchVenues() {
  const { data, error } = await supabaseAdmin
    .from("Match")
    .select("venue")
    .not("venue", "is", null);
  if (error) throw error;
  const venues = Array.from(new Set((data ?? []).map((r) => r.venue as string)));
  return venues.sort();
}

export type ActiveReferee = { id: string; firstName: string; lastName: string; levelLabel: string };

/** Liste légère des arbitres actifs (id, nom, niveau) pour la désignation directe depuis un select. */
export async function listActiveReferees(): Promise<ActiveReferee[]> {
  const { data, error } = await supabaseAdmin
    .from("Referee")
    .select("id, firstName, lastName, level:RefereeLevel(label)")
    .eq("active", true)
    .order("lastName", { ascending: true })
    .order("firstName", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as { id: string; firstName: string; lastName: string; level: unknown }[]).map(
    (r) => {
      const rawLevel = r.level as unknown;
      const level = (Array.isArray(rawLevel) ? rawLevel[0] : rawLevel) as { label: string } | null;
      return { id: r.id, firstName: r.firstName, lastName: r.lastName, levelLabel: level?.label ?? "-" };
    }
  );
}

export type MatchSort = "date_asc" | "date_desc" | "level" | "city";

/**
 * Nombre minimum d'arbitres distincts nécessaires pour couvrir un ensemble
 * de matchs (typiquement : même gymnase, même journée), en supposant qu'un
 * arbitre peut couvrir plusieurs matchs tant qu'ils ne se chevauchent pas
 * dans le temps (ex : doublage sur des TQR qui s'enchaînent). Chaque match
 * exige au moins 2 arbitres (règle CD45). Calculé par balayage : le
 * minimum théorique est égal au pic de matchs simultanés (pondéré par le
 * nombre d'arbitres requis), atteignable en pratique par une affectation
 * appropriée.
 */
export function computeMinReferees(
  matches: {
    date: Date;
    durationMinutes: number;
    refereesRequired: number;
    competitionLevel?: { label: string };
  }[]
): number {
  const events: { time: number; delta: number }[] = [];
  let nonTqrDemand = 0;
  for (const m of matches) {
    const demand = Math.max(2, m.refereesRequired);
    const isTqr = (m.competitionLevel?.label ?? "").trim().toUpperCase().startsWith("TQR");
    if (!isTqr) nonTqrDemand += demand;
    const start = m.date.getTime();
    const end = start + m.durationMinutes * 60_000;
    events.push({ time: start, delta: demand });
    events.push({ time: end, delta: -demand });
  }
  // À horaire égal, on traite d'abord les fins de match (delta négatif) :
  // un match qui se termine pile quand un autre commence ne chevauche pas.
  events.sort((a, b) => a.time - b.time || a.delta - b.delta);

  let running = 0;
  let overlapPeak = 0;
  for (const e of events) {
    running += e.delta;
    if (running > overlapPeak) overlapPeak = running;
  }

  // Même sans chevauchement horaire, un arbitre ne peut siffler que
  // MAX_PER_DAY matchs classiques par jour (règle "max-2-jour") : avec 3
  // matchs consécutifs à 2 arbitres chacun, 2 arbitres ne suffisent pas (ça
  // ferait 3 matchs chacun) même s'ils ne se chevauchent jamais dans le
  // temps. Cette règle ne s'applique pas aux TQR (tournoi, plusieurs matchs
  // courts enchaînés au même endroit) - exclus de ce plancher.
  const quotaFloor = Math.ceil(nonTqrDemand / MAX_PER_DAY);

  return Math.max(overlapPeak, quotaFloor);
}

export async function getMatchById(id: string): Promise<MatchWithRelations | null> {
  const { data, error } = await supabaseAdmin
    .from("Match")
    .select(MATCH_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapMatch(data as unknown as Parameters<typeof mapMatch>[0]);
}

export async function findMatches({
  from,
  to,
  competitionLevelId,
  status,
  search,
  city,
  sort = "date_asc",
}: {
  from?: Date;
  to?: Date;
  competitionLevelId?: string;
  status?: MatchStatus | "toutes";
  search?: string;
  city?: string;
  sort?: MatchSort;
}): Promise<MatchWithRelations[]> {
  let query = supabaseAdmin.from("Match").select(MATCH_SELECT);

  if (from) query = query.gte("date", from.toISOString());
  if (to) query = query.lt("date", to.toISOString());
  if (competitionLevelId) query = query.eq("competitionLevelId", competitionLevelId);
  if (city) query = query.eq("city", city);
  if (search) {
    const term = search.trim().replace(/[%,]/g, "");
    if (term) query = query.or(`"homeTeam".ilike.%${term}%,"awayTeam".ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  let matches = ((data ?? []) as unknown as Parameters<typeof mapMatch>[0][]).map(mapMatch);
  if (status && status !== "toutes") {
    matches = matches.filter((m) => matchStatus(m) === status);
  }

  matches.sort((a, b) => {
    switch (sort) {
      case "date_desc":
        return b.date.getTime() - a.date.getTime();
      case "level":
        return (
          a.competitionLevel.label.localeCompare(b.competitionLevel.label) ||
          a.date.getTime() - b.date.getTime()
        );
      case "city":
        return (
          (a.city ?? "").localeCompare(b.city ?? "") || a.date.getTime() - b.date.getTime()
        );
      case "date_asc":
      default:
        return a.date.getTime() - b.date.getTime();
    }
  });

  return matches;
}
