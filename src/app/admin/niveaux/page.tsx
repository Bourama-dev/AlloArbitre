import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AlertToast } from "@/components/alert-toast";

export const dynamic = "force-dynamic";

type CompetitionLevelRow = {
  id: string;
  label: string;
  mapping: { minRefereeLevel: { id: string; label: string } } | null;
};

/**
 * PostgREST renvoie `mapping` tantôt comme un objet (relation to-one bien
 * détectée), tantôt comme un tableau (à 0 ou 1 élément) selon l'état du
 * cache de schéma - normalise les deux formes pour ne jamais rater une
 * correspondance pourtant bien enregistrée en base.
 */
function normalizeMapping(
  raw: unknown
): { minRefereeLevel: { id: string; label: string } } | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw[0] as { minRefereeLevel: { id: string; label: string } }) ?? null;
  return raw as { minRefereeLevel: { id: string; label: string } };
}

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

  const competitionLevelRows: CompetitionLevelRow[] = (
    (competitionLevels ?? []) as unknown as { id: string; label: string; mapping: unknown }[]
  ).map((c) => ({ id: c.id, label: c.label, mapping: normalizeMapping(c.mapping) }));

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
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}

      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Correspondance niveaux de compétition → niveau d&apos;arbitre minimum
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Cette table pilote le filtre de niveau de l&apos;algorithme de suggestion
          d&apos;arbitres. Modifiez-la librement, rien n&apos;est figé dans le code.
        </p>

        <div className="table-shell overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 font-medium">Niveau de compétition</th>
                <th className="px-3 py-2 font-medium">Niveau d&apos;arbitre minimum</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {competitionLevelRows.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 whitespace-nowrap">{c.label}</td>
                  <td className="px-3 py-2">
                    <form action={saveMapping} className="flex items-center gap-2">
                      <input type="hidden" name="competitionLevelId" value={c.id} />
                      <select
                        name="minRefereeLevelId"
                        defaultValue={c.mapping?.minRefereeLevel?.id ?? ""}
                        className="input"
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
                        className="btn btn-primary text-xs"
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
        <p className="text-sm text-[var(--muted)]">
          Rang 1 = niveau le plus élevé (rang croissant = niveau plus bas). La
          suppression échoue si des arbitres ou une correspondance utilisent
          encore ce niveau.
        </p>

        <div className="table-shell overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 font-medium">Libellé</th>
                <th className="px-3 py-2 font-medium">Rang</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {refereeLevels.map((l) => (
                <tr key={l.id}>
                  <td colSpan={3} className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <form action={renameRefereeLevel} className="flex items-center gap-2 flex-1">
                        <input type="hidden" name="id" value={l.id} />
                        <input
                          name="label"
                          defaultValue={l.label}
                          className="input flex-1"
                        />
                        <input
                          type="number"
                          name="rank"
                          defaultValue={l.rank}
                          className="input w-20"
                        />
                        <button
                          type="submit"
                          className="btn btn-primary text-xs"
                        >
                          Enregistrer
                        </button>
                      </form>
                      <form action={deleteRefereeLevel}>
                        <input type="hidden" name="id" value={l.id} />
                        <button
                          type="submit"
                          className="btn-danger text-xs whitespace-nowrap"
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
          className="flex items-center gap-2 mt-3 card p-3"
        >
          <input
            name="label"
            placeholder="Libellé (ex: DEP-2)"
            required
            className="input flex-1"
          />
          <input
            type="number"
            name="rank"
            placeholder="Rang"
            required
            className="input w-24"
          />
          <button
            type="submit"
            className="btn btn-primary text-xs"
          >
            Ajouter
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-base font-semibold">Niveaux de compétition</h2>
        <p className="text-sm text-[var(--muted)]">
          La suppression échoue si des matchs existants utilisent encore ce
          niveau.
        </p>

        <div className="table-shell overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <tbody>
              {competitionLevelRows.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2">
                    <form action={renameCompetitionLevel} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        name="label"
                        defaultValue={c.label}
                        className="input flex-1"
                      />
                      <button
                        type="submit"
                        className="btn btn-primary text-xs"
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
                        className="btn-danger text-xs"
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
          className="flex items-center gap-2 mt-3 card p-3"
        >
          <input
            name="label"
            placeholder="Libellé (ex: TQR1_U15M)"
            required
            className="input flex-1"
          />
          <button
            type="submit"
            className="btn btn-primary text-xs"
          >
            Ajouter
          </button>
        </form>
      </div>
    </div>
  );
}
