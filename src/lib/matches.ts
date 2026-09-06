import { prisma } from "@/lib/prisma";

export type MatchStatus = "incomplet" | "complet" | "annule";

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

export const matchWithRelationsInclude = {
  competitionLevel: true,
  designations: { include: { referee: true } },
} as const;

export async function listCompetitionLevels() {
  return prisma.competitionLevel.findMany({ orderBy: { label: "asc" } });
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
}) {
  const dateFilter: { gte?: Date; lt?: Date } = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lt = to;

  const matches = await prisma.match.findMany({
    where: {
      ...(from || to ? { date: dateFilter } : {}),
      ...(competitionLevelId ? { competitionLevelId } : {}),
    },
    include: matchWithRelationsInclude,
    orderBy: { date: "asc" },
  });

  if (!status || status === "toutes") return matches;
  return matches.filter((m) => matchStatus(m) === status);
}
