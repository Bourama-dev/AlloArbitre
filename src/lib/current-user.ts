import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "REPARTITEUR";
};

/**
 * Utilisateur connecté (session Supabase Auth) + son profil applicatif (nom,
 * rôle). Mémorisé pour la durée de la requête (React cache()) : le layout
 * racine ET la page appellent chacun getCurrentUser(), ce qui refaisait
 * l'aller-retour réseau vers Supabase Auth + la requête Profile deux fois
 * par affichage de page.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
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
    // Bruit attendu : pendant `next build`, Next.js sonde certaines routes
    // pour un pré-rendu statique avant de les basculer en dynamique à cause
    // de `cookies()` — ce n'est pas une vraie erreur, on ne le log donc pas.
    const digest = err instanceof Error ? (err as Error & { digest?: string }).digest : undefined;
    if (digest !== "DYNAMIC_SERVER_USAGE") {
      console.error("[getCurrentUser] failed:", err);
    }
    return null;
  }
});
