/**
 * Envoi d'e-mails via Resend (API REST, sans dépendance npm).
 *
 * Variables d'environnement :
 * - RESEND_API_KEY : clé API Resend (obligatoire pour envoyer) ;
 * - EMAIL_FROM : expéditeur, ex. "AlloArbitre <designations@cd45basket.fr>"
 *   (domaine vérifié dans Resend). À défaut, l'adresse de test Resend, qui
 *   ne délivre qu'au propriétaire du compte Resend.
 */

export type EmailMessage = { to: string; subject: string; html: string; text?: string };

export type SendResult = { ok: true; sent: number } | { ok: false; error: string; sent: number };

const DEFAULT_FROM = "AlloArbitre <onboarding@resend.dev>";
// Limite de l'endpoint /emails/batch de Resend.
const BATCH_SIZE = 100;

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** URL publique de l'application, pour les liens des e-mails (jamais déduite de l'en-tête Host). */
export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function sendEmails(messages: EmailMessage[]): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Envoi d'e-mails non configuré (RESEND_API_KEY manquante).", sent: 0 };
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  let sent = 0;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE).map((m) => ({ from, ...m }));
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      console.error(`[email] Resend HTTP ${res.status} : ${body}`);
      return { ok: false, error: `Erreur Resend (HTTP ${res.status}) : ${body}`, sent };
    }
    sent += batch.length;
  }
  return { ok: true, sent };
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  return sendEmails([message]);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Gabarit HTML commun : titre, paragraphes (HTML déjà échappé) et bouton optionnel. */
export function emailLayout({
  title,
  paragraphs,
  button,
}: {
  title: string;
  paragraphs: string[];
  button?: { label: string; url: string };
}): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px">
<p style="margin:0 0 4px;font-size:13px;color:#6b7280">AlloArbitre</p>
<h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${p}</p>`).join("\n")}
${
  button
    ? `<p style="margin:20px 0 0"><a href="${escapeHtml(button.url)}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold">${escapeHtml(button.label)}</a></p>`
    : ""
}
</div></div></body></html>`;
}
