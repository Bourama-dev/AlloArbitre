import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "REPARTITEUR";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "REPARTITEUR";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "REPARTITEUR";
  }
}
