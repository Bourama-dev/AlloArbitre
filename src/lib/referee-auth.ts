/**
 * Connexion des arbitres à leur espace par lien e-mail (sans mot de passe).
 *
 * Le compte Supabase Auth de l'arbitre est créé à la première demande, avec
 * app_metadata.role = "ARBITRE" (posé par le serveur, jamais modifiable par
 * l'utilisateur) : le trigger handle_new_user lui donne le rôle ARBITRE et
 * le rattache à sa fiche, et le proxy le cantonne à /espace. Le lien est
 * généré par l'API admin Supabase et envoyé par Resend (pas par le serveur
 * d'e-mails intégré de Supabase, limité à quelques envois par heure).
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { appUrl, emailLayout, escapeHtml, sendEmail } from "@/lib/email";

export type LoginLinkResult = { ok: true } | { ok: false; error: string };

export async function sendRefereeLoginLink(rawEmail: string): Promise<LoginLinkResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Adresse e-mail invalide." };

  const { data: referee, error } = await supabaseAdmin
    .from("Referee")
    .select("id, firstName, lastName, email")
    .eq("active", true)
    .ilike("email", email.replace(/([%_\\])/g, "\\$1"))
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  // Adresse inconnue : même réponse qu'en cas de succès (pas d'énumération
  // des adresses d'arbitres).
  if (!referee) return { ok: true };

  // Premier accès : création du compte arbitre. Un compte existant (déjà
  // arbitre, ou membre du staff avec la même adresse) est simplement réutilisé.
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { role: "ARBITRE", refereeId: referee.id },
    user_metadata: { name: `${referee.firstName} ${referee.lastName}` },
  });
  if (createError && !/already|registered|exists/i.test(createError.message)) {
    console.error("[referee-auth] createUser :", createError.message);
    return { ok: false, error: "Impossible de préparer votre accès. Réessayez plus tard." };
  }

  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !link?.properties?.hashed_token) {
    console.error("[referee-auth] generateLink :", linkError?.message);
    return { ok: false, error: "Impossible de générer le lien de connexion. Réessayez plus tard." };
  }

  const url = `${appUrl()}/auth/confirm?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=magiclink`;
  const sent = await sendEmail({
    to: email,
    subject: "Votre lien de connexion AlloArbitre",
    html: emailLayout({
      title: `Bonjour ${escapeHtml(referee.firstName as string)},`,
      paragraphs: [
        "Voici votre lien pour accéder à votre espace arbitre : saisie de vos disponibilités et consultation de vos désignations.",
        "Ce lien est personnel et valable une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
      ],
      button: { label: "Accéder à mon espace", url },
    }),
    text: `Votre lien de connexion à l'espace arbitre AlloArbitre (valable une heure) : ${url}`,
  });
  if (!sent.ok) return { ok: false, error: "L'e-mail n'a pas pu être envoyé. Contactez votre répartiteur." };
  return { ok: true };
}
