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
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-lg font-semibold mb-1">AlloArbitre</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Créer un compte répartiteur - CD45
        </p>

        {params.sent ? (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
            Compte créé. Vérifie ta boîte mail pour confirmer ton adresse
            avant de te connecter.
          </p>
        ) : (
          <>
            {params.error && (
              <p className="mb-4 text-sm text-red-600">{params.error}</p>
            )}

            <form action={signup} className="space-y-3">
              <div>
                <label className="block text-sm text-neutral-700 mb-1" htmlFor="name">
                  Nom
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-1" htmlFor="password">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-neutral-900 text-white text-sm font-medium py-2 hover:bg-neutral-800"
              >
                Créer mon compte
              </button>
            </form>
          </>
        )}

        <p className="mt-4 text-sm text-neutral-500 text-center">
          Déjà un compte ?{" "}
          <a href="/login" className="text-neutral-900 underline">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
