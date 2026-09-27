import { redirect } from "next/navigation";
import { sendRefereeLoginLink } from "@/lib/referee-auth";

export const dynamic = "force-dynamic";

export default async function RefereeLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; msg?: string }>;
}) {
  const { sent, error, msg } = await searchParams;

  async function requestLink(formData: FormData) {
    "use server";
    const result = await sendRefereeLoginLink(String(formData.get("email") ?? ""));
    if (!result.ok) redirect(`/espace/connexion?error=envoi&msg=${encodeURIComponent(result.error)}`);
    redirect("/espace/connexion?sent=1");
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Espace arbitre</h1>
        <p className="text-sm text-[var(--muted)] mb-5">
          Saisissez vos disponibilités et retrouvez vos désignations. Pas de mot de passe : vous recevez un lien de
          connexion par e-mail.
        </p>

        {sent && (
          <p className="mb-4 text-sm text-[var(--success)] bg-[var(--success-bg)] rounded-lg p-3">
            Si cette adresse correspond à un arbitre du comité, un lien de connexion vient de lui être envoyé.
            Pensez à vérifier les indésirables.
          </p>
        )}
        {error === "lien" && (
          <p className="mb-4 text-sm text-[var(--danger)]">Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.</p>
        )}
        {error === "envoi" && msg && <p className="mb-4 text-sm text-[var(--danger)]">{msg}</p>}

        <form action={requestLink} className="space-y-3">
          <div>
            <label className="block text-sm mb-1" htmlFor="email">
              Adresse e-mail (celle connue du comité)
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input w-full" />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Recevoir mon lien de connexion
          </button>
        </form>
      </div>
    </div>
  );
}
