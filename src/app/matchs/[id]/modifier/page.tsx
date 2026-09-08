import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getMatchById, listCompetitionLevels } from "@/lib/matches";
import { matchDurationMinutes } from "@/lib/import-matches";
import { geocodeAddress } from "@/lib/geocoding";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AlertToast } from "@/components/alert-toast";
import { SubmitButton } from "@/components/submit-button";

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
  const currentVenueAddress = match.venueAddress;

  async function updateMatch(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const homeTeam = String(formData.get("homeTeam") ?? "").trim();
    const awayTeam = String(formData.get("awayTeam") ?? "").trim();
    const date = String(formData.get("date") ?? "");
    const heure = String(formData.get("heure") ?? "00:00");
    const venue = String(formData.get("venue") ?? "").trim() || null;
    const city = String(formData.get("city") ?? "").trim() || null;
    const venueAddress = String(formData.get("venueAddress") ?? "").trim() || null;
    const poule = String(formData.get("poule") ?? "").trim() || null;
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const competitionLevelId = String(formData.get("competitionLevelId") ?? "");
    const refereesRequired = Math.max(2, Number(formData.get("refereesRequired")) || 2);

    if (!homeTeam || !awayTeam || !date || !competitionLevelId) {
      redirect(`/matchs/${id}/modifier?error=${encodeURIComponent("Champs obligatoires manquants.")}`);
    }

    const addressChanged = venueAddress !== (currentVenueAddress ?? null);
    const coords = addressChanged && venueAddress ? await geocodeAddress(venueAddress) : null;

    const { data: level, error: levelError } = await supabaseAdmin
      .from("CompetitionLevel")
      .select("label")
      .eq("id", competitionLevelId)
      .maybeSingle();
    if (levelError) throw levelError;
    const durationMinutes = matchDurationMinutes(level?.label ?? "");

    const { error } = await supabaseAdmin
      .from("Match")
      .update({
        date: new Date(`${date}T${heure}:00`).toISOString(),
        homeTeam,
        awayTeam,
        venue,
        city,
        venueAddress,
        poule,
        notes,
        competitionLevelId,
        refereesRequired,
        durationMinutes,
        ...(addressChanged ? { lat: coords?.lat ?? null, lng: coords?.lng ?? null } : {}),
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
        <Link href={`/matchs/${id}`} className="text-sm text-[var(--accent)] hover:underline">
          ← Retour au match
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-2">Modifier le match</h1>
      </div>

      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}

      <form
        action={updateMatch}
        className="space-y-3 card p-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label">Équipe domicile *</label>
            <input
              name="homeTeam"
              required
              defaultValue={match.homeTeam}
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Équipe extérieur *</label>
            <input
              name="awayTeam"
              required
              defaultValue={match.awayTeam}
              className="input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label">Date *</label>
            <input
              type="date"
              name="date"
              required
              defaultValue={dateStr}
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Heure</label>
            <input
              type="time"
              name="heure"
              defaultValue={heureStr}
              className="input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label">Lieu</label>
            <input name="venue" defaultValue={match.venue ?? ""} className="input w-full" />
          </div>
          <div>
            <label className="field-label">Ville</label>
            <input name="city" defaultValue={match.city ?? ""} className="input w-full" />
          </div>
        </div>

        <div>
          <label className="field-label">Adresse du gymnase</label>
          <input
            name="venueAddress"
            defaultValue={match.venueAddress ?? ""}
            placeholder="Pour le calcul de distance/rémunération"
            className="input w-full"
          />
        </div>

        <div>
          <label className="field-label">Poule</label>
          <input name="poule" defaultValue={match.poule ?? ""} className="input w-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label">Niveau de compétition *</label>
            <select
              name="competitionLevelId"
              required
              defaultValue={match.competitionLevelId}
              className="input w-full"
            >
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Arbitres requis</label>
            <input
              type="number"
              name="refereesRequired"
              min={2}
              defaultValue={match.refereesRequired}
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Notes</label>
          <textarea name="notes" rows={2} defaultValue={match.notes ?? ""} className="input w-full" />
        </div>

        <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
      </form>

      <div className="flex items-center gap-4 card p-4">
        <form action={toggleCancelled}>
          <input type="hidden" name="cancelled" value={match.cancelled ? "false" : "true"} />
          <SubmitButton className="btn btn-secondary text-[var(--warning)]">
            {match.cancelled ? "Réactiver le match" : "Annuler le match"}
          </SubmitButton>
        </form>

        <form action={deleteMatch}>
          <ConfirmSubmitButton
            confirmMessage="Supprimer définitivement ce match et ses désignations ? Cette action est irréversible."
            className="btn btn-secondary text-[var(--danger)]"
          >
            Supprimer définitivement
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
