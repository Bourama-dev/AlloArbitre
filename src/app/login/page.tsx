import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const callbackUrl = String(formData.get("callbackUrl") ?? "/matchs");

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    redirect(callbackUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm card p-6">
        <h1 className="sr-only">AlloArbitre</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-alloarbitre.png"
          alt="AlloArbitre - Gestion des désignations d'arbitres basket"
          width={900}
          height={284}
          className="w-full h-auto rounded-md bg-white mb-3"
        />
        <p className="text-sm text-[var(--muted)] mb-6">
          Désignation des arbitres - CD45
        </p>

        {params.error && (
          <p className="mb-4 text-sm text-[var(--danger)]">
            Identifiants incorrects.
          </p>
        )}

        <form action={login} className="space-y-3">
          <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/matchs"} />
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
              className="input w-full"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full py-2"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-4 text-sm text-[var(--muted)] text-center">
          Pas encore de compte ?{" "}
          <a href="/signup" className="text-[var(--accent)] underline">
            S&apos;inscrire
          </a>
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] text-center">
          Vous êtes arbitre ?{" "}
          <a href="/espace/connexion" className="text-[var(--accent)] underline">
            Espace arbitre
          </a>
        </p>
      </div>
    </div>
  );
}
