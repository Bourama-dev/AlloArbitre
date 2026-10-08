import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { describeRule, type Rule } from "@/lib/designation-rules";
import { getAllRules } from "@/lib/rules-store";
import { parseRuleForm } from "@/lib/rules-form";
import { AlertToast } from "@/components/alert-toast";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

const PERIODS = [
  { value: "day", label: "par jour" },
  { value: "week", label: "par semaine (lundi-dimanche)" },
  { value: "weekend", label: "par week-end (samedi-dimanche)" },
  { value: "rolling3", label: "sur 3 jours glissants" },
];
const SCOPES = [
  { value: "classiques", label: "matchs classiques (hors TQR)" },
  { value: "tqr", label: "TQR seulement" },
  { value: "tous", label: "tous les matchs, TQR compris" },
];
const DIVISION_SCOPES = [
  { value: "seniors", label: "les matchs seniors" },
  { value: "u20plus", label: "les matchs U20, U21 et seniors" },
  { value: "all", label: "toutes les divisions" },
  { value: "custom", label: "des divisions choisies (liste ci-dessous)" },
];

export default async function RulesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; created?: string; deleted?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/matchs");

  const { error, saved, created, deleted } = await searchParams;
  const [{ rules, fromDatabase }, { data: levelRows }, { data: divisionRows }] = await Promise.all([
    getAllRules(),
    supabaseAdmin.from("RefereeLevel").select("label, rank").order("rank"),
    supabaseAdmin.from("CompetitionLevel").select("label").order("label"),
  ]);
  const refereeLevels = ((levelRows ?? []) as { label: string }[]).map((l) => l.label);
  const divisions = ((divisionRows ?? []) as { label: string }[]).map((d) => d.label);

  async function guard() {
    const current = await getCurrentUser();
    if (current?.role !== "ADMIN") redirect("/matchs");
  }

  async function saveRule(formData: FormData) {
    "use server";
    await guard();
    const id = String(formData.get("id") ?? "");
    const kind = String(formData.get("kind") ?? "") as Rule["kind"];
    const input = parseRuleForm(formData, kind);
    if ("error" in input) redirect(`/admin/regles?error=${encodeURIComponent(input.error)}`);
    const { error } = await supabaseAdmin
      .from("DesignationRule")
      .update({ ...input, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/regles");
    revalidatePath("/reglement");
    redirect("/admin/regles?saved=1");
  }

  async function createRule(formData: FormData) {
    "use server";
    await guard();
    const kind = String(formData.get("kind") ?? "") as Rule["kind"];
    const input = parseRuleForm(formData, kind);
    if ("error" in input) redirect(`/admin/regles?error=${encodeURIComponent(input.error)}`);
    const { data: last } = await supabaseAdmin
      .from("DesignationRule")
      .select("position")
      .order("position", { ascending: false })
      .limit(1);
    const position = ((last?.[0]?.position as number | undefined) ?? 0) + 10;
    const { error } = await supabaseAdmin.from("DesignationRule").insert({ kind, builtin: false, position, ...input });
    if (error) throw error;
    revalidatePath("/admin/regles");
    revalidatePath("/reglement");
    redirect("/admin/regles?created=1");
  }

  async function deleteRule(formData: FormData) {
    "use server";
    await guard();
    const id = String(formData.get("id") ?? "");
    // Les règles fournies avec l'application se désactivent mais ne se suppriment pas.
    const { error } = await supabaseAdmin.from("DesignationRule").delete().eq("id", id).eq("builtin", false);
    if (error) throw error;
    revalidatePath("/admin/regles");
    revalidatePath("/reglement");
    redirect("/admin/regles?deleted=1");
  }

  const quotas = rules.filter((r) => r.kind !== "forbid");
  const forbids = rules.filter((r) => r.kind === "forbid");

  return (
    <div className="space-y-5 max-w-3xl">
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}
      {saved && <AlertToast message="Règle enregistrée." variant="success" />}
      {created && <AlertToast message="Règle ajoutée." variant="success" />}
      {deleted && <AlertToast message="Règle supprimée." variant="success" />}

      <div>
        <h1 className="text-xl font-bold tracking-tight">Règles de désignation</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Modifiez, désactivez ou ajoutez des règles : elles s&apos;appliquent aussitôt aux suggestions, à
          l&apos;auto-désignation, à la désignation manuelle et aux Contrôles. Un arbitre qui enfreint une règle n&apos;est jamais proposé automatiquement. En désignation manuelle, aucune règle ne bloque : une fenêtre demande confirmation. Les autres règles (distance, disponibilités,
          groupes, âge par division) se configurent dans leurs pages dédiées, listées dans{" "}
          <Link href="/reglement" className="text-[var(--accent)] hover:underline">
            Règlement
          </Link>
          .
        </p>
      </div>

      {!fromDatabase && (
        <p className="text-sm text-[var(--warning)] bg-[var(--warning-bg)] rounded-xl p-3">
          La table des règles n&apos;est pas encore disponible : les valeurs par défaut s&apos;appliquent et ne sont pas
          modifiables pour l&apos;instant.
        </p>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Quotas et repos</h2>
        {quotas.map((rule) => (
          <RuleCard key={rule.id} rule={rule} refereeLevels={refereeLevels} divisions={divisions} save={saveRule} remove={deleteRule} editable={fromDatabase} />
        ))}
        {fromDatabase && (
          <details className="card p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--accent)]">+ Nouveau quota</summary>
            <form action={createRule} className="mt-3 space-y-3">
              <input type="hidden" name="kind" value="quota" />
              <CommonFields />
              <QuotaFields />
              <SubmitButton className="btn btn-primary" pendingLabel="Ajout…">
                Ajouter le quota
              </SubmitButton>
            </form>
          </details>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Interdictions (qui peut arbitrer quoi)</h2>
        {forbids.map((rule) => (
          <RuleCard key={rule.id} rule={rule} refereeLevels={refereeLevels} divisions={divisions} save={saveRule} remove={deleteRule} editable={fromDatabase} />
        ))}
        {fromDatabase && (
          <details className="card p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--accent)]">+ Nouvelle interdiction</summary>
            <form action={createRule} className="mt-3 space-y-3">
              <input type="hidden" name="kind" value="forbid" />
              <CommonFields />
              <ForbidFields refereeLevels={refereeLevels} divisions={divisions} />
              <SubmitButton className="btn btn-primary" pendingLabel="Ajout…">
                Ajouter l&apos;interdiction
              </SubmitButton>
            </form>
          </details>
        )}
      </section>
    </div>
  );
}

function RuleCard({
  rule,
  refereeLevels,
  divisions,
  save,
  remove,
  editable,
}: {
  rule: Rule;
  refereeLevels: string[];
  divisions: string[];
  save: (formData: FormData) => void | Promise<void>;
  remove: (formData: FormData) => void | Promise<void>;
  editable: boolean;
}) {
  return (
    <details className="card p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm">{rule.label}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{describeRule(rule)}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`badge text-[var(--warning)] bg-[var(--warning-bg)]`}
            >
              À confirmer
            </span>
            {!rule.active && <span className="badge text-[var(--muted)] bg-[var(--neutral-bg)]">Désactivée</span>}
          </div>
        </div>
      </summary>

      {editable && (
        <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
          <form action={save} className="space-y-3">
            <input type="hidden" name="id" value={rule.id} />
            <input type="hidden" name="kind" value={rule.kind} />
            <CommonFields rule={rule} />
            {rule.kind === "quota" && <QuotaFields params={rule.params} />}
            {rule.kind === "tqr-repos" && <TqrFields value={rule.params.maxConsecutive} />}
            {rule.kind === "forbid" && <ForbidFields params={rule.params} refereeLevels={refereeLevels} divisions={divisions} />}
            <SubmitButton className="btn btn-primary" pendingLabel="Enregistrement…">
              Enregistrer
            </SubmitButton>
          </form>
          {!rule.builtin && (
            <form action={remove}>
              <input type="hidden" name="id" value={rule.id} />
              <button type="submit" className="btn-danger text-sm">
                Supprimer cette règle
              </button>
            </form>
          )}
        </div>
      )}
    </details>
  );
}

function CommonFields({ rule }: { rule?: Rule }) {
  return (
    <>
      <div>
        <label className="field-label">Nom de la règle</label>
        <input name="label" required maxLength={140} defaultValue={rule?.label ?? ""} className="input w-full" placeholder="Ex. Stagiaires : pas de match senior" />
      </div>
      <div>
        <label className="field-label">Explication (facultatif)</label>
        <textarea name="description" rows={2} defaultValue={rule?.description ?? ""} className="input w-full" />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <input type="hidden" name="severity" value="avertissement" />
        </div>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input type="checkbox" name="active" defaultChecked={rule?.active ?? true} />
          Règle active
        </label>
      </div>
    </>
  );
}

function QuotaFields({ params }: { params?: Extract<Rule, { kind: "quota" }>["params"] }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="field-label">Maximum</label>
        <input type="number" name="max" min={1} max={50} required defaultValue={params?.max ?? 2} className="input w-24" />
      </div>
      <div>
        <label className="field-label">Période</label>
        <select name="period" defaultValue={params?.period ?? "day"} className="input">
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Concerne</label>
        <select name="scope" defaultValue={params?.scope ?? "classiques"} className="input">
          {SCOPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TqrFields({ value }: { value: number }) {
  return (
    <div>
      <label className="field-label">Nombre de TQR d&apos;affilée avant un match de repos</label>
      <input type="number" name="maxConsecutive" min={1} max={10} required defaultValue={value} className="input w-24" />
    </div>
  );
}

function ForbidFields({
  params,
  refereeLevels,
  divisions,
}: {
  params?: Extract<Rule, { kind: "forbid" }>["params"];
  refereeLevels: string[];
  divisions: string[];
}) {
  return (
    <div className="space-y-3">
      <fieldset className="space-y-2 rounded-xl border border-[var(--border)] p-3">
        <legend className="field-label px-1">Arbitres concernés (l&apos;une ou l&apos;autre condition suffit)</legend>
        <div>
          <p className="text-xs text-[var(--muted)] mb-1">Niveau d&apos;arbitre</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {refereeLevels.map((l) => (
              <label key={l} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="levels" value={l} defaultChecked={params?.referee.levels.includes(l)} />
                {l}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">Âge inférieur à (ans révolus à la date du match)</label>
          <input type="number" name="ageUnder" min={1} max={99} defaultValue={params?.referee.ageUnder ?? ""} className="input w-24" placeholder="Aucun" />
        </div>
      </fieldset>
      <fieldset className="space-y-2 rounded-xl border border-[var(--border)] p-3">
        <legend className="field-label px-1">Interdit sur</legend>
        <select name="divisionScope" defaultValue={params?.division.scope ?? "seniors"} className="input">
          {DIVISION_SCOPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <details>
          <summary className="cursor-pointer text-xs text-[var(--accent)]">Divisions choisies</summary>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {divisions.map((d) => (
              <label key={d} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="divisions" value={d} defaultChecked={params?.division.labels.includes(d)} />
                {d}
              </label>
            ))}
          </div>
        </details>
      </fieldset>
    </div>
  );
}
