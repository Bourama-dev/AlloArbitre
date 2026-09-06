import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

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

    try {
      await signIn("credentials", { email, password, redirectTo: callbackUrl });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
      throw err;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-lg font-semibold mb-1">AlloArbitre</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Désignation des arbitres - CD45
        </p>

        {params.error && (
          <p className="mb-4 text-sm text-red-600">
            Identifiants incorrects.
          </p>
        )}

        <form action={login} className="space-y-3">
          <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/matchs"} />
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
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-neutral-900 text-white text-sm font-medium py-2 hover:bg-neutral-800"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
