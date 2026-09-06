import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// La CLI Prisma résout "file:./dev.db" relativement à prisma/schema.prisma,
// mais le client généré (bundlé par Next.js) le résout relativement au cwd
// du process. On fixe donc explicitement le chemin absolu du fichier SQLite
// pour que les deux pointent vers le même fichier (prisma/dev.db).
const sqliteFile = path.join(process.cwd(), "prisma", "dev.db");

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ datasourceUrl: `file:${sqliteFile}` });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
