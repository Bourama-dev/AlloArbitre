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
  return { ...match, date: new Date(match.date) };
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
      activeDesignations.map((d) => d.date)
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
    .sort((a, b) => {
      // Priorité aux arbitres proches (distance connue < distance inconnue),
      // puis équité (nombre de désignations croissant) en cas d'égalité ou
      // quand la distance n'est pas disponible (adresse non géocodée).
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm || a.currentLoad - b.currentLoad;
      }
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return a.currentLoad - b.currentLoad;
    });

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
    `(sans conflit d'horaire, ni indisponibilité, ni dépassement de quota), trié par proximité puis équité.`
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
    .select("id, date, durationMinutes, cancelled, refereesRequired, designations:Designation(id, refereeId)")
    .eq("id", matchId)
    .maybeSingle();
  if (matchError) throw matchError;
  if (!match) return { ok: false, error: "Match introuvable." };
  if (match.cancelled) return { ok: false, error: "Ce match est annulé." };

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

  const existingDates = (
    (existingDesignations ?? []) as unknown as { match: { date: string; durationMinutes: number } }[]
  ).map((d) => new Date(d.match.date));

  const hasConflict = (
    (existingDesignations ?? []) as unknown as { match: { date: string; durationMinutes: number } }[]
  ).some((d) =>
    overlaps(matchDate, match.durationMinutes, new Date(d.match.date), d.match.durationMinutes)
  );
  if (hasConflict) {
    return { ok: false, error: "Cet arbitre a déjà un match sur ce créneau." };
  }

  const quotaViolations = checkQuotaRules(matchDate, existingDates).filter(
    (v) => v.severity === "bloquant"
  );
  if (quotaViolations.length > 0) {
    return { ok: false, error: quotaViolations.map((v) => v.message).join(" ") };
  }

  const { error: insertError } = await supabaseAdmin
    .from("Designation")
    .insert({ matchId, refereeId, createdById });
  if (insertError) {
    return { ok: false, error: "Erreur lors de la création de la désignation." };
  }
  return { ok: true };
}
