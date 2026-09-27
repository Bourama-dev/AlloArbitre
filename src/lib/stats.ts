/**
 * Statistiques de saison (1er septembre -> 31 août) : activité de chaque
 * arbitre et service rendu à chaque club. Base des pages /statistiques, du
 * bilan imprimable (PDF) et de l'export Excel.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { distanceKm, estimatePayment } from "@/lib/geocoding";
import { isLaterMatchSameVenueSameDay } from "@/lib/dates";
import { refereeOwnClubTeam } from "@/lib/club-rules";
import { cachedRoadDistances, coordKey } from "@/lib/routing";

export type Season = { startYear: number; label: string; from: Date; to: Date };

export function season(startYear: number): Season {
  return {
    startYear,
    label: `${startYear}-${startYear + 1}`,
    from: new Date(Date.UTC(startYear, 8, 1)),
    to: new Date(Date.UTC(startYear + 1, 8, 1)),
  };
}

export function currentSeasonStartYear(now = new Date()): number {
  return now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

export function parseSeason(value: string | undefined): Season {
  const y = Number(value);
  return season(Number.isInteger(y) && y > 2000 && y < 2100 ? y : currentSeasonStartYear());
}

type One<T> = T | T[] | null;
const one = <T,>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/** Lecture paginée (PostgREST plafonne à 1000 lignes par requête). */
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

type RawMatch = {
  id: string;
  date: string;
  durationMinutes: number;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  lat: number | null;
  lng: number | null;
  refereesRequired: number;
  competitionLevel: One<{ label: string; autoDesignation: boolean }>;
  designations: { refereeId: string; position: number }[];
};

type RawReferee = {
  id: string;
  firstName: string;
  lastName: string;
  zone: string | null;
  active: boolean;
  lat: number | null;
  lng: number | null;
  level: One<{ label: string }>;
};

export type RefereeDesignationLine = {
  matchId: string;
  date: Date;
  division: string;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  position: number;
  km: number | null;
  kmByRoad: boolean;
  estimatedPayment: number | null;
};

export type RefereeStats = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  level: string;
  club: string | null;
  active: boolean;
  total: number;
  played: number;
  upcoming: number;
  byDivision: Record<string, number>;
  km: number;
  estimatedPayment: number;
  removals: number;
  periods: number;
  responses: number;
  lines: RefereeDesignationLine[];
};

export type ClubStats = {
  club: string;
  homeMatches: number;
  complete: number;
  partial: number;
  none: number;
  byDivision: Record<string, { total: number; complete: number }>;
  refereeCount: number;
  designationsByItsReferees: number;
};

export type SeasonStats = {
  season: Season;
  divisions: string[];
  referees: RefereeStats[];
  clubs: ClubStats[];
  totals: { matches: number; complete: number; designations: number; km: number; estimatedPayment: number };
};

/** Club d'une équipe FBI : "USM OLIVET - 2 (3)" -> "USM OLIVET". */
export function clubOfTeam(team: string): string {
  return team
    .replace(/\(\d+\)\s*$/, "")
    .replace(/\s-\s*\d*\s*$/, "")
    .trim()
    .toUpperCase();
}

export async function computeSeasonStats(
  s: Season,
  opts: { cd45Only?: boolean; refereeId?: string } = {}
): Promise<SeasonStats> {
  const cd45Only = opts.cd45Only ?? true;
  const now = new Date();

  const matches = await fetchAll<RawMatch>((from, to) =>
    supabaseAdmin
      .from("Match")
      .select(
        `id, date, durationMinutes, homeTeam, awayTeam, venue, lat, lng, refereesRequired,
         competitionLevel:CompetitionLevel(label, autoDesignation),
         designations:Designation(refereeId, position)`
      )
      .eq("cancelled", false)
      .gte("date", s.from.toISOString())
      .lt("date", s.to.toISOString())
      .order("date")
      .order("id")
      .range(from, to)
  );

  const [referees, removals, periods] = await Promise.all([
    fetchAll<RawReferee>((from, to) =>
      supabaseAdmin
        .from("Referee")
        .select("id, firstName, lastName, zone, active, lat, lng, level:RefereeLevel(label)")
        .order("lastName")
        .order("id")
        .range(from, to)
    ),
    fetchAll<{ refereeId: string }>((from, to) =>
      supabaseAdmin
        .from("DesignationRemoval")
        .select("refereeId")
        .gte("removedAt", s.from.toISOString())
        .lt("removedAt", s.to.toISOString())
        .order("matchId")
        .order("refereeId")
        .range(from, to)
    ),
    fetchAll<{ id: string }>((from, to) =>
      supabaseAdmin
        .from("AvailabilityPeriod")
        .select("id")
        .gte("startDate", s.from.toISOString().slice(0, 10))
        .lt("startDate", s.to.toISOString().slice(0, 10))
        .order("id")
        .range(from, to)
    ),
  ]);
  const periodIds = periods.map((p) => p.id);
  const responses = periodIds.length
    ? await fetchAll<{ refereeId: string }>((from, to) =>
        supabaseAdmin.from("AvailabilityResponse").select("refereeId").in("periodId", periodIds).order("periodId").order("refereeId").range(from, to)
      )
    : [];

  const inScope = (m: RawMatch) => !cd45Only || one(m.competitionLevel)?.autoDesignation !== false || m.designations.length > 0;
  const scoped = matches.filter(inScope);
  const refereeById = new Map(referees.map((r) => [r.id, r]));

  // Distances routières déjà en cache ; sinon vol d'oiseau.
  const pairs = scoped.flatMap((m) =>
    m.lat == null || m.lng == null
      ? []
      : m.designations
          .map((d) => refereeById.get(d.refereeId))
          .filter((r): r is RawReferee => !!r && r.lat != null && r.lng != null)
          .map((r) => ({ origin: { lat: r.lat!, lng: r.lng! }, dest: { lat: m.lat!, lng: m.lng! } }))
  );
  const road = await cachedRoadDistances(pairs);

  // Désignations de chaque arbitre, dans l'ordre chronologique.
  const byReferee = new Map<string, { m: RawMatch; position: number }[]>();
  for (const m of scoped) {
    for (const d of m.designations) {
      if (opts.refereeId && d.refereeId !== opts.refereeId) continue;
      byReferee.set(d.refereeId, [...(byReferee.get(d.refereeId) ?? []), { m, position: d.position }]);
    }
  }

  const removalCount = new Map<string, number>();
  for (const r of removals) removalCount.set(r.refereeId, (removalCount.get(r.refereeId) ?? 0) + 1);
  const responseCount = new Map<string, number>();
  for (const r of responses) responseCount.set(r.refereeId, (responseCount.get(r.refereeId) ?? 0) + 1);

  const refereeStats: RefereeStats[] = referees
    .filter((r) => (opts.refereeId ? r.id === opts.refereeId : r.active || byReferee.has(r.id)))
    .map((r) => {
      const list = byReferee.get(r.id) ?? [];
      const slots = list.map(({ m }) => ({ date: new Date(m.date), durationMinutes: m.durationMinutes, venue: m.venue }));
      const lines: RefereeDesignationLine[] = list.map(({ m, position }, i) => {
        const date = new Date(m.date);
        const second = isLaterMatchSameVenueSameDay(slots[i], slots);
        let km: number | null = null;
        let kmByRoad = false;
        if (second) km = 0;
        else if (m.lat != null && m.lng != null && r.lat != null && r.lng != null) {
          const home = { lat: r.lat, lng: r.lng };
          const gym = { lat: m.lat, lng: m.lng };
          const cached = road.get(`${coordKey(home)}>${coordKey(gym)}`);
          km = cached?.km ?? distanceKm(home, gym);
          kmByRoad = !!cached;
        }
        return {
          matchId: m.id,
          date,
          division: one(m.competitionLevel)?.label ?? "",
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          venue: m.venue,
          position,
          km,
          kmByRoad,
          estimatedPayment: km != null ? estimatePayment(km) : null,
        };
      });
      const byDivision: Record<string, number> = {};
      for (const l of lines) byDivision[l.division] = (byDivision[l.division] ?? 0) + 1;
      const played = lines.filter((l) => l.date < now).length;
      return {
        id: r.id,
        name: `${r.lastName} ${r.firstName}`,
        firstName: r.firstName,
        lastName: r.lastName,
        level: one(r.level)?.label ?? "",
        club: r.zone,
        active: r.active,
        total: lines.length,
        played,
        upcoming: lines.length - played,
        byDivision,
        km: lines.reduce((n, l) => n + (l.km ?? 0) * 2, 0),
        estimatedPayment: lines.reduce((n, l) => n + (l.estimatedPayment ?? 0), 0),
        removals: removalCount.get(r.id) ?? 0,
        periods: periodIds.length,
        responses: responseCount.get(r.id) ?? 0,
        lines,
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  // Service rendu aux clubs (matchs à domicile).
  const clubMap = new Map<string, ClubStats>();
  for (const m of scoped) {
    const club = clubOfTeam(m.homeTeam);
    const c =
      clubMap.get(club) ??
      ({ club, homeMatches: 0, complete: 0, partial: 0, none: 0, byDivision: {}, refereeCount: 0, designationsByItsReferees: 0 } as ClubStats);
    const division = one(m.competitionLevel)?.label ?? "";
    const n = m.designations.length;
    const complete = n >= m.refereesRequired;
    c.homeMatches++;
    if (complete) c.complete++;
    else if (n > 0) c.partial++;
    else c.none++;
    const d = (c.byDivision[division] ??= { total: 0, complete: 0 });
    d.total++;
    if (complete) d.complete++;
    clubMap.set(club, c);
  }
  // Arbitres licenciés au club (fiche arbitre : champ club) et désignations qu'ils ont assurées.
  for (const c of clubMap.values()) {
    const members = referees.filter((r) => r.active && refereeOwnClubTeam(r.zone, c.club, "") !== null);
    c.refereeCount = members.length;
    c.designationsByItsReferees = members.reduce((n, r) => n + (byReferee.get(r.id)?.length ?? 0), 0);
  }
  const clubs = [...clubMap.values()].sort((a, b) => b.homeMatches - a.homeMatches || a.club.localeCompare(b.club));

  const divisions = [...new Set(scoped.map((m) => one(m.competitionLevel)?.label ?? ""))].sort();
  return {
    season: s,
    divisions,
    referees: refereeStats,
    clubs,
    totals: {
      matches: scoped.length,
      complete: scoped.filter((m) => m.designations.length >= m.refereesRequired).length,
      designations: scoped.reduce((n, m) => n + m.designations.length, 0),
      km: refereeStats.reduce((n, r) => n + r.km, 0),
      estimatedPayment: refereeStats.reduce((n, r) => n + r.estimatedPayment, 0),
    },
  };
}
