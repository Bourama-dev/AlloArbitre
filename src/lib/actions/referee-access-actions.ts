"use server";

import { getCurrentUser } from "@/lib/current-user";
import { appUrl } from "@/lib/app-url";
import { createPersonalLink } from "@/lib/referee-auth";

/**
 * Lien personnel (usage unique, 1 h) vers l'espace d'un arbitre, à lui
 * envoyer en privé : première connexion sans licence/date de naissance, ou
 * mot de passe oublié. Réservé au staff.
 */
export async function generatePersonalLink(refereeId: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Non autorisé." };
  const result = await createPersonalLink(refereeId, appUrl());
  if (!result.ok || !result.url) return { ok: false, error: result.ok ? "Lien indisponible." : result.error };
  return { ok: true, url: result.url };
}
