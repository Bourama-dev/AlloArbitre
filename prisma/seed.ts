import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Grille des niveaux d'arbitre, rang croissant = niveau plus élevé.
// A adapter dans /admin/niveaux si la grille réelle du CD45 diffère.
const refereeLevels = [
  { label: "Jeune Arbitre", rank: 1 },
  { label: "Arbitre Stagiaire", rank: 2 },
  { label: "Arbitre District 3", rank: 3 },
  { label: "Arbitre District 2", rank: 4 },
  { label: "Arbitre District 1", rank: 5 },
  { label: "Arbitre Excellence Départementale", rank: 6 },
];

// Niveaux de compétition et leur correspondance avec le niveau d'arbitre minimum requis.
// Mapping construit par défaut à partir des grilles habituelles de district - à corriger
// dans /admin/niveaux si besoin, rien n'est figé dans le code.
const competitionLevels: { label: string; minRefereeLevelRank: number }[] = [
  { label: "U13", minRefereeLevelRank: 1 },
  { label: "U15", minRefereeLevelRank: 2 },
  { label: "U18", minRefereeLevelRank: 3 },
  { label: "Seniors D4", minRefereeLevelRank: 2 },
  { label: "Seniors D3", minRefereeLevelRank: 3 },
  { label: "Seniors D2", minRefereeLevelRank: 4 },
  { label: "Seniors D1", minRefereeLevelRank: 5 },
  { label: "Seniors Excellence", minRefereeLevelRank: 6 },
  { label: "Féminines", minRefereeLevelRank: 3 },
  { label: "Coupe Départementale", minRefereeLevelRank: 4 },
];

const sampleReferees = [
  { firstName: "Julien", lastName: "Marchand", zone: "Orléans", rank: 5, phone: "0601020304" },
  { firstName: "Claire", lastName: "Dubuisson", zone: "Montargis", rank: 4, phone: "0602030405" },
  { firstName: "Amine", lastName: "Belkacem", zone: "Pithiviers", rank: 3, phone: "0603040506" },
  { firstName: "Sophie", lastName: "Renard", zone: "Orléans", rank: 6, phone: "0604050607" },
  { firstName: "Karim", lastName: "Ferhat", zone: "Gien", rank: 2, phone: "0605060708" },
  { firstName: "Marion", lastName: "Petit", zone: "Orléans", rank: 3, phone: "0606070809" },
  { firstName: "Thomas", lastName: "Girard", zone: "Montargis", rank: 1, phone: "0607080910" },
  { firstName: "Nadia", lastName: "Boumediene", zone: "Pithiviers", rank: 4, phone: "0608091011" },
];

function nextWeekdayAt(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const levelByRank = new Map<number, string>();
  for (const l of refereeLevels) {
    const created = await prisma.refereeLevel.upsert({
      where: { label: l.label },
      update: { rank: l.rank },
      create: l,
    });
    levelByRank.set(l.rank, created.id);
  }

  const competitionLevelByLabel = new Map<string, string>();
  for (const c of competitionLevels) {
    const created = await prisma.competitionLevel.upsert({
      where: { label: c.label },
      update: {},
      create: { label: c.label },
    });
    competitionLevelByLabel.set(c.label, created.id);

    const minRefereeLevelId = levelByRank.get(c.minRefereeLevelRank)!;
    await prisma.levelMapping.upsert({
      where: { competitionLevelId: created.id },
      update: { minRefereeLevelId },
      create: { competitionLevelId: created.id, minRefereeLevelId },
    });
  }

  const refereeIds: string[] = [];
  for (const r of sampleReferees) {
    const levelId = levelByRank.get(r.rank)!;
    const existing = await prisma.referee.findFirst({
      where: { firstName: r.firstName, lastName: r.lastName },
    });
    const referee = existing
      ? await prisma.referee.update({
          where: { id: existing.id },
          data: { levelId, zone: r.zone, phone: r.phone },
        })
      : await prisma.referee.create({
          data: {
            firstName: r.firstName,
            lastName: r.lastName,
            zone: r.zone,
            phone: r.phone,
            levelId,
          },
        });
    refereeIds.push(referee.id);
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "bouramad900@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Bourama",
      role: "ADMIN",
      passwordHash,
    },
  });

  const sampleMatches: {
    competitionLevel: string;
    home: string;
    away: string;
    venue: string;
    when: Date;
    refereesRequired?: number;
  }[] = [
    {
      competitionLevel: "Seniors D1",
      home: "US Orléans",
      away: "FC Montargis",
      venue: "Stade Municipal Orléans",
      when: nextWeekdayAt(3, 15),
    },
    {
      competitionLevel: "Seniors D2",
      home: "AS Pithiviers",
      away: "ES Gien",
      venue: "Stade de Pithiviers",
      when: nextWeekdayAt(3, 15),
    },
    {
      competitionLevel: "Seniors D3",
      home: "FC Montargis B",
      away: "US Orléans B",
      venue: "Stade Montargis",
      when: nextWeekdayAt(3, 13),
    },
    {
      competitionLevel: "U18",
      home: "AS Pithiviers Jeunes",
      away: "US Orléans Jeunes",
      venue: "Stade de Pithiviers",
      when: nextWeekdayAt(2, 10),
    },
    {
      competitionLevel: "Féminines",
      home: "ES Gien Féminines",
      away: "FC Montargis Féminines",
      venue: "Stade Gien",
      when: nextWeekdayAt(3, 15),
    },
    {
      competitionLevel: "Seniors Excellence",
      home: "US Orléans",
      away: "AS Pithiviers",
      venue: "Stade Municipal Orléans",
      when: nextWeekdayAt(10, 15),
    },
  ];

  for (const m of sampleMatches) {
    const competitionLevelId = competitionLevelByLabel.get(m.competitionLevel)!;
    const existing = await prisma.match.findFirst({
      where: { homeTeam: m.home, awayTeam: m.away, date: m.when },
    });
    if (!existing) {
      await prisma.match.create({
        data: {
          date: m.when,
          competitionLevelId,
          homeTeam: m.home,
          awayTeam: m.away,
          venue: m.venue,
          refereesRequired: m.refereesRequired ?? 1,
        },
      });
    }
  }

  console.log("Seed terminé.");
  console.log(`Compte admin: ${adminEmail} / mot de passe: ${adminPassword} (à changer après connexion)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
