import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Driver adapter (node-postgres) plutôt que le moteur binaire natif de
// Prisma : celui-ci n'était pas embarqué de façon fiable dans le bundle
// serverless de Vercel (PrismaClientInitializationError en production,
// malgré binaryTargets et outputFileTracingIncludes). L'adapter exécute
// les requêtes en pur JS/SQL, sans binaire dépendant de la plateforme.
//
// Contrairement au moteur natif de Prisma, `pg` n'active pas TLS par
// défaut - Supabase l'exige, d'où `ssl`. `max: 1` limite le pool à une
// connexion par invocation serverless (le pooler Supavisor gère déjà le
// multiplexage côté base).
const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
