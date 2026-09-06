import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CompetitionLevelRow = {
  id: string;
  label: string;
  mapping: { minRefereeLevel: { id: string; label: string } } | null;
};

export default async function LevelMappingAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/matchs");
  }

  const { error } = await searchParams;

  const [{ data: competitionLevels, error: clError }, { data: refereeLevels, error: rlError }] =
    await Promise.all([
      supabaseAdmin
        .from("CompetitionLevel")
        .select("id, label, mapping:LevelMapping(minRefereeLevel:RefereeLevel(id, label))")
        .order("label", { ascending: true }),
      supabaseAdmin.from("RefereeLevel").select("id, label, rank").order("rank", { ascending: true }),
    ]);
  if (clError) throw clError;
  if (rlError) throw rlError;

  async function saveMapping(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;

    const competitionLevelId = String(formData.get("competitionLevelId"));
    const minRefereeLevelId = String(formData.get("minRefereeLevelId"));

    const { error } = await supabaseAdmin
      .from("LevelMapping")
      .upsert({ competitionLevelId, minRefereeLevelId }, { onConflict: "competitionLevelId" });
    if (error) throw error;
    revalidatePath("/admin/niveaux");
  }

  async function addRefereeLevel(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;

    const label = String(formData.get("label") ?? "").trim();
    const rank = Number(formData.get("rank"));
    if (!label || !rank) {
      redirect(`/admin/niveaux?error=${encodeURIComponent("Libellé et rang requis.")}`);
    }

    const { error } = await supabaseAdmin.from("RefereeLevel").insert({ label, rank });
    if (error) {
      redirect(`/admin/niveaux?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/admin/niveaux");
  }

  async function renameRefereeLevel(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;

    const id = String(formData.get("id"));
    const label = String(formData.get("label") ?? "").trim();
    const rank = Number(formData.get("rank"));
    if (!label || !rank) return;

    const { error } = await supabaseAdmin
      .from("RefereeLevel")
      .update({ label, rank })
      .eq("id", id);
    if (error) {
      redirect(`/admin/niveaux?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/admin/niveaux");
  }

  async function deleteRefereeLevel(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;
    const id = String(formData.get("id"));

    const { error } = await supabaseAdmin.from("RefereeLevel").delete().eq("id", id);
    if (error) {
      redirect(
        `/admin/niveaux?error=${encodeURIComponent(
          "Suppression impossible : ce niveau est utilisé par des arbitres ou une correspondance."
        )}`
      );
    }
    revalidatePath("/admin/niveaux");
  }

  async function addCompetitionLevel(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;

    const label = String(formData.get("label") ?? "").trim();
    if (!label) {
      redirect(`/admin/niveaux?error=${encodeURIComponent("Libellé requis.")}`);
    }

    const { error } = await supabaseAdmin.from("CompetitionLevel").insert({ label });
    if (error) {
      redirect(`/admin/niveaux?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/admin/niveaux");
  }

  async function renameCompetitionLevel(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;

    const id = String(formData.get("id"));
    const label = String(formData.get("label") ?? "").trim();
    if (!label) return;

    const { error } = await supabaseAdmin.from("CompetitionLevel").update({ label }).eq("id", id);
    if (error) {
      redirect(`/admin/niveaux?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/admin/niveaux");
  }

  async function deleteCompetitionLevel(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;
    const id = String(formData.get("id"));

    const { error } = await supabaseAdmin.from("CompetitionLevel").delete().eq("id", id);
    if (error) {
      redirect(
        `/admin/niveaux?error=${encodeURIComponent(
          "Suppression impossible : ce niveau est utilisé par des matchs existants."
        )}`
      );
    }
    revalidatePath("/admin/niveaux");
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {decodeURIComponent(error)}
        </p>
      )}

      <div>
        <h1 className="text-lg font-semibold">
          Correspondance niveaux de compétition → niveau d&apos;arbitre minimum
        </h1>
        <p className="text-sm text-neutral-500">
          Cette table pilote le filtre de niveau de l&apos;algorithme de suggestion
          d&apos;arbitres. Modifiez-la librement, rien n&apos;est figé dans le code.
        </p>

        <div className="overflow-x-auto border border-neutral-200 rounded-lg mt-3">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Niveau de compétition</th>
                <th className="px-3 py-2 font-medium">Niveau d&apos;arbitre minimum</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(competitionLevels as unknown as CompetitionLevelRow[]).map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 whitespace-nowrap">{c.label}</td>
                  <td className="px-3 py-2">
                    <form action={saveMapping} className="flex items-center gap-2">
                      <input type="hidden" name="competitionLevelId" value={c.id} />
                      <select
                        name="minRefereeLevelId"
                        defaultValue={c.mapping?.minRefereeLevel?.id ?? ""}
                        className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
                      >
                        <option value="" disabled>
                          Non défini
                        </option>
                        {refereeLevels.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded bg-neutral-900 text-white text-xs px-3 py-1.5 hover:bg-neutral-800"
                      >
                        Enregistrer
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold">Niveaux d&apos;arbitre</h2>
        <p className="text-sm text-neutral-500">
          Rang croissant = niveau plus élevé. La suppression échoue si des
          arbitres ou une correspondance utilisent encore ce niveau.
        </p>

        <div className="overflow-x-auto border border-neutral-200 rounded-lg mt-3">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Libellé</th>
                <th className="px-3 py-2 font-medium">Rang</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {refereeLevels.map((l) => (
                <tr key={l.id}>
                  <td colSpan={3} className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <form action={renameRefereeLevel} className="flex items-center gap-2 flex-1">
                        <input type="hidden" name="id" value={l.id} />
                        <input
                          name="label"
                          defaultValue={l.label}
                          className="rounded border border-neutral-300 px-2 py-1.5 text-sm flex-1"
                        />
                        <input
                          type="number"
                          name="rank"
                          defaultValue={l.rank}
                          className="rounded border border-neutral-300 px-2 py-1.5 text-sm w-20"
                        />
                        <button
                          type="submit"
                          className="rounded bg-neutral-900 text-white text-xs px-3 py-1.5 hover:bg-neutral-800"
                        >
                          Enregistrer
                        </button>
                      </form>
                      <form action={deleteRefereeLevel}>
                        <input type="hidden" name="id" value={l.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline whitespace-nowrap"
                        >
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          action={addRefereeLevel}
          className="flex items-center gap-2 mt-3 bg-white border border-neutral-200 rounded-lg p-3"
        >
          <input
            name="label"
            placeholder="Libellé (ex: DEP-2)"
            required
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm flex-1"
          />
          <input
            type="number"
            name="rank"
            placeholder="Rang"
            required
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm w-24"
          />
          <button
            type="submit"
            className="rounded bg-neutral-900 text-white text-xs px-3 py-1.5 hover:bg-neutral-800"
          >
            Ajouter
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-base font-semibold">Niveaux de compétition</h2>
        <p className="text-sm text-neutral-500">
          La suppression échoue si des matchs existants utilisent encore ce
          niveau.
        </p>

        <div className="overflow-x-auto border border-neutral-200 rounded-lg mt-3">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-100">
              {(competitionLevels as unknown as CompetitionLevelRow[]).map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2">
                    <form action={renameCompetitionLevel} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        name="label"
                        defaultValue={c.label}
                        className="rounded border border-neutral-300 px-2 py-1.5 text-sm flex-1"
                      />
                      <button
                        type="submit"
                        className="rounded bg-neutral-900 text-white text-xs px-3 py-1.5 hover:bg-neutral-800"
                      >
                        Enregistrer
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <form action={deleteCompetitionLevel}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          action={addCompetitionLevel}
          className="flex items-center gap-2 mt-3 bg-white border border-neutral-200 rounded-lg p-3"
        >
          <input
            name="label"
            placeholder="Libellé (ex: TQR1_U15M)"
            required
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm flex-1"
          />
          <button
            type="submit"
            className="rounded bg-neutral-900 text-white text-xs px-3 py-1.5 hover:bg-neutral-800"
          >
            Ajouter
          </button>
        </form>
      </div>
    </div>
  );
}
