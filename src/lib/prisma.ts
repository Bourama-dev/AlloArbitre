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
const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
