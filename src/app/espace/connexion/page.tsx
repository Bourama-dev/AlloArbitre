import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveLoginEmail } from "@/lib/referee-auth";

export const dynamic = "force-dynamic";

export default async function RefereeLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; active?: string }>;
}) {
  const { error, active } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const identifier = String(formData.get("identifier") ?? "");
    const password = String(formData.get("password") ?? "");
    const email = await resolveLoginEmail(identifier);
    if (!email) redirect("/espace/connexion?error=identifiants");
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect("/espace/connexion?error=identifiants");
    redirect("/espace");
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Espace arbitre</h1>
        <p className="text-sm text-[var(--muted)] mb-5">Saisissez vos disponibilités et retrouvez vos désignations.</p>

        {error === "identifiants" && (
          <p className="mb-4 text-sm text-[var(--danger)]">Identifiants incorrects.</p>
        )}
        {error === "lien" && (
          <p className="mb-4 text-sm text-[var(--danger)]">
            Ce lien personnel a expiré ou a déjà servi. Demandez-en un nouveau à votre répartiteur.
          </p>
        )}
        {active && (
          <p className="mb-4 text-sm text-[var(--success)] bg-[var(--success-bg)] rounded-lg p-3">
            Compte activé ! Connectez-vous avec votre adresse e-mail et votre mot de passe.
          </p>
        )}

        <form action={login} className="space-y-3">
          <div>
            <label className="block text-sm mb-1" htmlFor="identifier">
              Adresse e-mail (ou n° de licence)
            </label>
            <input
              id="identifier"
              name="identifier"
              required
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="input w-full"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Se connecter
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[var(--border)] text-sm space-y-2">
          <p>
            Première connexion ?{" "}
            <Link href="/espace/activer" className="text-[var(--accent)] underline">
              Activer mon compte
            </Link>
          </p>
          <p className="text-xs text-[var(--muted)]">
            Mot de passe oublié : demandez un lien personnel à votre répartiteur.
          </p>
        </div>
      </div>
    </div>
  );
}
