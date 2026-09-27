import Link from "next/link";
import { redirect } from "next/navigation";
import { MIN_PASSWORD_LENGTH, activateRefereeAccount } from "@/lib/referee-auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RefereeActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function activate(formData: FormData) {
    "use server";
    const license = String(formData.get("license") ?? "");
    const birthDate = String(formData.get("birthDate") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password !== confirm) {
      redirect(`/espace/activer?error=${encodeURIComponent("Les deux mots de passe ne correspondent pas.")}`);
    }
    const result = await activateRefereeAccount(license, birthDate, password);
    if (!result.ok) redirect(`/espace/activer?error=${encodeURIComponent(result.error)}`);

    // Connexion directe après activation.
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: result.email, password });
    redirect(error ? "/espace/connexion?active=1" : "/espace");
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Activer mon compte arbitre</h1>
        <p className="text-sm text-[var(--muted)] mb-5">
          À faire une seule fois. Vos informations sont vérifiées avec votre fiche au comité.
        </p>

        {error && <p className="mb-4 text-sm text-[var(--danger)]">{decodeURIComponent(error)}</p>}

        <form action={activate} className="space-y-3">
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
              Choisissez un mot de passe ({MIN_PASSWORD_LENGTH} caractères minimum)
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
            Activer mon compte
          </button>
        </form>
        <p className="mt-4 text-sm">
          Déjà activé ?{" "}
          <Link href="/espace/connexion" className="text-[var(--accent)] underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
