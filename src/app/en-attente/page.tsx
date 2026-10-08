import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getPendingAccount } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  if (await getCurrentUser()) redirect("/matchs");
  const pending = await getPendingAccount();
  if (!pending) redirect("/login");

  async function logout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm card p-6 space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Compte en attente de validation</h1>
        <p className="text-sm text-[var(--muted)]">
          Bonjour {pending.name}, votre compte ({pending.email}) a bien été créé. Un administrateur du CD45 doit le
          valider avant que vous puissiez accéder à AlloArbitre. Revenez plus tard, ou prévenez-le directement.
        </p>
        <form action={logout}>
          <button type="submit" className="btn btn-secondary w-full">
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
