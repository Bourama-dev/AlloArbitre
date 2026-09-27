/**
 * E-mails des campagnes de disponibilités : invitation (tous les arbitres
 * actifs), relance (ceux qui n'ont pas répondu, avant la clôture) et
 * rapport au staff (liste des non-répondants, après la clôture). Relance et
 * rapport partent aussi automatiquement (cron quotidien, voir
 * /api/disponibilites-cron).
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { appUrl, emailLayout, escapeHtml, sendEmails, type SendResult } from "@/lib/email";
import { PERIOD_SELECT, formatDeadlineFr, mapPeriod, type AvailabilityPeriod } from "@/lib/availability";

type RefereeContact = { id: string; firstName: string; lastName: string; email: string | null };

export async function getPeriod(periodId: string): Promise<AvailabilityPeriod | null> {
  const { data, error } = await supabaseAdmin.from("AvailabilityPeriod").select(PERIOD_SELECT).eq("id", periodId).maybeSingle();
  if (error) throw error;
  return data ? mapPeriod(data as Record<string, unknown>) : null;
}

export async function activeReferees(): Promise<RefereeContact[]> {
  const { data, error } = await supabaseAdmin
    .from("Referee")
    .select("id, firstName, lastName, email")
    .eq("active", true)
    .order("lastName");
  if (error) throw error;
  return (data ?? []) as RefereeContact[];
}

export async function respondedIds(periodId: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin.from("AvailabilityResponse").select("refereeId").eq("periodId", periodId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.refereeId as string));
}

function refereeMessage(r: RefereeContact, p: AvailabilityPeriod, reminder: boolean) {
  const url = `${appUrl()}/espace`;
  return {
    to: r.email!,
    subject: reminder
      ? `Rappel : vos disponibilités pour « ${p.label} » avant le ${formatDeadlineFr(p.deadline)}`
      : `Saisissez vos disponibilités pour « ${p.label} »`,
    html: emailLayout({
      title: `Bonjour ${escapeHtml(r.firstName)},`,
      paragraphs: [
        reminder
          ? `Nous n'avons pas encore reçu vos disponibilités pour <strong>${escapeHtml(p.label)}</strong>.`
          : `La saisie des disponibilités pour <strong>${escapeHtml(p.label)}</strong> est ouverte.`,
        `Merci de répondre avant le <strong>${escapeHtml(formatDeadlineFr(p.deadline))}</strong>, même si vous n'êtes disponible sur aucun créneau. Passé ce délai, la saisie est verrouillée.`,
        "Connectez-vous avec votre adresse e-mail : vous recevrez un lien de connexion, sans mot de passe.",
      ],
      button: { label: "Saisir mes disponibilités", url },
    }),
    text: `Saisissez vos disponibilités pour « ${p.label} » avant le ${formatDeadlineFr(p.deadline)} : ${url}`,
  };
}

async function mark(periodId: string, column: "invitationSentAt" | "reminderSentAt" | "reportSentAt") {
  const { error } = await supabaseAdmin
    .from("AvailabilityPeriod")
    .update({ [column]: new Date().toISOString() })
    .eq("id", periodId);
  if (error) throw error;
}

export async function sendInvitation(periodId: string): Promise<SendResult> {
  const p = await getPeriod(periodId);
  if (!p) return { ok: false, error: "Période introuvable.", sent: 0 };
  const referees = (await activeReferees()).filter((r) => r.email);
  const result = await sendEmails(referees.map((r) => refereeMessage(r, p, false)));
  if (result.sent > 0) await mark(periodId, "invitationSentAt");
  return result;
}

export async function sendReminder(periodId: string): Promise<SendResult> {
  const p = await getPeriod(periodId);
  if (!p) return { ok: false, error: "Période introuvable.", sent: 0 };
  if (p.deadline.getTime() <= Date.now()) return { ok: false, error: "La saisie est déjà close.", sent: 0 };
  const done = await respondedIds(periodId);
  const pending = (await activeReferees()).filter((r) => r.email && !done.has(r.id));
  const result = pending.length ? await sendEmails(pending.map((r) => refereeMessage(r, p, true))) : { ok: true as const, sent: 0 };
  if (result.ok) await mark(periodId, "reminderSentAt");
  return result;
}

/** Rapport de clôture aux comptes ADMIN et REPARTITEUR : qui n'a pas répondu. */
export async function sendReport(periodId: string): Promise<SendResult> {
  const p = await getPeriod(periodId);
  if (!p) return { ok: false, error: "Période introuvable.", sent: 0 };
  const done = await respondedIds(periodId);
  const referees = await activeReferees();
  const missing = referees.filter((r) => !done.has(r.id));

  const { data: staff, error } = await supabaseAdmin.from("Profile").select("email").in("role", ["ADMIN", "REPARTITEUR"]);
  if (error) throw error;
  const recipients = (staff ?? []).map((s) => s.email as string).filter(Boolean);
  if (recipients.length === 0) return { ok: false, error: "Aucun compte répartiteur à prévenir.", sent: 0 };

  const url = `${appUrl()}/disponibilites/${p.id}`;
  const list =
    missing.length === 0
      ? "Tous les arbitres actifs ont répondu."
      : `<strong>${missing.length} arbitre(s) n'ont pas répondu</strong> :<br>` +
        missing.map((r) => `${escapeHtml(r.lastName)} ${escapeHtml(r.firstName)}`).join("<br>");
  const html = emailLayout({
    title: `Disponibilités « ${p.label} » : saisie close`,
    paragraphs: [
      `La saisie s'est terminée le ${escapeHtml(formatDeadlineFr(p.deadline))}. ${done.size} réponse(s) sur ${referees.length} arbitre(s) actif(s).`,
      list,
    ],
    button: { label: "Voir les disponibilités", url },
  });
  const result = await sendEmails(
    recipients.map((to) => ({
      to,
      subject: `Disponibilités « ${p.label} » : ${missing.length} sans réponse`,
      html,
    }))
  );
  if (result.ok) await mark(periodId, "reportSentAt");
  return result;
}

/**
 * Passage quotidien : relance les non-répondants des campagnes qui ferment
 * dans les 48 h, et envoie le rapport des campagnes closes depuis moins de
 * 7 jours - une seule fois chacun.
 */
export async function runAvailabilityCron(): Promise<string[]> {
  const log: string[] = [];
  const now = Date.now();
  const { data, error } = await supabaseAdmin
    .from("AvailabilityPeriod")
    .select(PERIOD_SELECT)
    .gte("deadline", new Date(now - 7 * 86_400_000).toISOString())
    .lte("deadline", new Date(now + 48 * 3_600_000).toISOString());
  if (error) throw error;
  for (const p of (data ?? []).map((r) => mapPeriod(r as Record<string, unknown>))) {
    if (p.deadline.getTime() > now && !p.reminderSentAt) {
      const r = await sendReminder(p.id);
      log.push(`Relance « ${p.label} » : ${r.ok ? `${r.sent} e-mail(s)` : r.error}`);
    }
    if (p.deadline.getTime() <= now && !p.reportSentAt) {
      const r = await sendReport(p.id);
      log.push(`Rapport « ${p.label} » : ${r.ok ? `${r.sent} e-mail(s)` : r.error}`);
    }
  }
  return log;
}
