import { supabaseAdmin } from "@/lib/supabase/admin";

export type MatchStatus = "incomplet" | "complet" | "annule";

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
    referee: { id: string; firstName: string; lastName: string; lat: number | null; lng: number | null };
  }[];
};

export function matchStatus(match: {
  cancelled: boolean;
  refereesRequired: number;
  designations: unknown[];
}): MatchStatus {
  if (match.cancelled) return "annule";
  return match.designations.length >= match.refereesRequired
    ? "complet"
    : "incomplet";
}

const MATCH_SELECT = `
  id, date, durationMinutes, homeTeam, awayTeam, venue, city, venueAddress, lat, lng, poule, notes, refereesRequired, cancelled, competitionLevelId,
  competitionLevel:CompetitionLevel(id, label),
  designations:Designation(id, refereeId, referee:Referee(id, firstName, lastName, lat, lng))
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
    designations: row.designations ?? [],
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

export type MatchSort = "date_asc" | "date_desc" | "level" | "city";

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
