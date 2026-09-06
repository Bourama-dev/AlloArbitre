import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    const { data: profile, error } = await supabaseAdmin
      .from("Profile")
      .select("id, email, name, role")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!profile) return null;

    return profile as CurrentUser;
  } catch (err) {
    console.error("[getCurrentUser] failed:", err);
    return null;
  }
}
