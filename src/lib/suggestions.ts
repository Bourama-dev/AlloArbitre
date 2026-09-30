import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasSchedulingConflict, isLaterMatchSameVenueSameDay } from "@/lib/dates";
import { ownClubMessage, refereeOwnClubTeam } from "@/lib/club-rules";
import { distanceKm, estimatePayment } from "@/lib/geocoding";
import { checkQuotaRules } from "@/lib/designation-rules";
import { ageAt, divisionReasons, getDivisionRules, getSettings, maxDistanceReason } from "@/lib/algo-rules";
import { coordKey, roadDistance, roadDistancesTo } from "@/lib/routing";
import { loadAvailabilityIndex, type AvailabilityStatus } from "@/lib/availability";

export type RefereeSuggestion = {
  id: string;
  firstName: string;
  lastName: string;
  zone: string | null;
  phone: string | null;
  levelLabel: string;
  currentLoad: number;
  distanceKm: number | null;
  /** true : distance routière réelle (Google Routes) ; false : à vol d'oiseau. */
  distanceByRoad: boolean;
  estimatedPayment: number | null;
  /** Déjà désigné le même jour dans ce gymnase : doublé possible, sans nouveau trajet. */
  sameVenueDouble: boolean;
  groupLabels: string[];
  age: number | null;
  /** Raisons du classement, affichées dans « Pourquoi ? ». */
  why: string[];
  /** Réponse à la campagne de disponibilités couvrant le match. */
  availabilityStatus: AvailabilityStatus;
};

export type IneligibleReferee = RefereeSuggestion & { reasons: string[] };

// Niveaux d'arbitre stagiaire (en formation) : jamais choisis par les
// suggestions ni par l'auto-désignation, mais désignables à la main par un
// répartiteur (ex. en binôme avec un arbitre confirmé).
export const MANUAL_ONLY_LEVELS = ["DEP-STG"];

type RawMatchForSuggestion = {
  id: string;
  date: string;
  durationMinutes: number;
  homeTeam: string;
  awayTeam: string;
  refereesRequired: number;
  cancelled: boolean;
  competitionLevelId: string;
  venue: string | null;
  lat: number | null;
  lng: number | null;
  competitionLevel: {
    id: string;
    label: string;
    /** false = division non désignée par le CD45 : pas d'auto-désignation (cf. /admin/niveaux). */
    autoDesignation: boolean;
    mapping: { minRefereeLevel: { id: string; label: string; rank: number } } | null;
  };
  designations: { id: string; refereeId: string }[];
};

/**
 * PostgREST renvoie la relation to-one `mapping` tantôt comme un objet,
 * tantôt comme un tableau à 0 ou 1 élément selon l'état de son cache de
 * schéma - normalise les deux formes (même correctif que sur
 * /admin/niveaux) pour ne jamais rater une correspondance pourtant bien
 * enregistrée en base.
 */
function normalizeMapping(
  raw: unknown
): { minRefereeLevel: { id: string; label: string; rank: number } } | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return (raw[0] as { minRefereeLevel: { id: string; label: string; rank: number } }) ?? null;
  }
  return raw as { minRefereeLevel: { id: string; label: string; rank: number } };
}

type UnavailabilitySlot = {
  recurring: boolean;
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: number | null;
  startTime: string | null;
  endTime: string | null;
};

/**
 * Une indisponibilité empêche-t-elle l'arbitre de siffler ce match ? Un
 * créneau horaire (startTime/endTime), ponctuel ou récurrent, ne bloque que
 * les matchs qui le chevauchent ; sans créneau, toute la journée est
 * bloquée. Pour une indisponibilité ponctuelle sur plusieurs jours, le
 * créneau s'applique à chacun de ces jours. Dates de match à l'heure du
 * gymnase, stockées sans fuseau (d'où les lectures en UTC).
 */
export function unavailabilityBlocksMatch(u: UnavailabilitySlot, matchDate: Date, durationMinutes: number): boolean {
  const matchDay = matchDate.toISOString().slice(0, 10);
  const matchStart = matchDate.toISOString().slice(11, 16);
  const matchEnd = new Date(matchDate.getTime() + durationMinutes * 60000).toISOString().slice(11, 16);
  const overlapsSlot = !u.startTime || !u.endTime || (u.startTime < matchEnd && matchStart < u.endTime);

  if (!u.recurring) {
    const inRange = !!u.startDate && !!u.endDate && u.startDate <= matchDay && matchDay <= u.endDate;
    return inRange && overlapsSlot;
  }
  return u.dayOfWeek === matchDate.getUTCDay() && overlapsSlot;
}

export async function getMatchForSuggestion(matchId: string) {
  const { data, error } = await supabaseAdmin
    .from("Match")
    .select(
      `id, date, durationMinutes, homeTeam, awayTeam, refereesRequired, cancelled, competitionLevelId, venue, lat, lng,
       competitionLevel:CompetitionLevel(id, label, autoDesignation, mapping:LevelMapping(minRefereeLevel:RefereeLevel(id, label, rank))),
       designations:Designation(id, refereeId)`
    )
    .eq("id", matchId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const match = data as unknown as RawMatchForSuggestion;
  return {
    ...match,
    date: new Date(match.date),
    competitionLevel: {
      ...match.competitionLevel,
      mapping: normalizeMapping(match.competitionLevel.mapping),
    },
  };
}

// Pénalité appliquée quand l'adresse de l'arbitre n'est pas géocodée
// (distance inconnue), pour que ces arbitres restent classables au même
// titre que les autres (ni systématiquement en tête, ni systématiquement en
// queue de liste) plutôt que d'être reportés après tous les arbitres géocodés.
const UNKNOWN_DISTANCE_KM = 25;

// Nombre d'arbitres compatibles (les plus proches à vol d'oiseau) dont on
// demande la distance routière réelle : le classement de tête est exact, sans
// payer un calcul d'itinéraire pour tout l'effectif à chaque match.
const ROAD_DISTANCE_TOP_N = 40;

function rankScore(s: RefereeSuggestion): number {
  // Doublé dans la même salle : aucun trajet supplémentaire, toujours en tête.
  if (s.sameVenueDouble) return -1;
  return s.distanceKm ?? UNKNOWN_DISTANCE_KM;
}

/** Même jour, même gymnase, sans chevauchement : l'arbitre est déjà sur place. */
function isSameVenueSameDay(
  target: { date: Date; venue: string | null },
  others: { date: Date; venue: string | null }[]
): boolean {
  if (!target.venue) return false;
  const venue = target.venue.trim().toLowerCase();
  const day = target.date.toISOString().slice(0, 10);
  return others.some(
    (o) => !!o.venue && o.venue.trim().toLowerCase() === venue && o.date.toISOString().slice(0, 10) === day
  );
}

function buildWhy(s: RefereeSuggestion, minLevelLabel: string | null, maxDistanceKm: number | null): string[] {
  const why: string[] = [];
  why.push(minLevelLabel ? `Niveau ${s.levelLabel} (minimum requis : ${minLevelLabel})` : `Niveau ${s.levelLabel}`);
  if (s.sameVenueDouble) {
    why.push("Déjà désigné le même jour dans ce gymnase : doublé sans nouveau déplacement");
  }
  if (s.distanceKm != null) {
    why.push(
      `${s.distanceKm.toFixed(1)} km ${s.distanceByRoad ? "par la route" : "à vol d'oiseau"} du gymnase` +
        (s.estimatedPayment != null ? ` (~${s.estimatedPayment.toFixed(2)} €)` : "") +
        (maxDistanceKm != null ? `, sous le maximum de ${maxDistanceKm} km` : "")
    );
  } else {
    why.push("Distance inconnue (adresse non géocodée) : classé comme s'il était à 25 km");
  }
  why.push(`${s.currentLoad} désignation(s) à venir (départage à distance égale)`);
  if (s.groupLabels.length > 0) why.push(`Groupe(s) : ${s.groupLabels.join(", ")}`);
  why.push("Club, horaires, trajet entre gymnases, indisponibilités, quotas et âge vérifiés");
  return why;
}

/**
 * Désignation d'un arbitre déjà enregistrée (ou prévue dans un lot
 * d'auto-désignation), telle que l'utilisent les contrôles : conflits
 * d'horaire, quotas, doublé dans la même salle.
 */
export type CandidateDesignation = {
  matchId: string;
  date: Date;
  durationMinutes: number;
  venue: string | null;
  lat: number | null;
  lng: number | null;
};

type CandidateReferee = {
  id: string;
  firstName: string;
  lastName: string;
  zone: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  birthDate: string | null;
  level: { id: string; label: string; rank: number };
  groupIds: string[];
  groupLabels: string[];
  unavailability: UnavailabilitySlot[];
};

/**
 * Tout ce qu'il faut pour évaluer les arbitres sur les matchs d'une période,
 * chargé une seule fois : l'auto-désignation d'un lot de matchs ne recharge
 * plus tout l'effectif (et tout son historique) pour chaque place vacante.
 */
export type CandidateContext = {
  referees: CandidateReferee[];
  /** Désignations (matchs non annulés) autour de la période, par arbitre. */
  designationsByReferee: Map<string, CandidateDesignation[]>;
  /** Nombre de désignations à venir par arbitre (équité). */
  upcomingByReferee: Map<string, number>;
  settings: Awaited<ReturnType<typeof getSettings>>;
  availability: Awaited<ReturnType<typeof loadAvailabilityIndex>>;
  divisionRules: Map<string, Promise<Awaited<ReturnType<typeof getDivisionRules>>>>;
  now: Date;
};

/** Marge autour de la période : quotas à la semaine / au week-end, conflits de la veille ou du lendemain. */
const CONTEXT_MARGIN_MS = 8 * 86_400_000;

async function fetchPaged<T>(build: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
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

type One<T> = T | T[] | null;
const firstOf = <T,>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export async function loadCandidateContext(from: Date, to: Date): Promise<CandidateContext> {
  const now = new Date();
  const windowStart = new Date(from.getTime() - CONTEXT_MARGIN_MS).toISOString();
  const windowEnd = new Date(to.getTime() + CONTEXT_MARGIN_MS).toISOString();

  const [refereeRows, windowRows, upcomingRows, unavailabilityRows, settings] = await Promise.all([
    fetchPaged<{
      id: string;
      firstName: string;
      lastName: string;
      zone: string | null;
      phone: string | null;
      lat: number | null;
      lng: number | null;
      birthDate: string | null;
      level: One<{ id: string; label: string; rank: number }>;
      groups: { groupId: string; group: One<{ label: string }> }[];
    }>((f, t) =>
      supabaseAdmin
        .from("Referee")
        .select(
          `id, firstName, lastName, zone, phone, lat, lng, birthDate,
           level:RefereeLevel(id, label, rank),
           groups:RefereeGroupMember(groupId, group:RefereeGroup(label))`
        )
        .eq("active", true)
        .order("id")
        .range(f, t)
    ),
    fetchPaged<{
      refereeId: string;
      matchId: string;
      match: One<{ date: string; durationMinutes: number; venue: string | null; lat: number | null; lng: number | null }>;
    }>((f, t) =>
      supabaseAdmin
        .from("Designation")
        .select("refereeId, matchId, match:Match!inner(date, durationMinutes, venue, lat, lng)")
        .eq("match.cancelled", false)
        .gte("match.date", windowStart)
        .lt("match.date", windowEnd)
        .order("id")
        .range(f, t)
    ),
    fetchPaged<{ refereeId: string }>((f, t) =>
      supabaseAdmin
        .from("Designation")
        .select("refereeId, match:Match!inner(date)")
        .eq("match.cancelled", false)
        .gte("match.date", now.toISOString())
        .order("id")
        .range(f, t)
    ),
    fetchPaged<UnavailabilitySlot & { refereeId: string }>((f, t) =>
      supabaseAdmin
        .from("Unavailability")
        .select("refereeId, recurring, startDate, endDate, dayOfWeek, startTime, endTime")
        .order("id")
        .range(f, t)
    ),
    getSettings(),
  ]);

  const availability = await loadAvailabilityIndex(
    from.toISOString().slice(0, 10),
    to.toISOString().slice(0, 10),
    settings.requireAvailability
  );

  const unavailabilityByReferee = new Map<string, UnavailabilitySlot[]>();
  for (const u of unavailabilityRows) {
    unavailabilityByReferee.set(u.refereeId, [...(unavailabilityByReferee.get(u.refereeId) ?? []), u]);
  }
  const designationsByReferee = new Map<string, CandidateDesignation[]>();
  for (const d of windowRows) {
    const m = firstOf(d.match);
    if (!m) continue;
    const list = designationsByReferee.get(d.refereeId) ?? [];
    list.push({ matchId: d.matchId, date: new Date(m.date), durationMinutes: m.durationMinutes, venue: m.venue, lat: m.lat, lng: m.lng });
    designationsByReferee.set(d.refereeId, list);
  }
  const upcomingByReferee = new Map<string, number>();
  for (const d of upcomingRows) upcomingByReferee.set(d.refereeId, (upcomingByReferee.get(d.refereeId) ?? 0) + 1);

  const referees: CandidateReferee[] = refereeRows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    zone: r.zone,
    phone: r.phone,
    lat: r.lat,
    lng: r.lng,
    birthDate: r.birthDate,
    level: firstOf(r.level) ?? { id: "", label: "?", rank: 999 },
    groupIds: r.groups.map((g) => g.groupId),
    groupLabels: r.groups.map((g) => firstOf(g.group)?.label).filter((l): l is string => !!l),
    unavailability: unavailabilityByReferee.get(r.id) ?? [],
  }));

  return {
    referees,
    designationsByReferee,
    upcomingByReferee,
    settings,
    availability,
    divisionRules: new Map(),
    now,
  };
}

function divisionRulesFor(ctx: CandidateContext, competitionLevelId: string) {
  let rules = ctx.divisionRules.get(competitionLevelId);
  if (!rules) {
    rules = getDivisionRules(competitionLevelId);
    ctx.divisionRules.set(competitionLevelId, rules);
  }
  return rules;
}

export type MatchForSuggestion = NonNullable<Awaited<ReturnType<typeof getMatchForSuggestion>>>;

/**
 * Candidats pour un match, en deux groupes : les arbitres compatibles
 * (respectant tous les critères - niveau requis si configuré, groupe de
 * désignation, âge minimum, distance maximale, pas de conflit d'horaire, pas
 * d'indisponibilité, aucun quota bloquant dépassé), triés par doublé dans la
 * même salle, puis proximité (par la route quand elle est connue), puis
 * équité ; et les autres arbitres actifs, avec la ou les raisons de leur
 * incompatibilité, pour rester sélectionnables manuellement si besoin. Ne
 * crée jamais de désignation - la validation manuelle (voir designateReferee)
 * est toujours requise.
 *
 * `planned` (auto-désignation) : désignations déjà retenues dans le lot en
 * cours, comptées comme si elles étaient enregistrées (conflits, quotas,
 * doublés, équité) ; `alsoAssigned` : arbitres déjà retenus sur CE match.
 */
export async function evaluateMatchCandidates(
  match: MatchForSuggestion,
  ctx: CandidateContext,
  opts: { planned?: Map<string, CandidateDesignation[]>; alsoAssigned?: Set<string> } = {}
): Promise<{
  minLevelLabel: string | null;
  eligible: RefereeSuggestion[];
  ineligible: IneligibleReferee[];
}> {
  const minRank = match.competitionLevel.mapping?.minRefereeLevel?.rank;
  const minLevelLabel = match.competitionLevel.mapping?.minRefereeLevel?.label ?? null;
  const assigned = new Set([...match.designations.map((d) => d.refereeId), ...(opts.alsoAssigned ?? [])]);
  const { settings, availability, now } = ctx;
  const divisionRules = await divisionRulesFor(ctx, match.competitionLevelId);

  const hasMatchCoords = match.lat != null && match.lng != null;
  const matchSlot = { date: match.date, durationMinutes: match.durationMinutes, venue: match.venue };
  const isTqr = match.competitionLevel.label.trim().toUpperCase().startsWith("TQR");

  const candidates = ctx.referees
    .filter((c) => !assigned.has(c.id))
    .map((c) => {
      const planned = opts.planned?.get(c.id) ?? [];
      const activeDesignations = [...(ctx.designationsByReferee.get(c.id) ?? []), ...planned].filter(
        (d) => d.matchId !== match.id
      );

      const reasons: string[] = [];
      if (MANUAL_ONLY_LEVELS.includes(c.level.label)) {
        reasons.push(`Stagiaire (${c.level.label}) : désignation manuelle uniquement`);
      }
      if (minRank !== undefined && c.level.rank > minRank) {
        reasons.push("Niveau insuffisant");
      }
      reasons.push(...divisionReasons(divisionRules, { birthDate: c.birthDate, groupIds: c.groupIds }, match.date));
      const ownTeam = refereeOwnClubTeam(c.zone, match.homeTeam, match.awayTeam);
      if (ownTeam) reasons.push(ownClubMessage(ownTeam));
      if (
        activeDesignations.some((d) =>
          hasSchedulingConflict(
            { date: match.date, durationMinutes: match.durationMinutes, venue: match.venue, lat: match.lat, lng: match.lng },
            d
          )
        )
      ) {
        reasons.push("Conflit d'horaire (ou trajet insuffisant entre les deux gymnases)");
      }
      if (c.unavailability.some((u) => unavailabilityBlocksMatch(u, match.date, match.durationMinutes))) {
        reasons.push("Indisponible");
      }
      const availabilityVerdict = availability.verdict(c.id, match.date);
      if (availabilityVerdict.block) reasons.push(availabilityVerdict.block);
      const quotaViolations = checkQuotaRules(match.date, match.durationMinutes, activeDesignations, isTqr).filter(
        (v) => v.severity === "bloquant"
      );
      for (const v of quotaViolations) reasons.push(v.message);

      const oneWayKm =
        hasMatchCoords && c.lat != null && c.lng != null
          ? distanceKm({ lat: match.lat!, lng: match.lng! }, { lat: c.lat, lng: c.lng })
          : null;
      // 2e match du jour dans la même salle : pas de frais kilométriques
      // (règle CD45) - la distance reste affichée pour le classement.
      const laterSameVenue = isLaterMatchSameVenueSameDay(matchSlot, activeDesignations);
      const sameVenueDouble = isSameVenueSameDay(matchSlot, activeDesignations);

      return {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        zone: c.zone,
        phone: c.phone,
        levelLabel: c.level.label,
        currentLoad: (ctx.upcomingByReferee.get(c.id) ?? 0) + planned.filter((d) => d.date >= now).length,
        distanceKm: oneWayKm,
        distanceByRoad: false,
        estimatedPayment: null as number | null,
        sameVenueDouble,
        groupLabels: c.groupLabels,
        age: ageAt(c.birthDate, match.date),
        why: [] as string[],
        availabilityNote: availabilityVerdict.note,
        availabilityStatus: availabilityVerdict.status,
        reasons,
        coords: c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : null,
        laterSameVenue,
      };
    });

  // Distance routière réelle pour les arbitres compatibles les plus proches.
  // La route étant toujours plus longue que le vol d'oiseau, un arbitre déjà
  // trop loin à vol d'oiseau est écarté sans calcul d'itinéraire.
  if (hasMatchCoords) {
    const shortlist = candidates
      .filter((c) => c.reasons.length === 0 && c.coords && !c.sameVenueDouble)
      .filter((c) => settings.maxDistanceKm == null || (c.distanceKm ?? 0) <= settings.maxDistanceKm)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, ROAD_DISTANCE_TOP_N);
    const road = await roadDistancesTo(
      { lat: match.lat!, lng: match.lng! },
      shortlist.map((c) => c.coords!)
    );
    for (const c of shortlist) {
      const r = road.get(coordKey(c.coords!));
      if (r) {
        c.distanceKm = r.km;
        c.distanceByRoad = true;
      }
    }
  }

  for (const c of candidates) {
    // Doublé dans la même salle : pas de nouveau déplacement, donc pas de
    // plafond kilométrique à appliquer.
    if (!c.sameVenueDouble) {
      const tooFar = maxDistanceReason(c.distanceKm, settings.maxDistanceKm, c.distanceByRoad);
      if (tooFar) c.reasons.push(tooFar);
    }
    const paidKm = c.laterSameVenue ? 0 : c.distanceKm;
    c.estimatedPayment = paidKm != null ? estimatePayment(paidKm) : null;
  }

  const strip = ({
    coords: _coords,
    laterSameVenue: _later,
    availabilityNote: _note,
    ...rest
  }: (typeof candidates)[number]) => rest;

  const eligible: RefereeSuggestion[] = candidates
    .filter((c) => c.reasons.length === 0)
    .map((c) => {
      const { reasons: _reasons, ...s } = strip(c);
      const why = buildWhy(s, minLevelLabel, settings.maxDistanceKm);
      if (c.availabilityNote) why.splice(1, 0, c.availabilityNote);
      return { ...s, why };
    })
    .sort(
      (a, b) =>
        rankScore(a) - rankScore(b) ||
        a.currentLoad - b.currentLoad ||
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName)
    );

  const ineligible: IneligibleReferee[] = candidates
    .filter((c) => c.reasons.length > 0)
    .map(strip)
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

  return { minLevelLabel, eligible, ineligible };
}

/** Candidats d'un seul match (fiche match) : contexte chargé pour son jour uniquement. */
export async function getMatchCandidates(matchId: string): Promise<{
  minLevelLabel: string | null;
  eligible: RefereeSuggestion[];
  ineligible: IneligibleReferee[];
}> {
  const match = await getMatchForSuggestion(matchId);
  if (!match) return { minLevelLabel: null, eligible: [], ineligible: [] };
  const ctx = await loadCandidateContext(match.date, match.date);
  return evaluateMatchCandidates(match, ctx);
}

/** Compat : ne renvoie que les arbitres compatibles (utilisé par l'auto-désignation). */
export async function suggestReferees(matchId: string): Promise<{
  minLevelLabel: string | null;
  suggestions: RefereeSuggestion[];
}> {
  const { minLevelLabel, eligible } = await getMatchCandidates(matchId);
  return { minLevelLabel, suggestions: eligible };
}

/** Explique pourquoi un arbitre a été retenu en tête des suggestions (affiché dans le récapitulatif d'auto-désignation). */
export function explainSuggestion(s: RefereeSuggestion, totalCandidates: number): string {
  return `Classé 1er sur ${totalCandidates} arbitre(s) compatible(s) — ${s.why.join(" · ")}.`;
}


export type DesignateResult =
  /** warnings : quotas dépassés (jour / semaine / week-end / TQR), non bloquants. */
  | { ok: true; warnings: string[] }
  | { ok: false; error: string };

/** Création de la désignation - toujours suite à une validation manuelle explicite. */
export async function designateReferee(
  matchId: string,
  refereeId: string,
  createdById: string
): Promise<DesignateResult> {
  const { data: match, error: matchError } = await supabaseAdmin
    .from("Match")
    .select(
      "id, date, durationMinutes, cancelled, refereesRequired, venue, lat, lng, homeTeam, awayTeam, competitionLevelId, designations:Designation(id, refereeId, position), competitionLevel:CompetitionLevel(label)"
    )
    .eq("id", matchId)
    .maybeSingle();
  if (matchError) throw matchError;
  if (!match) return { ok: false, error: "Match introuvable." };
  if (match.cancelled) return { ok: false, error: "Ce match est annulé." };

  const { data: referee, error: refereeError } = await supabaseAdmin
    .from("Referee")
    .select("zone, birthDate, lat, lng, groups:RefereeGroupMember(groupId)")
    .eq("id", refereeId)
    .maybeSingle();
  if (refereeError) throw refereeError;
  if (!referee) return { ok: false, error: "Arbitre introuvable." };

  const ownTeam = refereeOwnClubTeam(referee?.zone as string | null, match.homeTeam, match.awayTeam);
  if (ownTeam) return { ok: false, error: ownClubMessage(ownTeam) };

  const rawLevel = match.competitionLevel as unknown;
  const competitionLevel = (Array.isArray(rawLevel) ? rawLevel[0] : rawLevel) as
    | { label: string }
    | null
    | undefined;
  const isTqr = (competitionLevel?.label ?? "").trim().toUpperCase().startsWith("TQR");

  const designations = (match.designations ?? []) as { id: string; refereeId: string; position: number }[];
  if (designations.length >= match.refereesRequired) {
    return { ok: false, error: "Ce match a déjà tous ses arbitres désignés." };
  }
  if (designations.some((d) => d.refereeId === refereeId)) {
    return { ok: false, error: "Cet arbitre est déjà désigné sur ce match." };
  }

  const matchDate = new Date(match.date);

  // Même règle que les suggestions : la désignation directe ("Désigner…")
  // ne vérifiait pas les indisponibilités et laissait passer un arbitre
  // indisponible.
  const { data: unavailability, error: unavailabilityError } = await supabaseAdmin
    .from("Unavailability")
    .select("recurring, startDate, endDate, dayOfWeek, startTime, endTime, note")
    .eq("refereeId", refereeId);
  if (unavailabilityError) throw unavailabilityError;
  const blocking = ((unavailability ?? []) as (UnavailabilitySlot & { note: string | null })[]).find((u) =>
    unavailabilityBlocksMatch(u, matchDate, match.durationMinutes)
  );
  if (blocking) {
    return {
      ok: false,
      error: `Cet arbitre est indisponible sur ce créneau${blocking.note ? ` (${blocking.note})` : ""}.`,
    };
  }

  const { data: existingDesignations, error: conflictError } = await supabaseAdmin
    .from("Designation")
    .select("id, match:Match!inner(date, durationMinutes, cancelled, venue, lat, lng)")
    .eq("refereeId", refereeId)
    .eq("match.cancelled", false);
  if (conflictError) throw conflictError;

  const existingMatches = (
    (existingDesignations ?? []) as unknown as {
      match: { date: string; durationMinutes: number; venue: string | null; lat: number | null; lng: number | null };
    }[]
  ).map((d) => ({
    date: new Date(d.match.date),
    durationMinutes: d.match.durationMinutes,
    venue: d.match.venue,
    lat: d.match.lat,
    lng: d.match.lng,
  }));

  const hasConflict = existingMatches.some((d) =>
    hasSchedulingConflict(
      { date: matchDate, durationMinutes: match.durationMinutes, venue: match.venue, lat: match.lat, lng: match.lng },
      d
    )
  );
  if (hasConflict) {
    return { ok: false, error: "Cet arbitre a déjà un match sur ce créneau (ou pas assez de temps pour rejoindre l'autre gymnase)." };
  }

  const quotaViolations = checkQuotaRules(
    matchDate,
    match.durationMinutes,
    existingMatches,
    isTqr
  ).filter((v) => v.severity === "bloquant");
  // Désignation manuelle : un quota dépassé n'empêche pas la désignation,
  // il est seulement signalé au répartiteur (alerte). Les suggestions et
  // l'auto-désignation, elles, n'en proposent pas.
  const warnings = quotaViolations.map((v) => v.message);

  // Âge minimum et groupes de désignation de la division.
  const [divisionRules, settings] = await Promise.all([
    getDivisionRules(match.competitionLevelId as string),
    getSettings(),
  ]);
  const groupIds = ((referee?.groups ?? []) as { groupId: string }[]).map((g) => g.groupId);
  const divisionBlock = divisionReasons(
    divisionRules,
    { birthDate: (referee?.birthDate as string | null) ?? null, groupIds },
    matchDate
  );
  if (divisionBlock.length > 0) return { ok: false, error: divisionBlock.join(" ") + "." };

  // Disponibilités saisies par l'arbitre dans son espace.
  const day = matchDate.toISOString().slice(0, 10);
  const availability = await loadAvailabilityIndex(day, day, settings.requireAvailability);
  const availabilityBlock = availability.verdict(refereeId, matchDate).block;
  if (availabilityBlock) return { ok: false, error: availabilityBlock + "." };

  // Distance maximale du comité (sauf doublé dans la même salle : aucun
  // nouveau déplacement).
  const sameVenueDouble = isSameVenueSameDay({ date: matchDate, venue: match.venue }, existingMatches);
  if (
    settings.maxDistanceKm != null &&
    !sameVenueDouble &&
    match.lat != null &&
    match.lng != null &&
    referee?.lat != null &&
    referee?.lng != null
  ) {
    const home = { lat: referee.lat as number, lng: referee.lng as number };
    const gym = { lat: match.lat, lng: match.lng };
    const crowKm = distanceKm(home, gym);
    const road = crowKm <= settings.maxDistanceKm ? await roadDistance(home, gym) : null;
    const tooFar = maxDistanceReason(road?.km ?? crowKm, settings.maxDistanceKm, !!road);
    if (tooFar) return { ok: false, error: tooFar + "." };
  }

  // Première position libre (A1, A2...) : "nombre de désignés + 1" créait
  // des doublons (deux A2) quand A1 avait été retiré et A2 conservé.
  const taken = new Set(designations.map((d) => d.position));
  let position = 1;
  while (taken.has(position)) position++;

  // Rotation "arbitre 1 / arbitre 2" : quand un même binôme enchaîne deux
  // matchs dos à dos (fin du précédent = début de celui-ci), celui qui était
  // en position 1 la fois précédente repasse en position 2 - et inversement.
  if (designations.length === 1) {
    const otherRefereeId = designations[0].refereeId;
    const { data: otherPending, error: otherError } = await supabaseAdmin
      .from("Designation")
      .select("position, refereeId, match:Match!inner(date, durationMinutes, cancelled)")
      .eq("refereeId", otherRefereeId)
      .eq("match.cancelled", false);
    if (otherError) throw otherError;

    const previousTogether = (
      (otherPending ?? []) as unknown as {
        position: number;
        match: { date: string; durationMinutes: number };
      }[]
    ).find((d) => {
      const prevEnd = new Date(d.match.date).getTime() + d.match.durationMinutes * 60_000;
      return prevEnd === matchDate.getTime();
    });

    if (previousTogether && previousTogether.position === 1) {
      const { error: swapError } = await supabaseAdmin
        .from("Designation")
        .update({ position: 2 })
        .eq("matchId", matchId)
        .eq("refereeId", otherRefereeId);
      if (swapError) throw swapError;
      position = 1;
    }
  }

  const { error: insertError } = await supabaseAdmin
    .from("Designation")
    .insert({ matchId, refereeId, createdById, position });
  if (insertError) {
    return { ok: false, error: "Erreur lors de la création de la désignation." };
  }
  return { ok: true, warnings };
}
