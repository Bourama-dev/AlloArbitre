import { supabaseAdmin } from "@/lib/supabase/admin";
import { overlaps } from "@/lib/dates";
import { distanceKm, estimatePayment } from "@/lib/geocoding";

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

type RawMatchForSuggestion = {
  id: string;
  date: string;
  durationMinutes: number;
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
      `id, date, durationMinutes, refereesRequired, cancelled, competitionLevelId, lat, lng,
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
 * Suggestions pour un match : filtre par niveau requis (si la correspondance
 * niveau compétition -> niveau arbitre est définie), exclut les arbitres déjà
 * pris sur un créneau qui chevauche celui du match, trie par équité (nombre
 * de désignations croissant). Ne crée jamais de désignation - la validation
 * manuelle (voir designateReferee) est toujours requise.
 */
export async function suggestReferees(matchId: string): Promise<{
  minLevelLabel: string | null;
  suggestions: RefereeSuggestion[];
}> {
  const match = await getMatchForSuggestion(matchId);
  if (!match) return { minLevelLabel: null, suggestions: [] };

  const minRank = match.competitionLevel.mapping?.minRefereeLevel?.rank;
  const alreadyAssignedIds = match.designations.map((d) => d.refereeId);

  let query = supabaseAdmin
    .from("Referee")
    .select(
      `id, firstName, lastName, zone, phone, lat, lng,
       level:RefereeLevel!inner(id, label, rank),
       designations:Designation(id, match:Match(date, durationMinutes, cancelled)),
       unavailability:Unavailability(recurring, startDate, endDate, dayOfWeek, startTime, endTime)`
    )
    .eq("active", true);

  if (alreadyAssignedIds.length > 0) {
    query = query.not("id", "in", `(${alreadyAssignedIds.join(",")})`);
  }
  if (minRank !== undefined) {
    query = query.gte("level.rank", minRank);
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

  const candidates = ((data ?? []) as unknown as RawCandidate[]).map((c) => ({
    ...c,
    activeDesignations: c.designations
      .filter((d) => !d.match.cancelled)
      .map((d) => ({ date: new Date(d.match.date), durationMinutes: d.match.durationMinutes })),
  }));

  const withoutConflicts = candidates.filter(
    (c) =>
      !c.activeDesignations.some((d) =>
        overlaps(match.date, match.durationMinutes, d.date, d.durationMinutes)
      ) &&
      !c.unavailability.some(isUnavailable)
  );

  const hasMatchCoords = match.lat != null && match.lng != null;

  const suggestions: RefereeSuggestion[] = withoutConflicts
    .map((c) => {
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
        currentLoad: c.activeDesignations.filter((d) => d.date >= now).length,
        distanceKm: oneWayKm,
        estimatedPayment: oneWayKm != null ? estimatePayment(oneWayKm) : null,
      };
    })
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

  return {
    minLevelLabel: match.competitionLevel.mapping?.minRefereeLevel?.label ?? null,
    suggestions,
  };
}

export type AutoDesignateSummary = {
  assigned: number;
  errors: string[];
};

/**
 * Auto-désignation : pour chaque match sélectionné, assigne directement la
 * meilleure suggestion (équité) à chaque créneau vacant, sans écran de
 * confirmation intermédiaire - déclenché par un clic explicite sur le
 * bouton "Auto-désignation" (ce n'est jamais silencieux/en arrière-plan).
 * Traitement séquentiel : chaque désignation est committée avant de
 * recalculer les suggestions suivantes, ce qui évite qu'un même arbitre
 * soit doublement affecté sur deux matchs simultanés du même lot.
 */
export async function autoDesignateMatches(
  matchIds: string[],
  createdById: string
): Promise<AutoDesignateSummary> {
  const summary: AutoDesignateSummary = { assigned: 0, errors: [] };

  for (const matchId of matchIds) {
    for (;;) {
      const match = await getMatchForSuggestion(matchId);
      if (!match) {
        summary.errors.push(`Match introuvable (${matchId}).`);
        break;
      }
      if (match.cancelled || match.designations.length >= match.refereesRequired) break;

      const { suggestions } = await suggestReferees(matchId);
      if (suggestions.length === 0) {
        summary.errors.push(
          `${match.competitionLevel.label} du ${match.date.toLocaleDateString("fr-FR")} : aucun arbitre disponible.`
        );
        break;
      }

      const result = await designateReferee(matchId, suggestions[0].id, createdById);
      if (!result.ok) {
        summary.errors.push(result.error);
        break;
      }
      summary.assigned++;
    }
  }

  return summary;
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

  const hasConflict = (
    (existingDesignations ?? []) as unknown as { match: { date: string; durationMinutes: number } }[]
  ).some((d) =>
    overlaps(matchDate, match.durationMinutes, new Date(d.match.date), d.match.durationMinutes)
  );
  if (hasConflict) {
    return { ok: false, error: "Cet arbitre a déjà un match sur ce créneau." };
  }

  const { error: insertError } = await supabaseAdmin
    .from("Designation")
    .insert({ matchId, refereeId, createdById });
  if (insertError) {
    return { ok: false, error: "Erreur lors de la création de la désignation." };
  }
  return { ok: true };
}
