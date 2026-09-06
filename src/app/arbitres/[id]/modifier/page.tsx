import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRefereeSheet, listRefereeLevels } from "@/lib/referees";
import { geocodeAddress } from "@/lib/geocoding";
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
    const address = String(formData.get("address") ?? "").trim() || null;
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const levelId = String(formData.get("levelId") ?? "");
    const active = formData.get("active") === "on";

    if (!firstName || !lastName || !levelId) {
      redirect(
        `/arbitres/${id}/modifier?error=${encodeURIComponent("Champs obligatoires manquants.")}`
      );
    }

    const addressChanged = address !== (referee.address ?? null);
    const coords = addressChanged && address ? await geocodeAddress(address) : null;

    const { error } = await supabaseAdmin
      .from("Referee")
      .update({
        firstName,
        lastName,
        phone,
        email,
        zone,
        address,
        notes,
        levelId,
        active,
        ...(addressChanged ? { lat: coords?.lat ?? null, lng: coords?.lng ?? null } : {}),
      })
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
        <Link href={`/arbitres/${id}`} className="text-sm text-[var(--accent)] hover:underline">
          ← Retour à la fiche
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-2">Modifier l&apos;arbitre</h1>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger-bg)] rounded-lg p-3">
          {decodeURIComponent(error)}
        </p>
      )}

      <form
        action={updateReferee}
        className="space-y-3 card p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Prénom *</label>
            <input
              name="firstName"
              required
              defaultValue={referee.firstName}
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Nom *</label>
            <input
              name="lastName"
              required
              defaultValue={referee.lastName}
              className="input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Téléphone</label>
            <input
              name="phone"
              defaultValue={referee.phone ?? ""}
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={referee.email ?? ""}
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Adresse postale</label>
          <input
            name="address"
            defaultValue={referee.address ?? ""}
            className="input w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Zone / club</label>
            <input
              name="zone"
              defaultValue={referee.zone ?? ""}
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Niveau *</label>
            <select
              name="levelId"
              required
              defaultValue={referee.levelId}
              className="input w-full"
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
          <label className="field-label">Notes</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={referee.notes ?? ""}
            className="input w-full"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={referee.active} />
          Actif (disponible pour les suggestions de désignation)
        </label>

        <button
          type="submit"
          className="btn btn-primary"
        >
          Enregistrer
        </button>
      </form>

      <form action={deleteReferee} className="card p-4">
        <ConfirmSubmitButton
          confirmMessage="Supprimer définitivement cet arbitre ? Impossible s'il a des désignations existantes - désactivez-le plutôt dans ce cas."
          className="btn btn-secondary text-[var(--danger)]"
        >
          Supprimer définitivement
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
