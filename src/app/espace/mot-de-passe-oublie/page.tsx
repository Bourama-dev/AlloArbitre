import Link from "next/link";
import { redirect } from "next/navigation";
import { MIN_PASSWORD_LENGTH, resetRefereePassword } from "@/lib/referee-auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RefereePasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function reset(formData: FormData) {
    "use server";
    const license = String(formData.get("license") ?? "");
    const birthDate = String(formData.get("birthDate") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password !== confirm) {
      redirect(`/espace/mot-de-passe-oublie?error=${encodeURIComponent("Les deux mots de passe ne correspondent pas.")}`);
    }
    const result = await resetRefereePassword(license, birthDate, password);
    if (!result.ok) redirect(`/espace/mot-de-passe-oublie?error=${encodeURIComponent(result.error)}`);

    // Connexion directe après activation.
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: result.email, password });
    redirect(error ? "/espace/connexion?reset=1" : "/espace");
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Mot de passe oublié</h1>
        <p className="text-sm text-[var(--muted)] mb-5">
          Vérification avec votre fiche au comité, puis choix d’un nouveau mot de passe.
        </p>

        {error && <p className="mb-4 text-sm text-[var(--danger)]">{decodeURIComponent(error)}</p>}

        <form action={reset} className="space-y-3">
          <div>
            <label className="block text-sm mb-1" htmlFor="license">
              N° de licence
            </label>
            <input
              id="license"
              name="license"
              required
              autoCapitalize="characters"
              placeholder="ex. VT012345"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="birthDate">
              Date de naissance
            </label>
            <input id="birthDate" name="birthDate" type="date" required className="input w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="password">
              Nouveau mot de passe ({MIN_PASSWORD_LENGTH} caractères minimum)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="confirm">
              Confirmez le mot de passe
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              className="input w-full"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Changer mon mot de passe
          </button>
        </form>
        <p className="mt-4 text-sm">
          Mot de passe retrouvé ?{" "}
          <Link href="/espace/connexion" className="text-[var(--accent)] underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
