import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getMatchById, listCompetitionLevels } from "@/lib/matches";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export const dynamic = "force-dynamic";

export default async function EditMatchPage({
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

  const match = await getMatchById(id);
  if (!match) notFound();
  const levels = await listCompetitionLevels();

  async function updateMatch(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const homeTeam = String(formData.get("homeTeam") ?? "").trim();
    const awayTeam = String(formData.get("awayTeam") ?? "").trim();
    const date = String(formData.get("date") ?? "");
    const heure = String(formData.get("heure") ?? "00:00");
    const venue = String(formData.get("venue") ?? "").trim() || null;
    const competitionLevelId = String(formData.get("competitionLevelId") ?? "");
    const refereesRequired = Number(formData.get("refereesRequired")) || 1;

    if (!homeTeam || !awayTeam || !date || !competitionLevelId) {
      redirect(`/matchs/${id}/modifier?error=${encodeURIComponent("Champs obligatoires manquants.")}`);
    }

    const { error } = await supabaseAdmin
      .from("Match")
      .update({
        date: new Date(`${date}T${heure}:00`).toISOString(),
        homeTeam,
        awayTeam,
        venue,
        competitionLevelId,
        refereesRequired,
      })
      .eq("id", id);

    if (error) {
      redirect(`/matchs/${id}/modifier?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath(`/matchs/${id}`);
    revalidatePath("/matchs");
    revalidatePath("/matchs/incomplets");
    redirect(`/matchs/${id}`);
  }

  async function toggleCancelled(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const cancelled = formData.get("cancelled") === "true";

    const { error } = await supabaseAdmin.from("Match").update({ cancelled }).eq("id", id);
    if (error) throw error;

    revalidatePath(`/matchs/${id}`);
    revalidatePath("/matchs");
    revalidatePath("/matchs/incomplets");
    redirect(`/matchs/${id}`);
  }

  async function deleteMatch() {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const { error } = await supabaseAdmin.from("Match").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/matchs");
    revalidatePath("/matchs/incomplets");
    redirect("/matchs");
  }

  const dateStr = match.date.toISOString().slice(0, 10);
  const heureStr = match.date.toISOString().slice(11, 16);

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <Link href={`/matchs/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Retour au match
        </Link>
        <h1 className="text-lg font-semibold mt-2">Modifier le match</h1>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {decodeURIComponent(error)}
        </p>
      )}

      <form
        action={updateMatch}
        className="space-y-3 bg-white border border-neutral-200 rounded-lg p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Équipe domicile *</label>
            <input
              name="homeTeam"
              required
              defaultValue={match.homeTeam}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Équipe extérieur *</label>
            <input
              name="awayTeam"
              required
              defaultValue={match.awayTeam}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Date *</label>
            <input
              type="date"
              name="date"
              required
              defaultValue={dateStr}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Heure</label>
            <input
              type="time"
              name="heure"
              defaultValue={heureStr}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Lieu</label>
          <input
            name="venue"
            defaultValue={match.venue ?? ""}
            className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Niveau de compétition *</label>
            <select
              name="competitionLevelId"
              required
              defaultValue={match.competitionLevelId}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            >
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Arbitres requis</label>
            <input
              type="number"
              name="refereesRequired"
              min={1}
              defaultValue={match.refereesRequired}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded bg-neutral-900 text-white text-sm px-4 py-1.5 hover:bg-neutral-800"
        >
          Enregistrer
        </button>
      </form>

      <div className="flex items-center gap-4 bg-white border border-neutral-200 rounded-lg p-4">
        <form action={toggleCancelled}>
          <input type="hidden" name="cancelled" value={match.cancelled ? "false" : "true"} />
          <button
            type="submit"
            className="rounded border border-amber-300 text-amber-700 text-sm px-3 py-1.5 hover:bg-amber-50"
          >
            {match.cancelled ? "Réactiver le match" : "Annuler le match"}
          </button>
        </form>

        <form action={deleteMatch}>
          <ConfirmSubmitButton
            confirmMessage="Supprimer définitivement ce match et ses désignations ? Cette action est irréversible."
            className="rounded border border-red-300 text-red-700 text-sm px-3 py-1.5 hover:bg-red-50"
          >
            Supprimer définitivement
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
