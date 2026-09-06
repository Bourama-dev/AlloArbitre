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
        <Link href="/matchs" className="text-sm text-blue-600 hover:underline">
          ← Retour aux matchs
        </Link>
        <h1 className="text-lg font-semibold mt-2">Nouveau match</h1>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {decodeURIComponent(error)}
        </p>
      )}

      <form
        action={createMatch}
        className="space-y-3 bg-white border border-neutral-200 rounded-lg p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Équipe domicile *</label>
            <input
              name="homeTeam"
              required
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Équipe extérieur *</label>
            <input
              name="awayTeam"
              required
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
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Heure</label>
            <input
              type="time"
              name="heure"
              defaultValue="00:00"
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Lieu</label>
          <input
            name="venue"
            className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Niveau de compétition *</label>
            <select
              name="competitionLevelId"
              required
              defaultValue=""
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
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
            <label className="block text-xs text-neutral-500 mb-1">Arbitres requis</label>
            <input
              type="number"
              name="refereesRequired"
              min={1}
              defaultValue={2}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded bg-neutral-900 text-white text-sm px-4 py-1.5 hover:bg-neutral-800"
        >
          Créer le match
        </button>
      </form>
    </div>
  );
}
