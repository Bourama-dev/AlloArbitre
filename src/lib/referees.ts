import { supabaseAdmin } from "@/lib/supabase/admin";

type RawReferee = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  zone: string | null;
  address: string | null;
  nationalNumber: string | null;
  licenseNumber: string | null;
  birthDate: string | null;
  qualificationDate: string | null;
  medicalFileDate: string | null;
  recyclingDate: string | null;
  active: boolean;
  notes: string | null;
  levelId: string;
  level: { id: string; label: string; rank: number };
};

const REFEREE_FIELDS =
  "id, firstName, lastName, phone, email, zone, address, nationalNumber, licenseNumber, birthDate, qualificationDate, medicalFileDate, recyclingDate, active, notes, levelId";

export type UnavailabilityRow = {
  id: string;
  recurring: boolean;
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: number | null;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
};

export const WEEKDAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export async function listRefereeLevels() {
  const { data, error } = await supabaseAdmin
    .from("RefereeLevel")
    .select("id, label, rank")
    .order("rank", { ascending: true });
  if (error) throw error;
  return data as { id: string; label: string; rank: number }[];
}

export type RefereeStatusFilter = "actifs" | "inactifs" | "toutes";
export type RefereeSort = "nom" | "niveau" | "club" | "charge_asc" | "charge_desc";
export type RefereeAvailabilityFilter = "toutes" | "disponibles" | "indisponibles";

/**
 * Arbitres dont une indisponibilité (récurrente ou ponctuelle) couvre
 * `dateStr` (YYYY-MM-DD) - au niveau de la journée entière, sans tenir
 * compte des horaires précis d'une indisponibilité récurrente partielle
 * (contrairement à la vérification faite au moment de désigner un arbitre
 * sur un match précis, voir getMatchCandidates).
 */
async function computeUnavailableRefereeIds(dateStr: string): Promise<Set<string>> {
  const weekday = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  const { data, error } = await supabaseAdmin
    .from("Unavailability")
    .select("refereeId, recurring, startDate, endDate, dayOfWeek");
  if (error) throw error;

  const ids = new Set<string>();
  for (const u of (data ?? []) as {
    refereeId: string;
    recurring: boolean;
    startDate: string | null;
    endDate: string | null;
    dayOfWeek: number | null;
  }[]) {
    if (u.recurring) {
      if (u.dayOfWeek === weekday) ids.add(u.refereeId);
    } else if (u.startDate && u.endDate && u.startDate <= dateStr && dateStr <= u.endDate) {
      ids.add(u.refereeId);
    }
  }
  return ids;
}

/** Arbitres avec leur charge actuelle = nb de désignations sur des matchs à venir (non annulés). */
export async function listRefereesWithLoad({
  levelId,
  zone,
  search,
  status = "actifs",
  sort = "nom",
  date,
  availability = "toutes",
}: {
  levelId?: string;
  zone?: string;
  search?: string;
  status?: RefereeStatusFilter;
  sort?: RefereeSort;
  /** Date (YYYY-MM-DD) sur laquelle évaluer la disponibilité. */
  date?: string;
  availability?: RefereeAvailabilityFilter;
} = {}) {
  let query = supabaseAdmin
    .from("Referee")
    .select(`${REFEREE_FIELDS}, level:RefereeLevel(id, label, rank)`);

  if (levelId) query = query.eq("levelId", levelId);
  if (zone) query = query.eq("zone", zone);
  if (status === "actifs") query = query.eq("active", true);
  if (status === "inactifs") query = query.eq("active", false);
  if (search) {
    const term = search.trim().replace(/[%,]/g, "");
    if (term) query = query.or(`"firstName".ilike.%${term}%,"lastName".ilike.%${term}%`);
  }

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

  const unavailableIds = date ? await computeUnavailableRefereeIds(date) : null;

  let withLoad = ((referees ?? []) as unknown as RawReferee[]).map((r) => ({
    ...r,
    currentLoad: loadByReferee.get(r.id) ?? 0,
    availableOnDate: unavailableIds ? !unavailableIds.has(r.id) : null,
  }));

  if (unavailableIds && availability !== "toutes") {
    withLoad = withLoad.filter((r) =>
      availability === "disponibles" ? r.availableOnDate : !r.availableOnDate
    );
  }

  withLoad.sort((a, b) => {
    switch (sort) {
      case "niveau":
        // rank 1 = niveau le plus élevé : tri croissant pour afficher les plus
        // expérimentés en premier.
        return a.level.rank - b.level.rank || a.lastName.localeCompare(b.lastName);
      case "club":
        return (a.zone ?? "").localeCompare(b.zone ?? "") || a.lastName.localeCompare(b.lastName);
      case "charge_asc":
        return a.currentLoad - b.currentLoad;
      case "charge_desc":
        return b.currentLoad - a.currentLoad;
      case "nom":
      default:
        return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
    }
  });

  return withLoad;
}

export async function getRefereeSheet(id: string) {
  const { data: referee, error } = await supabaseAdmin
    .from("Referee")
    .select(
      `${REFEREE_FIELDS},
       level:RefereeLevel(id, label, rank),
       designations:Designation(id, matchId, match:Match(id, date, cancelled, homeTeam, awayTeam, competitionLevel:CompetitionLevel(id, label)))`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!referee) return null;

  const { data: unavailability, error: unavailError } = await supabaseAdmin
    .from("Unavailability")
    .select("id, recurring, startDate, endDate, dayOfWeek, startTime, endTime, note")
    .eq("refereeId", id)
    .order("startDate", { ascending: true });
  if (unavailError) throw unavailError;

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
    unavailability: (unavailability ?? []) as UnavailabilityRow[],
  };
}

export async function addPunctualUnavailability(
  refereeId: string,
  startDate: string,
  endDate: string,
  note: string | null
) {
  const { error } = await supabaseAdmin
    .from("Unavailability")
    .insert({ refereeId, recurring: false, startDate, endDate, note });
  if (error) throw error;
}

export async function addRecurringUnavailability(
  refereeId: string,
  dayOfWeek: number,
  startTime: string | null,
  endTime: string | null,
  note: string | null
) {
  const { error } = await supabaseAdmin
    .from("Unavailability")
    .insert({ refereeId, recurring: true, dayOfWeek, startTime, endTime, note });
  if (error) throw error;
}

export async function removeUnavailability(id: string) {
  const { error } = await supabaseAdmin.from("Unavailability").delete().eq("id", id);
  if (error) throw error;
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
