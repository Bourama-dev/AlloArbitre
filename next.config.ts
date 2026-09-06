import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le client Prisma généré (moteur binaire inclus) vit hors de node_modules
  // (prisma/schema.prisma: output = "../src/generated/prisma"). Le traçage
  // automatique des fichiers de Next.js ne détecte pas toujours le .so.node
  // requis au runtime (require() dynamique selon la plateforme), ce qui
  // provoquait un PrismaClientInitializationError en production sur Vercel.
  outputFileTracingIncludes: {
    "/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
