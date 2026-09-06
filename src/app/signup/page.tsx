import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;

  async function signup(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      redirect(`/signup?error=${encodeURIComponent(error.message)}`);
    }

    // Si la confirmation par email est activée côté Supabase, aucune session
    // n'est ouverte immédiatement après l'inscription.
    if (!data.session) {
      redirect("/signup?sent=1");
    }
    redirect("/matchs");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-semibold tracking-tight mb-1">AlloArbitre</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Créer un compte répartiteur - CD45
        </p>

        {params.sent ? (
          <p className="text-sm text-[var(--success)] bg-[var(--success-bg)] rounded-lg p-3">
            Compte créé. Vérifie ta boîte mail pour confirmer ton adresse
            avant de te connecter.
          </p>
        ) : (
          <>
            {params.error && (
              <p className="mb-4 text-sm text-[var(--danger)]">{params.error}</p>
            )}

            <form action={signup} className="space-y-3">
              <div>
                <label className="block text-sm text-[var(--foreground)] mb-1" htmlFor="name">
                  Nom
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--foreground)] mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--foreground)] mb-1" htmlFor="password">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="input w-full"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full py-2"
              >
                Créer mon compte
              </button>
            </form>
          </>
        )}

        <p className="mt-4 text-sm text-[var(--muted)] text-center">
          Déjà un compte ?{" "}
          <a href="/login" className="text-[var(--accent)] underline">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
