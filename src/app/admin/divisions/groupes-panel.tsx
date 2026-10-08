import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AlertToast } from "@/components/alert-toast";
import { CheckboxPicker } from "@/components/checkbox-picker";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export const dynamic = "force-dynamic";

type GroupRow = {
  id: string;
  label: string;
  members: { refereeId: string }[];
  divisions: { competitionLevelId: string }[];
};

/**
 * Groupes de désignation (viviers) : chaque groupe réunit des arbitres et
 * liste les divisions qu'ils sont autorisés à arbitrer. Une division
 * rattachée à au moins un groupe n'est ouverte qu'aux membres de ces
 * groupes ; une division sans groupe reste ouverte à tous.
 */
export async function GroupsPanel({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/matchs");
  const { error } = await searchParams;

  const [{ data: groups, error: gError }, { data: referees, error: rError }, { data: levels, error: lError }] =
    await Promise.all([
      supabaseAdmin
        .from("RefereeGroup")
        .select("id, label, members:RefereeGroupMember(refereeId), divisions:RefereeGroupDivision(competitionLevelId)")
        .order("label"),
      supabaseAdmin
        .from("Referee")
        .select("id, firstName, lastName, zone, level:RefereeLevel(label)")
        .eq("active", true)
        .order("lastName"),
      supabaseAdmin.from("CompetitionLevel").select("id, label").order("label"),
    ]);
  if (gError) throw gError;
  if (rError) throw rError;
  if (lError) throw lError;

  const refereeItems = ((referees ?? []) as unknown as {
    id: string;
    firstName: string;
    lastName: string;
    zone: string | null;
    level: { label: string } | { label: string }[] | null;
  }[]).map((r) => {
    const level = Array.isArray(r.level) ? r.level[0] : r.level;
    return {
      id: r.id,
      label: `${r.lastName} ${r.firstName}`,
      hint: [level?.label, r.zone].filter(Boolean).join(" · "),
    };
  });
  const levelItems = (levels ?? []).map((l) => ({ id: l.id as string, label: l.label as string }));
  const levelLabel = new Map(levelItems.map((l) => [l.id, l.label]));
  const groupRows = (groups ?? []) as unknown as GroupRow[];

  async function createGroup(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;
    const label = String(formData.get("label") ?? "").trim();
    if (!label) redirect(`/admin/divisions?onglet=groupes&error=${encodeURIComponent("Nom du groupe requis.")}`);
    const { error } = await supabaseAdmin.from("RefereeGroup").insert({ label });
    if (error) redirect(`/admin/divisions?onglet=groupes&error=${encodeURIComponent("Ce nom de groupe existe déjà.")}`);
    revalidatePath("/admin/divisions");
  }

  async function renameGroup(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;
    const id = String(formData.get("id"));
    const label = String(formData.get("label") ?? "").trim();
    if (!label) return;
    const { error } = await supabaseAdmin.from("RefereeGroup").update({ label }).eq("id", id);
    if (error) redirect(`/admin/divisions?onglet=groupes&error=${encodeURIComponent("Ce nom de groupe existe déjà.")}`);
    revalidatePath("/admin/divisions");
  }

  async function deleteGroup(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;
    const { error } = await supabaseAdmin.from("RefereeGroup").delete().eq("id", String(formData.get("id")));
    if (error) throw error;
    revalidatePath("/admin/divisions");
  }

  /** Remplace la liste des membres ou des divisions d'un groupe par la sélection envoyée. */
  async function saveLinks(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;
    const groupId = String(formData.get("groupId"));
    const kind = String(formData.get("kind"));
    const ids = [...new Set(formData.getAll("ids").map(String))];
    const table = kind === "members" ? "RefereeGroupMember" : "RefereeGroupDivision";
    const column = kind === "members" ? "refereeId" : "competitionLevelId";

    const { error: delError } = await supabaseAdmin.from(table).delete().eq("groupId", groupId);
    if (delError) throw delError;
    if (ids.length > 0) {
      const { error: insError } = await supabaseAdmin.from(table).insert(ids.map((id) => ({ groupId, [column]: id })));
      if (insError) throw insError;
    }
    revalidatePath("/admin/divisions");
  }

  return (
    <div className="space-y-6">
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Groupes de désignation</h2>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Créez vos viviers (ex. Élite, Formation…), placez-y vos arbitres et indiquez les divisions que chaque
          groupe peut arbitrer. Une division rattachée à au moins un groupe n&apos;est proposée qu&apos;aux membres de
          ces groupes. Une division sans groupe reste ouverte à tous les arbitres. Le niveau minimum (onglet Niveaux requis) reste appliqué en plus.
        </p>
      </div>

      <form action={createGroup} className="flex items-center gap-2 card p-3 max-w-xl">
        <input name="label" placeholder="Nom du groupe (ex. Élite)" required className="input flex-1" />
        <button type="submit" className="btn btn-primary text-xs">
          Créer le groupe
        </button>
      </form>

      {groupRows.length === 0 && (
        <p className="text-sm text-[var(--muted)]">Aucun groupe : toutes les divisions sont ouvertes à tous.</p>
      )}

      {groupRows.map((g) => (
        <section key={g.id} className="card p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <form action={renameGroup} className="flex items-center gap-2 flex-1 min-w-[16rem]">
              <input type="hidden" name="id" value={g.id} />
              <input name="label" defaultValue={g.label} className="input flex-1 font-semibold" />
              <button type="submit" className="btn btn-secondary text-xs">
                Renommer
              </button>
            </form>
            <form action={deleteGroup}>
              <input type="hidden" name="id" value={g.id} />
              <ConfirmSubmitButton
                className="btn-danger text-xs"
                confirmMessage={`Supprimer le groupe « ${g.label} » ? Ses divisions redeviendront ouvertes à tous si aucun autre groupe ne les couvre.`}
              >
                Supprimer
              </ConfirmSubmitButton>
            </form>
          </div>
          <p className="text-xs text-[var(--muted)]">
            {g.members.length} arbitre(s) · Divisions autorisées :{" "}
            {g.divisions.length === 0
              ? "aucune"
              : g.divisions.map((d) => levelLabel.get(d.competitionLevelId) ?? "?").join(", ")}
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <form action={saveLinks} className="space-y-2">
              <input type="hidden" name="groupId" value={g.id} />
              <input type="hidden" name="kind" value="divisions" />
              <h2 className="field-label">Divisions autorisées</h2>
              <CheckboxPicker
                name="ids"
                items={levelItems}
                selected={g.divisions.map((d) => d.competitionLevelId)}
                placeholder="Filtrer les divisions…"
              />
              <button type="submit" className="btn btn-primary text-xs">
                Enregistrer les divisions
              </button>
            </form>
            <form action={saveLinks} className="space-y-2">
              <input type="hidden" name="groupId" value={g.id} />
              <input type="hidden" name="kind" value="members" />
              <h2 className="field-label">Arbitres du groupe</h2>
              <CheckboxPicker
                name="ids"
                items={refereeItems}
                selected={g.members.map((m) => m.refereeId)}
                placeholder="Nom, niveau ou club…"
              />
              <button type="submit" className="btn btn-primary text-xs">
                Enregistrer les arbitres
              </button>
            </form>
          </div>
        </section>
      ))}
    </div>
  );
}
