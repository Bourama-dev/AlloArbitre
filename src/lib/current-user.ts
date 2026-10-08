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
type SessionProfile = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "REPARTITEUR" | "ARBITRE";
  refereeId: string | null;
  /** Compte staff validé par un administrateur (les arbitres n'ont pas ce circuit). */
  approved: boolean;
};

const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabaseAdmin
      .from("Profile")
      .select("id, email, name, role, refereeId, approved")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!profile) return null;

    // Le rôle posé côté serveur dans app_metadata fait foi : un compte
    // arbitre n'est jamais traité comme du staff, même si son profil
    // applicatif n'a pas encore été recalé.
    if (user.app_metadata?.role === "ARBITRE") {
      return {
        ...(profile as SessionProfile),
        role: "ARBITRE",
        refereeId: (profile.refereeId as string | null) ?? ((user.app_metadata.refereeId as string | undefined) ?? null),
      };
    }
    return profile as SessionProfile;
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

/** Membre du staff connecté (ADMIN ou REPARTITEUR). Un compte arbitre renvoie null. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const profile = await getSessionProfile();
  if (!profile || profile.role === "ARBITRE" || !profile.approved) return null;
  return { id: profile.id, email: profile.email, name: profile.name, role: profile.role };
});

export type CurrentReferee = {
  profileId: string;
  refereeId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  /** true : compte du staff qui est aussi arbitre (même adresse e-mail). */
  isStaff: boolean;
};

/**
 * Arbitre connecté à l'espace arbitre : compte ARBITRE rattaché à sa fiche,
 * ou membre du staff dont l'adresse correspond à une fiche arbitre active.
 */
export const getCurrentReferee = cache(async (): Promise<CurrentReferee | null> => {
  const profile = await getSessionProfile();
  if (!profile) return null;

  let query = supabaseAdmin.from("Referee").select("id, firstName, lastName, email").eq("active", true);
  if (profile.refereeId) query = query.eq("id", profile.refereeId);
  else query = query.ilike("email", profile.email.replace(/([%_\\])/g, "\\$1"));
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    profileId: profile.id,
    refereeId: data.id as string,
    firstName: data.firstName as string,
    lastName: data.lastName as string,
    email: (data.email as string | null) ?? null,
    isStaff: profile.role !== "ARBITRE",
  };
});

/** Compte staff créé mais pas encore validé par un administrateur. */
export const getPendingAccount = cache(async (): Promise<{ name: string; email: string } | null> => {
  const profile = await getSessionProfile();
  if (!profile || profile.role === "ARBITRE" || profile.approved) return null;
  return { name: profile.name, email: profile.email };
});
