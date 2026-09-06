import { prisma } from "@/lib/prisma";
import { overlaps } from "@/lib/dates";

export type RefereeSuggestion = {
  id: string;
  firstName: string;
  lastName: string;
  zone: string | null;
  phone: string | null;
  levelLabel: string;
  currentLoad: number;
};

export async function getMatchForSuggestion(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    include: {
      competitionLevel: { include: { mapping: { include: { minRefereeLevel: true } } } },
      designations: { include: { referee: true } },
    },
  });
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

  const minRank = match.competitionLevel.mapping?.minRefereeLevel.rank;
  const alreadyAssignedIds = new Set(match.designations.map((d) => d.refereeId));

  const candidates = await prisma.referee.findMany({
    where: {
      active: true,
      id: { notIn: [...alreadyAssignedIds] },
      ...(minRank !== undefined ? { level: { rank: { gte: minRank } } } : {}),
    },
    include: {
      level: true,
      designations: {
        where: { match: { cancelled: false } },
        include: { match: true },
      },
    },
  });

  const now = new Date();
  const withoutConflicts = candidates.filter((c) => {
    return !c.designations.some((d) =>
      overlaps(match.date, match.durationMinutes, d.match.date, d.match.durationMinutes)
    );
  });

  const suggestions: RefereeSuggestion[] = withoutConflicts
    .map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      zone: c.zone,
      phone: c.phone,
      levelLabel: c.level.label,
      currentLoad: c.designations.filter((d) => d.match.date >= now).length,
    }))
    .sort((a, b) => a.currentLoad - b.currentLoad);

  return {
    minLevelLabel: match.competitionLevel.mapping?.minRefereeLevel.label ?? null,
    suggestions,
  };
}

export type DesignateResult =
  | { ok: true }
  | { ok: false; error: string };

/** Création de la désignation - toujours suite à une validation manuelle explicite. */
export async function designateReferee(
  matchId: string,
  refereeId: string,
  createdById: string
): Promise<DesignateResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { designations: true },
  });
  if (!match) return { ok: false, error: "Match introuvable." };
  if (match.cancelled) return { ok: false, error: "Ce match est annulé." };
  if (match.designations.length >= match.refereesRequired) {
    return { ok: false, error: "Ce match a déjà tous ses arbitres désignés." };
  }
  if (match.designations.some((d) => d.refereeId === refereeId)) {
    return { ok: false, error: "Cet arbitre est déjà désigné sur ce match." };
  }

  const conflict = await prisma.designation.findFirst({
    where: {
      refereeId,
      match: { cancelled: false },
    },
    include: { match: true },
  });
  if (
    conflict &&
    overlaps(match.date, match.durationMinutes, conflict.match.date, conflict.match.durationMinutes)
  ) {
    return { ok: false, error: "Cet arbitre a déjà un match sur ce créneau." };
  }

  await prisma.designation.create({
    data: { matchId, refereeId, createdById },
  });
  return { ok: true };
}
