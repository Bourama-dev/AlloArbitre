import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { listCompetitionLevels } from "@/lib/matches";

export const dynamic = "force-dynamic";

async function createMatch(formData: FormData) {
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
    redirect(`/matchs/nouveau?error=${encodeURIComponent("Champs obligatoires manquants.")}`);
  }

  const { data, error } = await supabaseAdmin
    .from("Match")
    .insert({
      date: new Date(`${date}T${heure}:00`).toISOString(),
      homeTeam,
      awayTeam,
      venue,
      competitionLevelId,
      refereesRequired,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/matchs/nouveau?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/matchs/${data.id}`);
}

export default async function NewMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;
  const levels = await listCompetitionLevels();

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <Link href="/matchs" className="text-sm text-[var(--accent)] hover:underline">
          ← Retour aux matchs
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-2">Nouveau match</h1>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger-bg)] rounded-lg p-3">
          {decodeURIComponent(error)}
        </p>
      )}

      <form
        action={createMatch}
        className="space-y-3 card p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Équipe domicile *</label>
            <input
              name="homeTeam"
              required
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Équipe extérieur *</label>
            <input
              name="awayTeam"
              required
              className="input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Date *</label>
            <input
              type="date"
              name="date"
              required
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Heure</label>
            <input
              type="time"
              name="heure"
              defaultValue="00:00"
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Lieu</label>
          <input
            name="venue"
            className="input w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Niveau de compétition *</label>
            <select
              name="competitionLevelId"
              required
              defaultValue=""
              className="input w-full"
            >
              <option value="" disabled>
                Sélectionner...
              </option>
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
              min={1}
              defaultValue={2}
              className="input w-full"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
        >
          Créer le match
        </button>
      </form>
    </div>
  );
}
