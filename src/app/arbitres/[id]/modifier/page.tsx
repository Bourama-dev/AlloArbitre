import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRefereeSheet, listRefereeLevels } from "@/lib/referees";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export const dynamic = "force-dynamic";

export default async function EditRefereePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { error } = await searchParams;

  const sheet = await getRefereeSheet(id);
  if (!sheet) notFound();
  const { referee } = sheet;
  const levels = await listRefereeLevels();

  async function updateReferee(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim() || null;
    const email = String(formData.get("email") ?? "").trim() || null;
    const zone = String(formData.get("zone") ?? "").trim() || null;
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const levelId = String(formData.get("levelId") ?? "");
    const active = formData.get("active") === "on";

    if (!firstName || !lastName || !levelId) {
      redirect(
        `/arbitres/${id}/modifier?error=${encodeURIComponent("Champs obligatoires manquants.")}`
      );
    }

    const { error } = await supabaseAdmin
      .from("Referee")
      .update({ firstName, lastName, phone, email, zone, notes, levelId, active })
      .eq("id", id);

    if (error) {
      redirect(`/arbitres/${id}/modifier?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath(`/arbitres/${id}`);
    revalidatePath("/arbitres");
    redirect(`/arbitres/${id}`);
  }

  async function deleteReferee() {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const { error } = await supabaseAdmin.from("Referee").delete().eq("id", id);
    if (error) {
      redirect(
        `/arbitres/${id}/modifier?error=${encodeURIComponent(
          "Suppression impossible : cet arbitre a des désignations existantes. Désactivez-le plutôt."
        )}`
      );
    }

    revalidatePath("/arbitres");
    redirect("/arbitres");
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <Link href={`/arbitres/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Retour à la fiche
        </Link>
        <h1 className="text-lg font-semibold mt-2">Modifier l&apos;arbitre</h1>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {decodeURIComponent(error)}
        </p>
      )}

      <form
        action={updateReferee}
        className="space-y-3 bg-white border border-neutral-200 rounded-lg p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Prénom *</label>
            <input
              name="firstName"
              required
              defaultValue={referee.firstName}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Nom *</label>
            <input
              name="lastName"
              required
              defaultValue={referee.lastName}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Téléphone</label>
            <input
              name="phone"
              defaultValue={referee.phone ?? ""}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={referee.email ?? ""}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Zone / club</label>
            <input
              name="zone"
              defaultValue={referee.zone ?? ""}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Niveau *</label>
            <select
              name="levelId"
              required
              defaultValue={referee.levelId}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            >
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={referee.notes ?? ""}
            className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={referee.active} />
          Actif (disponible pour les suggestions de désignation)
        </label>

        <button
          type="submit"
          className="rounded bg-neutral-900 text-white text-sm px-4 py-1.5 hover:bg-neutral-800"
        >
          Enregistrer
        </button>
      </form>

      <form action={deleteReferee} className="bg-white border border-neutral-200 rounded-lg p-4">
        <ConfirmSubmitButton
          confirmMessage="Supprimer définitivement cet arbitre ? Impossible s'il a des désignations existantes - désactivez-le plutôt dans ce cas."
          className="rounded border border-red-300 text-red-700 text-sm px-3 py-1.5 hover:bg-red-50"
        >
          Supprimer définitivement
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
