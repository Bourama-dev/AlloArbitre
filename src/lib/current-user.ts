import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "REPARTITEUR";
};

/** Utilisateur connecté (session Supabase Auth) + son profil applicatif (nom, rôle). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
    };
  } catch (err) {
    console.error("[getCurrentUser] failed:", err);
    return null;
  }
}
