import type { NextAuthConfig } from "next-auth";

// Config "edge-safe": pas d'import Prisma ici (utilisée par le middleware,
// qui tourne en Edge Runtime). Le provider Credentials (qui a besoin de
// Prisma) est ajouté séparément dans auth.ts pour les routes Node.
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "REPARTITEUR";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
