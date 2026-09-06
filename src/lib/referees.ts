import { supabaseAdmin } from "@/lib/supabase/admin";

type RawReferee = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  zone: string | null;
  active: boolean;
  notes: string | null;
  levelId: string;
  level: { id: string; label: string; rank: number };
};

export async function listRefereeLevels() {
  const { data, error } = await supabaseAdmin
    .from("RefereeLevel")
    .select("id, label, rank")
    .order("rank", { ascending: true });
  if (error) throw error;
  return data as { id: string; label: string; rank: number }[];
}

/** Arbitres avec leur charge actuelle = nb de désignations sur des matchs à venir (non annulés). */
export async function listRefereesWithLoad({
  levelId,
  zone,
  onlyActive = true,
}: {
  levelId?: string;
  zone?: string;
  onlyActive?: boolean;
} = {}) {
  let query = supabaseAdmin
    .from("Referee")
    .select(
      "id, firstName, lastName, phone, email, zone, active, notes, levelId, level:RefereeLevel(id, label, rank)"
    )
    .order("lastName", { ascending: true })
    .order("firstName", { ascending: true });

  if (levelId) query = query.eq("levelId", levelId);
  if (zone) query = query.eq("zone", zone);
  if (onlyActive) query = query.eq("active", true);

  const { data: referees, error } = await query;
  if (error) throw error;

  const now = new Date().toISOString();
  const { data: loadRows, error: loadError } = await supabaseAdmin
    .from("Designation")
    .select("refereeId, match:Match!inner(date, cancelled)")
    .gte("match.date", now)
    .eq("match.cancelled", false);
  if (loadError) throw loadError;

  const loadByReferee = new Map<string, number>();
  for (const row of (loadRows ?? []) as { refereeId: string }[]) {
    loadByReferee.set(row.refereeId, (loadByReferee.get(row.refereeId) ?? 0) + 1);
  }

  return ((referees ?? []) as unknown as RawReferee[])
    .map((r) => ({ ...r, currentLoad: loadByReferee.get(r.id) ?? 0 }))
    .sort((a, b) => a.currentLoad - b.currentLoad);
}

export async function getRefereeSheet(id: string) {
  const { data: referee, error } = await supabaseAdmin
    .from("Referee")
    .select(
      `id, firstName, lastName, phone, email, zone, active, notes,
       level:RefereeLevel(id, label, rank),
       designations:Designation(id, matchId, match:Match(id, date, cancelled, homeTeam, awayTeam, competitionLevel:CompetitionLevel(id, label)))`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!referee) return null;

  const refereeRow = referee as unknown as RawReferee & {
    designations: unknown;
  };

  type RawDesignation = {
    id: string;
    matchId: string;
    match: {
      id: string;
      date: string;
      cancelled: boolean;
      homeTeam: string;
      awayTeam: string;
      competitionLevel: { id: string; label: string };
    };
  };

  const designations = ((refereeRow.designations ?? []) as unknown as RawDesignation[])
    .map((d) => ({ ...d, match: { ...d.match, date: new Date(d.match.date) } }))
    .sort((a, b) => a.match.date.getTime() - b.match.date.getTime());

  const now = new Date();
  const upcoming = designations.filter((d) => d.match.date >= now && !d.match.cancelled);
  const past = designations.filter((d) => d.match.date < now || d.match.cancelled);

  return {
    referee: { ...refereeRow, designations },
    upcoming,
    past,
    currentLoad: upcoming.length,
  };
}

export async function listZones() {
  const { data, error } = await supabaseAdmin
    .from("Referee")
    .select("zone")
    .not("zone", "is", null);
  if (error) throw error;
  const zones = Array.from(new Set((data ?? []).map((r) => r.zone as string)));
  return zones.sort();
}
