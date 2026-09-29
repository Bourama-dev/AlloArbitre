/**
 * Campagnes de disponibilités, côté répartiteur. Aucun e-mail n'est envoyé :
 * l'annonce et les relances sont des messages prêts à coller dans le groupe
 * WhatsApp des arbitres.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/app-url";
import { PERIOD_SELECT, formatDeadlineFr, mapPeriod, type AvailabilityPeriod } from "@/lib/availability";

export type RefereeContact = { id: string; firstName: string; lastName: string };

export async function getPeriod(periodId: string): Promise<AvailabilityPeriod | null> {
  const { data, error } = await supabaseAdmin.from("AvailabilityPeriod").select(PERIOD_SELECT).eq("id", periodId).maybeSingle();
  if (error) throw error;
  return data ? mapPeriod(data as Record<string, unknown>) : null;
}

export async function activeReferees(): Promise<RefereeContact[]> {
  const { data, error } = await supabaseAdmin
    .from("Referee")
    .select("id, firstName, lastName")
    .eq("active", true)
    .order("lastName");
  if (error) throw error;
  return (data ?? []) as RefereeContact[];
}

export function spaceLoginUrl(): string {
  return `${appUrl()}/espace/connexion`;
}

/** Annonce d'ouverture de la saisie, à coller dans le groupe WhatsApp. */
export function announcementMessage(p: AvailabilityPeriod): string {
  return [
    `🏀 Disponibilités « ${p.label} »`,
    `Merci de saisir vos créneaux disponibles avant le ${formatDeadlineFr(p.deadline)}, même si vous n'êtes disponible sur aucun créneau.`,
    `👉 ${spaceLoginUrl()}`,
    `Première connexion : « Activer mon compte » avec votre n° de licence et votre date de naissance. Ensuite : votre adresse e-mail et votre mot de passe.`,
  ].join("\n");
}

/** Relance nominative des arbitres qui n'ont pas répondu. */
export function reminderMessage(p: AvailabilityPeriod, missing: RefereeContact[]): string {
  return [
    `⏰ Rappel disponibilités « ${p.label} » : clôture le ${formatDeadlineFr(p.deadline)}.`,
    `Toujours pas de réponse de : ${missing.map((r) => `${r.firstName} ${r.lastName}`).join(", ")}.`,
    `👉 ${spaceLoginUrl()}`,
  ].join("\n");
}
