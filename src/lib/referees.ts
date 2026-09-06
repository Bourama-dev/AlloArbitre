import { prisma } from "@/lib/prisma";

export async function listRefereeLevels() {
  return prisma.refereeLevel.findMany({ orderBy: { rank: "asc" } });
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
  const referees = await prisma.referee.findMany({
    where: {
      ...(levelId ? { levelId } : {}),
      ...(zone ? { zone } : {}),
      ...(onlyActive ? { active: true } : {}),
    },
    include: {
      level: true,
      designations: {
        where: { match: { date: { gte: new Date() }, cancelled: false } },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return referees
    .map((r) => ({ ...r, currentLoad: r.designations.length }))
    .sort((a, b) => a.currentLoad - b.currentLoad);
}

export async function getRefereeSheet(id: string) {
  const referee = await prisma.referee.findUnique({
    where: { id },
    include: {
      level: true,
      designations: {
        include: { match: { include: { competitionLevel: true } } },
        orderBy: { match: { date: "asc" } },
      },
    },
  });
  if (!referee) return null;

  const now = new Date();
  const upcoming = referee.designations.filter(
    (d) => d.match.date >= now && !d.match.cancelled
  );
  const past = referee.designations.filter(
    (d) => d.match.date < now || d.match.cancelled
  );

  return { referee, upcoming, past, currentLoad: upcoming.length };
}

export async function listZones() {
  const rows = await prisma.referee.findMany({
    where: { zone: { not: null } },
    select: { zone: true },
    distinct: ["zone"],
  });
  return rows.map((r) => r.zone!).sort();
}
