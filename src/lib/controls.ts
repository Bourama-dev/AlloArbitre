/**
 * Contrôle des désignations déjà enregistrées : chaque désignation à venir
 * est réévaluée avec les règles actuelles (une indisponibilité saisie après
 * coup, un groupe modifié, une nouvelle distance maximale...), comme si on
 * la créait aujourd'hui. Lecture seule - rien n'est retiré automatiquement.
 *
 * Signale aussi les doublés possibles : un arbitre déjà désigné dans un
 * gymnase un jour donné, alors qu'un autre match de ce gymnase le même jour
 * attend encore des arbitres.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasSchedulingConflict } from "@/lib/dates";
import { checkQuotaRules } from "@/lib/designation-rules";
import { ownClubMessage, refereeOwnClubTeam } from "@/lib/club-rules";
import { distanceKm } from "@/lib/geocoding";
import { divisionReasons, getSettings, maxDistanceReason, type DivisionRules } from "@/lib/algo-rules";
import { cachedRoadDistances, coordKey } from "@/lib/routing";
import { unavailabilityBlocksMatch } from "@/lib/suggestions";
import { loadAvailabilityIndex } from "@/lib/availability";

export type ControlIssue = {
  matchId: string;
  matchDate: Date;
  matchLabel: string;
  division: string;
  refereeId: string;
  refereeName: string;
  problems: string[];
};

export type DoubleOpportunity = {
  matchId: string;
  matchDate: Date;
  matchLabel: string;
  venue: string;
  missing: number;
  referees: { id: string; name: string; otherMatch: string }[];
};

type One<T> = T | T[] | null;
const one = <T,>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

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
  competitionLevelId: string;
  competitionLevel: One<{
    label: string;
    minRefereeAge: number | null;
    mapping: One<{ minRefereeLevel: One<{ label: string; rank: number }> }>;
  }>;
  designations: { refereeId: string }[];
};

type RawReferee = {
  id: string;
  firstName: string;
  lastName: string;
  zone: string | null;
  birthDate: string | null;
  lat: number | null;
  lng: number | null;
  level: One<{ label: string; rank: number }>;
  groups: { groupId: string }[];
  designations: {
    matchId: string;
    match: One<{ date: string; durationMinutes: number; cancelled: boolean; venue: string | null; lat: number | null; lng: number | null }>;
  }[];
  unavailability: {
    recurring: boolean;
    startDate: string | null;
    endDate: string | null;
    dayOfWeek: number | null;
    startTime: string | null;
    endTime: string | null;
  }[];
};

export async function runDesignationControls(from: Date, to: Date): Promise<{
  issues: ControlIssue[];
  doubles: DoubleOpportunity[];
  checked: number;
}> {
  const { data: rawMatches, error: mError } = await supabaseAdmin
    .from("Match")
    .select(
      `id, date, durationMinutes, homeTeam, awayTeam, venue, lat, lng, refereesRequired, competitionLevelId,
       competitionLevel:CompetitionLevel(label, minRefereeAge, mapping:LevelMapping(minRefereeLevel:RefereeLevel(label, rank))),
       designations:Designation(refereeId)`
    )
    .eq("cancelled", false)
    .gte("date", from.toISOString())
    .lt("date", to.toISOString())
    .order("date");
  if (mError) throw mError;
  const matches = (rawMatches ?? []) as unknown as RawMatch[];

  const refereeIds = [...new Set(matches.flatMap((m) => m.designations.map((d) => d.refereeId)))];
  const [settings, { data: groupDivisions, error: gdError }] = await Promise.all([
    getSettings(),
    supabaseAdmin.from("RefereeGroupDivision").select("groupId, competitionLevelId, group:RefereeGroup(label)"),
  ]);
  if (gdError) throw gdError;

  const referees = new Map<string, RawReferee>();
  const CHUNK = 100;
  for (let i = 0; i < refereeIds.length; i += CHUNK) {
    const { data, error } = await supabaseAdmin
      .from("Referee")
      .select(
        `id, firstName, lastName, zone, birthDate, lat, lng,
         level:RefereeLevel(label, rank),
         groups:RefereeGroupMember(groupId),
         designations:Designation(matchId, match:Match(date, durationMinutes, cancelled, venue, lat, lng)),
         unavailability:Unavailability(recurring, startDate, endDate, dayOfWeek, startTime, endTime)`
      )
      .in("id", refereeIds.slice(i, i + CHUNK));
    if (error) throw error;
    for (const r of (data ?? []) as unknown as RawReferee[]) referees.set(r.id, r);
  }

  const groupsByDivision = new Map<string, { id: string; label: string }[]>();
  for (const gd of (groupDivisions ?? []) as unknown as {
    groupId: string;
    competitionLevelId: string;
    group: One<{ label: string }>;
  }[]) {
    const list = groupsByDivision.get(gd.competitionLevelId) ?? [];
    list.push({ id: gd.groupId, label: one(gd.group)?.label ?? "?" });
    groupsByDivision.set(gd.competitionLevelId, list);
  }

  // Distances routières déjà connues (cache seul : pas d'appel Google en masse).
  const pairs = matches.flatMap((m) =>
    m.lat == null || m.lng == null
      ? []
      : m.designations
          .map((d) => referees.get(d.refereeId))
          .filter((r): r is RawReferee => !!r && r.lat != null && r.lng != null)
          .map((r) => ({ origin: { lat: r.lat!, lng: r.lng! }, dest: { lat: m.lat!, lng: m.lng! } }))
  );
  const road = settings.maxDistanceKm != null ? await cachedRoadDistances(pairs) : new Map();
  const lastDay = new Date(to.getTime() - 1).toISOString().slice(0, 10);
  const availability = await loadAvailabilityIndex(from.toISOString().slice(0, 10), lastDay, settings.requireAvailability);

  const label = (m: RawMatch) => `${m.homeTeam} vs ${m.awayTeam}`;
  const activeOf = (r: RawReferee) =>
    r.designations
      .map((d) => ({ matchId: d.matchId, match: one(d.match) }))
      .filter((d) => d.match && !d.match.cancelled)
      .map((d) => ({
        matchId: d.matchId,
        date: new Date(d.match!.date),
        durationMinutes: d.match!.durationMinutes,
        venue: d.match!.venue,
        lat: d.match!.lat,
        lng: d.match!.lng,
      }));

  const issues: ControlIssue[] = [];
  let checked = 0;

  for (const m of matches) {
    const date = new Date(m.date);
    const level = one(m.competitionLevel);
    const minLevel = one(one(level?.mapping ?? null)?.minRefereeLevel ?? null);
    const rules: DivisionRules = {
      label: level?.label ?? null,
      minRefereeAge: level?.minRefereeAge ?? null,
      allowedGroups: groupsByDivision.get(m.competitionLevelId) ?? [],
    };
    const slot = { date, durationMinutes: m.durationMinutes, venue: m.venue, lat: m.lat, lng: m.lng };
    const isTqr = (level?.label ?? "").trim().toUpperCase().startsWith("TQR");

    for (const d of m.designations) {
      const r = referees.get(d.refereeId);
      if (!r) continue;
      checked++;
      const others = activeOf(r).filter((o) => o.matchId !== m.id);
      const refLevel = one(r.level);
      const problems: string[] = [];

      if (minLevel && refLevel && refLevel.rank > minLevel.rank) {
        problems.push(`Niveau ${refLevel.label} insuffisant (minimum ${minLevel.label})`);
      }
      problems.push(...divisionReasons(rules, { birthDate: r.birthDate, groupIds: r.groups.map((g) => g.groupId) }, date));
      if (!r.birthDate) {
        problems.push("Date de naissance manquante : âge minimum (15 ans, FFBB) non vérifiable");
      }
      const ownTeam = refereeOwnClubTeam(r.zone, m.homeTeam, m.awayTeam);
      if (ownTeam) problems.push(ownClubMessage(ownTeam));
      if (others.some((o) => hasSchedulingConflict(slot, o))) {
        problems.push("Conflit d'horaire avec un autre de ses matchs (ou trajet insuffisant)");
      }
      if (r.unavailability.some((u) => unavailabilityBlocksMatch(u, date, m.durationMinutes))) {
        problems.push("Indisponible sur ce créneau");
      }
      const availabilityBlock = availability.verdict(r.id, date).block;
      if (availabilityBlock) problems.push(availabilityBlock);
      for (const v of checkQuotaRules(date, m.durationMinutes, others, isTqr)) {
        if (v.severity === "bloquant") problems.push(v.message);
      }
      const sameVenue = others.some(
        (o) =>
          !!o.venue &&
          !!m.venue &&
          o.venue.trim().toLowerCase() === m.venue.trim().toLowerCase() &&
          o.date.toISOString().slice(0, 10) === date.toISOString().slice(0, 10)
      );
      if (settings.maxDistanceKm != null && !sameVenue && m.lat != null && m.lng != null && r.lat != null && r.lng != null) {
        const home = { lat: r.lat, lng: r.lng };
        const gym = { lat: m.lat, lng: m.lng };
        const cached = road.get(`${coordKey(home)}>${coordKey(gym)}`);
        const tooFar = maxDistanceReason(cached?.km ?? distanceKm(home, gym), settings.maxDistanceKm, !!cached);
        if (tooFar) problems.push(tooFar);
      }

      if (problems.length > 0) {
        issues.push({
          matchId: m.id,
          matchDate: date,
          matchLabel: label(m),
          division: level?.label ?? "",
          refereeId: r.id,
          refereeName: `${r.firstName} ${r.lastName}`,
          problems,
        });
      }
    }
  }

  // Doublés possibles : matchs incomplets d'un gymnase où un arbitre est déjà
  // désigné le même jour, sur un match qui ne chevauche pas.
  const doubles: DoubleOpportunity[] = [];
  const venueDay = (m: RawMatch) =>
    m.venue ? `${m.venue.trim().toLowerCase()}|${m.date.slice(0, 10)}` : null;
  const byVenueDay = new Map<string, RawMatch[]>();
  for (const m of matches) {
    const k = venueDay(m);
    if (!k) continue;
    byVenueDay.set(k, [...(byVenueDay.get(k) ?? []), m]);
  }
  for (const m of matches) {
    const missing = m.refereesRequired - m.designations.length;
    const k = venueDay(m);
    if (missing <= 0 || !k) continue;
    const onThisMatch = new Set(m.designations.map((d) => d.refereeId));
    const slot = { date: new Date(m.date), durationMinutes: m.durationMinutes, venue: m.venue, lat: m.lat, lng: m.lng };
    const found = new Map<string, { id: string; name: string; otherMatch: string }>();
    for (const other of byVenueDay.get(k) ?? []) {
      if (other.id === m.id) continue;
      const otherSlot = {
        date: new Date(other.date),
        durationMinutes: other.durationMinutes,
        venue: other.venue,
        lat: other.lat,
        lng: other.lng,
      };
      if (hasSchedulingConflict(slot, otherSlot)) continue;
      for (const d of other.designations) {
        if (onThisMatch.has(d.refereeId) || found.has(d.refereeId)) continue;
        const r = referees.get(d.refereeId);
        if (!r) continue;
        found.set(d.refereeId, {
          id: r.id,
          name: `${r.firstName} ${r.lastName}`,
          otherMatch: `${label(other)} à ${other.date.slice(11, 16)}`,
        });
      }
    }
    if (found.size > 0) {
      doubles.push({
        matchId: m.id,
        matchDate: new Date(m.date),
        matchLabel: label(m),
        venue: m.venue!,
        missing,
        referees: [...found.values()],
      });
    }
  }

  return { issues, doubles, checked };
}
