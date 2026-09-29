/**
 * Accès des arbitres à leur espace, sans aucun envoi d'e-mail : le lien de
 * /espace/connexion est partagé par le répartiteur (groupe WhatsApp).
 *
 * - Activation (une fois) : n° de licence + date de naissance de la fiche,
 *   puis choix d'un mot de passe. Au-delà de 5 échecs en 1 h sur une même
 *   licence, l'activation est bloquée (la date de naissance se devine).
 * - Connexion : e-mail de la fiche (ou n° de licence) + mot de passe.
 * - Mot de passe oublié / fiche incomplète : le répartiteur génère depuis la
 *   fiche arbitre un lien personnel à usage unique (valable 1 h), à envoyer
 *   en privé ; il ouvre l'espace et propose de choisir un mot de passe.
 *
 * Le compte Supabase Auth porte app_metadata.role = "ARBITRE" (posé par le
 * serveur, jamais modifiable par l'utilisateur) : le trigger handle_new_user
 * lui donne le rôle ARBITRE, et le proxy le cantonne à /espace.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";

export const MIN_PASSWORD_LENGTH = 8;
const MAX_FAILED_ATTEMPTS = 5;

type RefereeRow = { id: string; firstName: string; lastName: string; email: string | null; birthDate: string | null };

export function normalizeLicense(s: string): string {
  return s.replace(/\s+/g, "").toUpperCase();
}

async function findByLicense(license: string): Promise<RefereeRow | null> {
  const key = normalizeLicense(license);
  if (key.length < 4) return null;
  const { data, error } = await supabaseAdmin
    .from("Referee")
    .select("id, firstName, lastName, email, birthDate")
    .eq("active", true)
    .ilike("licenseNumber", key.replace(/([%_\\])/g, "\\$1"))
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as RefereeRow | null) ?? null;
}

/** Adresse de connexion : celle de la fiche, sinon une adresse technique propre à l'arbitre. */
function loginEmailOf(r: RefereeRow): string {
  return (r.email ?? "").trim().toLowerCase() || `arbitre-${r.id}@alloarbitre.invalid`;
}

/**
 * GoTrue pose app_metadata après l'insertion de l'utilisateur : le trigger
 * de création du profil ne voit donc pas le rôle. On recale explicitement.
 */
async function markProfileAsReferee(userId: string, refereeId: string) {
  const { error } = await supabaseAdmin.from("Profile").update({ role: "ARBITRE", refereeId }).eq("id", userId);
  if (error) console.error("[referee-auth] profil arbitre :", error.message);
}

async function findAuthUserId(email: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.from("Profile").select("id").ilike("email", email).limit(1).maybeSingle();
  if (error) throw error;
  return (data?.id as string | undefined) ?? null;
}

export type AuthResult = { ok: true; email: string } | { ok: false; error: string };

export async function activateRefereeAccount(license: string, birthDate: string, password: string): Promise<AuthResult> {
  const key = normalizeLicense(license);
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Mot de passe trop court (${MIN_PASSWORD_LENGTH} caractères minimum).` };
  }

  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count, error: countError } = await supabaseAdmin
    .from("RefereeActivationAttempt")
    .select("id", { count: "exact", head: true })
    .eq("licenseKey", key)
    .eq("success", false)
    .gte("createdAt", since);
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_FAILED_ATTEMPTS) {
    return { ok: false, error: "Trop d'essais. Réessayez dans une heure ou demandez un lien personnel à votre répartiteur." };
  }

  const referee = await findByLicense(key);
  const matches = !!referee && !!referee.birthDate && referee.birthDate.slice(0, 10) === birthDate;
  await supabaseAdmin.from("RefereeActivationAttempt").insert({ licenseKey: key, success: matches });
  if (!referee || !matches) {
    return {
      ok: false,
      error: "N° de licence ou date de naissance incorrects (ou fiche incomplète : demandez un lien personnel à votre répartiteur).",
    };
  }

  const email = loginEmailOf(referee);
  if (await findAuthUserId(email)) {
    return {
      ok: false,
      error: "Ce compte est déjà activé : connectez-vous avec votre mot de passe. Oublié ? Demandez un lien personnel à votre répartiteur.",
    };
  }
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "ARBITRE", refereeId: referee.id },
    user_metadata: { name: `${referee.firstName} ${referee.lastName}` },
  });
  if (error || !created.user) {
    console.error("[referee-auth] createUser :", error?.message);
    return { ok: false, error: "Activation impossible pour le moment. Contactez votre répartiteur." };
  }
  await markProfileAsReferee(created.user.id, referee.id);
  return { ok: true, email };
}

/** Adresse de connexion à partir d'un n° de licence ou d'un e-mail saisi. */
export async function resolveLoginEmail(identifier: string): Promise<string | null> {
  const id = identifier.trim();
  const referee = id.includes("@") ? await findByEmail(id) : await findByLicense(id);
  if (!referee) return id.includes("@") ? id.toLowerCase() : null;
  // Adresse du compte déjà rattaché à la fiche : elle reste valable même si
  // l'e-mail de la fiche a été modifié depuis l'activation.
  const { data, error } = await supabaseAdmin.from("Profile").select("email").eq("refereeId", referee.id).limit(1).maybeSingle();
  if (error) throw error;
  return (data?.email as string | undefined) ?? loginEmailOf(referee);
}

async function findByEmail(email: string): Promise<RefereeRow | null> {
  const { data, error } = await supabaseAdmin
    .from("Referee")
    .select("id, firstName, lastName, email, birthDate")
    .eq("active", true)
    .ilike("email", email.trim().replace(/([%_\\])/g, "\\$1"))
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as RefereeRow | null) ?? null;
}

/**
 * Lien personnel à usage unique (1 h) généré par le répartiteur, à envoyer
 * en privé : crée le compte arbitre s'il n'existe pas encore. Aucun e-mail
 * n'est envoyé (generateLink se contente de produire le jeton).
 */
export async function createPersonalLink(refereeId: string, baseUrl: string): Promise<AuthResult & { url?: string }> {
  const { data, error } = await supabaseAdmin
    .from("Referee")
    .select("id, firstName, lastName, email, birthDate")
    .eq("id", refereeId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false, error: "Arbitre introuvable." };
  const referee = data as RefereeRow;
  const email = loginEmailOf(referee);

  if (!(await findAuthUserId(email))) {
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { role: "ARBITRE", refereeId: referee.id },
      user_metadata: { name: `${referee.firstName} ${referee.lastName}` },
    });
    if (createError || !created.user) {
      console.error("[referee-auth] createUser :", createError?.message);
      return { ok: false, error: "Création du compte arbitre impossible." };
    }
    await markProfileAsReferee(created.user.id, referee.id);
  }
  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !link?.properties?.hashed_token) {
    console.error("[referee-auth] generateLink :", linkError?.message);
    return { ok: false, error: "Génération du lien impossible." };
  }
  const url = `${baseUrl}/auth/confirm?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=magiclink`;
  return { ok: true, email, url };
}
