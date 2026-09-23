import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { AlertToast } from "@/components/alert-toast";

export const dynamic = "force-dynamic";

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  async function changePassword(formData: FormData) {
    "use server";
    const currentUser = await getCurrentUser();
    if (!currentUser) redirect("/login");

    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword.length < 8) {
      redirect("/compte?error=" + encodeURIComponent("Le nouveau mot de passe doit faire au moins 8 caractères."));
    }
    if (newPassword !== confirmPassword) {
      redirect("/compte?error=" + encodeURIComponent("La confirmation ne correspond pas au nouveau mot de passe."));
    }

    const supabase = await createClient();

    // On vérifie le mot de passe actuel en retentant une connexion avec,
    // plutôt que de faire confiance à la seule session déjà ouverte.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });
    if (verifyError) {
      redirect("/compte?error=" + encodeURIComponent("Mot de passe actuel incorrect."));
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      redirect("/compte?error=" + encodeURIComponent(updateError.message));
    }

    redirect("/compte?ok=1");
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Mon compte</h1>

      <div className="card p-4 text-sm space-y-1">
        <p>
          <span className="text-[var(--muted)]">Nom</span> : {user.name}
        </p>
        <p>
          <span className="text-[var(--muted)]">Email</span> : {user.email}
        </p>
        <p>
          <span className="text-[var(--muted)]">Rôle</span> : {user.role}
        </p>
      </div>

      {params.ok && (
        <AlertToast message="Mot de passe mis à jour." variant="success" />
      )}
      {params.error && <AlertToast message={params.error} variant="error" />}

      <form action={changePassword} className="card p-4 space-y-3">
        <p className="field-label">Changer mon mot de passe</p>
        <div>
          <label className="block text-sm mb-1" htmlFor="currentPassword">
            Mot de passe actuel
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="newPassword">
            Nouveau mot de passe
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="confirmPassword">
            Confirmer le nouveau mot de passe
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="input w-full"
          />
        </div>
        <SubmitButton className="btn btn-primary w-full" pendingLabel="Mise à jour…">
          Mettre à jour le mot de passe
        </SubmitButton>
      </form>
    </div>
  );
}
