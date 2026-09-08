import { supabaseAdmin } from "@/lib/supabase/admin";
import { overlaps } from "@/lib/dates";
import { distanceKm, estimatePayment } from "@/lib/geocoding";
import { checkQuotaRules } from "@/lib/designation-rules";

export type RefereeSuggestion = {
  id: string;
  firstName: string;
  lastName: string;
  zone: string | null;
  phone: string | null;
  levelLabel: string;
  currentLoad: number;
  distanceKm: number | null;
  estimatedPayment: number | null;
};

export type IneligibleReferee = RefereeSuggestion & { reasons: string[] };

// Niveaux d'arbitre stagiaire : encore en formation, ne peuvent être
// désignés sur aucun match (règle CD45) tant qu'ils ne sont pas validés.
const NON_DESIGNABLE_LEVELS = ["DEP-STG"];

type RawMatchForSuggestion = {
  id: string;
  date: string;
  durationMinutes: number;
  homeTeam: string;
  awayTeam: string;
  refereesRequired: number;
  cancelled: boolean;
  competitionLevelId: string;
  lat: number | null;
  lng: number | null;
  competitionLevel: {
    id: string;
    label: string;
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

export async function getMatchForSuggestion(matchId: string) {
  const { data, error } = await supabaseAdmin
    .from("Match")
    .select(
      `id, date, durationMinutes, homeTeam, awayTeam, refereesRequired, cancelled, competitionLevelId, lat, lng,
       competitionLevel:CompetitionLevel(id, label, mapping:LevelMapping(minRefereeLevel:RefereeLevel(id, label, rank))),
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

function rankScore(s: RefereeSuggestion): number {
  return s.distanceKm ?? UNKNOWN_DISTANCE_KM;
}

/**
 * Candidats pour un match, en deux groupes : les arbitres compatibles
 * (respectant tous les critères - niveau requis si configuré, pas de
 * conflit d'horaire, pas d'indisponibilité, aucun quota bloquant dépassé),
 * triés par proximité puis équité ; et les autres arbitres actifs, avec la
 * ou les raisons de leur incompatibilité, pour rester sélectionnables
 * manuellement si besoin. Ne crée jamais de désignation - la validation
 * manuelle (voir designateReferee) est toujours requise.
 */
export async function getMatchCandidates(matchId: string): Promise<{
  minLevelLabel: string | null;
  eligible: RefereeSuggestion[];
  ineligible: IneligibleReferee[];
}> {
  const match = await getMatchForSuggestion(matchId);
  if (!match) return { minLevelLabel: null, eligible: [], ineligible: [] };

  const minRank = match.competitionLevel.mapping?.minRefereeLevel?.rank;
  const alreadyAssignedIds = match.designations.map((d) => d.refereeId);

  let query = supabaseAdmin
    .from("Referee")
    .select(
      `id, firstName, lastName, zone, phone, lat, lng,
       level:RefereeLevel(id, label, rank),
       designations:Designation(id, match:Match(date, durationMinutes, cancelled)),
       unavailability:Unavailability(recurring, startDate, endDate, dayOfWeek, startTime, endTime)`
    )
    .eq("active", true);

  if (alreadyAssignedIds.length > 0) {
    query = query.not("id", "in", `(${alreadyAssignedIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw error;

  type RawCandidate = {
    id: string;
    firstName: string;
    lastName: string;
    zone: string | null;
    phone: string | null;
    lat: number | null;
    lng: number | null;
    level: { id: string; label: string; rank: number };
    designations: { id: string; match: { date: string; durationMinutes: number; cancelled: boolean } }[];
    unavailability: {
      recurring: boolean;
      startDate: string | null;
      endDate: string | null;
      dayOfWeek: number | null;
      startTime: string | null;
      endTime: string | null;
    }[];
  };

  const now = new Date();
  const matchDay = match.date.toISOString().slice(0, 10);
  const matchWeekday = match.date.getUTCDay();
  const matchStart = match.date.toISOString().slice(11, 16);
  const matchEnd = new Date(match.date.getTime() + match.durationMinutes * 60000)
    .toISOString()
    .slice(11, 16);

  const isUnavailable = (u: RawCandidate["unavailability"][number]) => {
    if (!u.recurring) {
      return !!u.startDate && !!u.endDate && u.startDate <= matchDay && matchDay <= u.endDate;
    }
    if (u.dayOfWeek !== matchWeekday) return false;
    if (!u.startTime || !u.endTime) return true; // journée entière bloquée
    return u.startTime < matchEnd && matchStart < u.endTime;
  };

  const hasMatchCoords = match.lat != null && match.lng != null;

  const candidates = ((data ?? []) as unknown as RawCandidate[]).map((c) => {
    const activeDesignations = c.designations
      .filter((d) => !d.match.cancelled)
      .map((d) => ({ date: new Date(d.match.date), durationMinutes: d.match.durationMinutes }));

    const reasons: string[] = [];
    if (NON_DESIGNABLE_LEVELS.includes(c.level.label)) {
      reasons.push(`Niveau ${c.level.label} non désignable sur un match`);
    }
    if (minRank !== undefined && c.level.rank > minRank) {
      reasons.push("Niveau insuffisant");
    }
    if (
      activeDesignations.some((d) =>
        overlaps(match.date, match.durationMinutes, d.date, d.durationMinutes)
      )
    ) {
      reasons.push("Conflit d'horaire");
    }
    if (c.unavailability.some(isUnavailable)) {
      reasons.push("Indisponible");
    }
    const quotaViolations = checkQuotaRules(
      match.date,
      match.durationMinutes,
      activeDesignations,
      match.competitionLevel.label.trim().toUpperCase().startsWith("TQR")
    ).filter((v) => v.severity === "bloquant");
    for (const v of quotaViolations) reasons.push(v.message);

    const oneWayKm =
      hasMatchCoords && c.lat != null && c.lng != null
        ? distanceKm({ lat: match.lat!, lng: match.lng! }, { lat: c.lat, lng: c.lng })
        : null;

    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      zone: c.zone,
      phone: c.phone,
      levelLabel: c.level.label,
      currentLoad: activeDesignations.filter((d) => d.date >= now).length,
      distanceKm: oneWayKm,
      estimatedPayment: oneWayKm != null ? estimatePayment(oneWayKm) : null,
      reasons,
    };
  });

  const eligible: RefereeSuggestion[] = candidates
    .filter((c) => c.reasons.length === 0)
    .sort(
      (a, b) =>
        rankScore(a) - rankScore(b) ||
        a.currentLoad - b.currentLoad ||
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName)
    );

  const ineligible: IneligibleReferee[] = candidates
    .filter((c) => c.reasons.length > 0)
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

  return {
    minLevelLabel: match.competitionLevel.mapping?.minRefereeLevel?.label ?? null,
    eligible,
    ineligible,
  };
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
  const parts = [
    `Niveau ${s.levelLabel} (suffisant)`,
    s.distanceKm != null
      ? `${s.distanceKm.toFixed(1)} km du gymnase (~${s.estimatedPayment!.toFixed(2)} €)`
      : "distance inconnue (adresse non géocodée)",
    `${s.currentLoad} désignation(s) à venir`,
  ];
  return (
    `${parts.join(" · ")} — classé 1er sur ${totalCandidates} arbitre(s) disponible(s) ` +
    `(sans conflit d'horaire, ni indisponibilité, ni dépassement de quota), ` +
    `trié du plus proche au plus loin (équité en départage à distance égale).`
  );
}


export type DesignateResult = { ok: true } | { ok: false; error: string };

/** Création de la désignation - toujours suite à une validation manuelle explicite. */
export async function designateReferee(
  matchId: string,
  refereeId: string,
  createdById: string
): Promise<DesignateResult> {
  const { data: match, error: matchError } = await supabaseAdmin
    .from("Match")
    .select(
      "id, date, durationMinutes, cancelled, refereesRequired, designations:Designation(id, refereeId), competitionLevel:CompetitionLevel(label)"
    )
    .eq("id", matchId)
    .maybeSingle();
  if (matchError) throw matchError;
  if (!match) return { ok: false, error: "Match introuvable." };
  if (match.cancelled) return { ok: false, error: "Ce match est annulé." };

  const { data: referee, error: refereeError } = await supabaseAdmin
    .from("Referee")
    .select("level:RefereeLevel(label)")
    .eq("id", refereeId)
    .maybeSingle();
  if (refereeError) throw refereeError;
  const rawRefereeLevel = referee?.level as unknown;
  const refereeLevel = (Array.isArray(rawRefereeLevel) ? rawRefereeLevel[0] : rawRefereeLevel) as
    | { label: string }
    | null
    | undefined;
  if (refereeLevel?.label && NON_DESIGNABLE_LEVELS.includes(refereeLevel.label)) {
    return { ok: false, error: `Niveau ${refereeLevel.label} : non désignable sur un match.` };
  }

  const rawLevel = match.competitionLevel as unknown;
  const competitionLevel = (Array.isArray(rawLevel) ? rawLevel[0] : rawLevel) as
    | { label: string }
    | null
    | undefined;
  const isTqr = (competitionLevel?.label ?? "").trim().toUpperCase().startsWith("TQR");

  const designations = (match.designations ?? []) as { id: string; refereeId: string }[];
  if (designations.length >= match.refereesRequired) {
    return { ok: false, error: "Ce match a déjà tous ses arbitres désignés." };
  }
  if (designations.some((d) => d.refereeId === refereeId)) {
    return { ok: false, error: "Cet arbitre est déjà désigné sur ce match." };
  }

  const matchDate = new Date(match.date);

  const { data: existingDesignations, error: conflictError } = await supabaseAdmin
    .from("Designation")
    .select("id, match:Match!inner(date, durationMinutes, cancelled)")
    .eq("refereeId", refereeId)
    .eq("match.cancelled", false);
  if (conflictError) throw conflictError;

  const existingMatches = (
    (existingDesignations ?? []) as unknown as { match: { date: string; durationMinutes: number } }[]
  ).map((d) => ({ date: new Date(d.match.date), durationMinutes: d.match.durationMinutes }));

  const hasConflict = existingMatches.some((d) =>
    overlaps(matchDate, match.durationMinutes, d.date, d.durationMinutes)
  );
  if (hasConflict) {
    return { ok: false, error: "Cet arbitre a déjà un match sur ce créneau." };
  }

  const quotaViolations = checkQuotaRules(
    matchDate,
    match.durationMinutes,
    existingMatches,
    isTqr
  ).filter((v) => v.severity === "bloquant");
  if (quotaViolations.length > 0) {
    return { ok: false, error: quotaViolations.map((v) => v.message).join(" ") };
  }

  let position = designations.length + 1;

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
  return { ok: true };
}
