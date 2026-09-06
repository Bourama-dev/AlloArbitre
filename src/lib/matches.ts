import { supabaseAdmin } from "@/lib/supabase/admin";

export type MatchStatus = "incomplet" | "complet" | "annule";

export type MatchWithRelations = {
  id: string;
  date: Date;
  durationMinutes: number;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  refereesRequired: number;
  cancelled: boolean;
  competitionLevelId: string;
  competitionLevel: { id: string; label: string };
  designations: {
    id: string;
    refereeId: string;
    referee: { id: string; firstName: string; lastName: string };
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
  id, date, durationMinutes, homeTeam, awayTeam, venue, refereesRequired, cancelled, competitionLevelId,
  competitionLevel:CompetitionLevel(id, label),
  designations:Designation(id, refereeId, referee:Referee(id, firstName, lastName))
`;

function mapMatch(row: {
  id: string;
  date: string;
  durationMinutes: number;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
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
}: {
  from?: Date;
  to?: Date;
  competitionLevelId?: string;
  status?: MatchStatus | "toutes";
}): Promise<MatchWithRelations[]> {
  let query = supabaseAdmin
    .from("Match")
    .select(MATCH_SELECT)
    .order("date", { ascending: true });

  if (from) query = query.gte("date", from.toISOString());
  if (to) query = query.lt("date", to.toISOString());
  if (competitionLevelId) query = query.eq("competitionLevelId", competitionLevelId);

  const { data, error } = await query;
  if (error) throw error;

  const matches = ((data ?? []) as unknown as Parameters<typeof mapMatch>[0][]).map(mapMatch);
  if (!status || status === "toutes") return matches;
  return matches.filter((m) => matchStatus(m) === status);
}
