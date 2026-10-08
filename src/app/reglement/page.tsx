import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { describeRule, SYSTEM_RULES, type Rule } from "@/lib/designation-rules";
import { getSettings } from "@/lib/algo-rules";
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
  searchParams: Promise<{ error?: string; saved?: string; created?: string; deleted?: string; params?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isAdmin = user.role === "ADMIN";

  const { error, saved, created, deleted, params: paramsSaved } = await searchParams;
  const [{ rules: allRules, fromDatabase }, settings, { data: levelRows }, { data: divisionRows }] = await Promise.all([
    getAllRules(),
    getSettings(),
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
    if ("error" in input) redirect(`/reglement?error=${encodeURIComponent(input.error)}`);
    const { error } = await supabaseAdmin
      .from("DesignationRule")
      .update({ ...input, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/reglement");
    redirect("/reglement?saved=1");
  }

  async function createRule(formData: FormData) {
    "use server";
    await guard();
    const kind = String(formData.get("kind") ?? "") as Rule["kind"];
    const input = parseRuleForm(formData, kind);
    if ("error" in input) redirect(`/reglement?error=${encodeURIComponent(input.error)}`);
    const { data: last } = await supabaseAdmin
      .from("DesignationRule")
      .select("position")
      .order("position", { ascending: false })
      .limit(1);
    const position = ((last?.[0]?.position as number | undefined) ?? 0) + 10;
    const { error } = await supabaseAdmin.from("DesignationRule").insert({ kind, builtin: false, position, ...input });
    if (error) throw error;
    revalidatePath("/reglement");
    redirect("/reglement?created=1");
  }

  async function deleteRule(formData: FormData) {
    "use server";
    await guard();
    const id = String(formData.get("id") ?? "");
    // Les règles fournies avec l'application se désactivent mais ne se suppriment pas.
    const { error } = await supabaseAdmin.from("DesignationRule").delete().eq("id", id).eq("builtin", false);
    if (error) throw error;
    revalidatePath("/reglement");
    redirect("/reglement?deleted=1");
  }

  async function saveSettings(formData: FormData) {
    "use server";
    await guard();
    const raw = String(formData.get("maxDistanceKm") ?? "").trim().replace(",", ".");
    const value = raw === "" ? null : Number(raw);
    if (value != null && (!Number.isFinite(value) || value <= 0)) {
      redirect(`/reglement?error=${encodeURIComponent("Distance maximale : un nombre de km positif, ou vide.")}`);
    }
    const { error } = await supabaseAdmin.from("Settings").upsert({
      id: 1,
      maxDistanceKm: value,
      requireAvailability: formData.get("requireAvailability") === "on",
      updatedAt: new Date().toISOString(),
    });
    if (error) throw error;
    redirect("/reglement?params=1");
  }

  const rules = isAdmin ? allRules : allRules.filter((r) => r.active);
  const quotas = rules.filter((r) => r.kind !== "forbid");
  const forbids = rules.filter((r) => r.kind === "forbid");

  return (
    <div className="space-y-5 max-w-3xl">
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}
      {saved && <AlertToast message="Règle enregistrée." variant="success" />}
      {created && <AlertToast message="Règle ajoutée." variant="success" />}
      {deleted && <AlertToast message="Règle supprimée." variant="success" />}
      {paramsSaved && <AlertToast message="Paramètres enregistrés." variant="success" />}

      <div>
        <h1 className="text-xl font-bold tracking-tight">Règlement des désignations</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Les règles vous aident à décider : aucune ne bloque. En désignation manuelle, une fenêtre demande de confirmer ;
          les suggestions et l&apos;auto-désignation ne proposent pas un arbitre qui enfreint une règle.
          {isAdmin && " Ouvrez une règle pour la modifier, la désactiver ou en ajouter : le changement s'applique aussitôt."}
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
          <RuleCard key={rule.id} rule={rule} refereeLevels={refereeLevels} divisions={divisions} save={saveRule} remove={deleteRule} editable={fromDatabase && isAdmin} />
        ))}
        {fromDatabase && isAdmin && (
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
          <RuleCard key={rule.id} rule={rule} refereeLevels={refereeLevels} divisions={divisions} save={saveRule} remove={deleteRule} editable={fromDatabase && isAdmin} />
        ))}
        {fromDatabase && isAdmin && (
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

      <section className="space-y-2" id="parametres">
        <h2 className="text-sm font-bold">Paramètres du comité</h2>
        {isAdmin ? (
          <form action={saveSettings} className="card p-4 space-y-3">
            <div>
              <label htmlFor="maxDistanceKm" className="field-label">
                Distance maximale domicile → gymnase (km, aller simple)
              </label>
              <input
                id="maxDistanceKm"
                name="maxDistanceKm"
                type="number"
                min={1}
                step="0.1"
                defaultValue={settings.maxDistanceKm ?? ""}
                placeholder="Pas de limite"
                className="input w-40 mt-1"
              />
              <p className="text-xs text-[var(--muted)] mt-1">
                Au-delà, l&apos;arbitre n&apos;est plus proposé (désignation manuelle : à confirmer). Distance par la
                route (Google Routes) si disponible, sinon à vol d&apos;oiseau. Un 2e match dans le même gymnase le même
                jour n&apos;est pas concerné. Vide = pas de limite.
              </p>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="requireAvailability" defaultChecked={settings.requireAvailability} className="mt-0.5" />
              <span>
                <span className="font-medium">Sans réponse aux disponibilités = exclu</span>
                <span className="block text-xs text-[var(--muted)]">
                  Une fois la date limite d&apos;une campagne passée, un arbitre qui n&apos;a pas répondu n&apos;est plus
                  proposé sur les matchs de cette période. Décoché, il reste proposé avec une simple mention.
                </span>
              </span>
            </label>
            <SubmitButton className="btn btn-primary" pendingLabel="Enregistrement…">
              Enregistrer les paramètres
            </SubmitButton>
          </form>
        ) : (
          <ul className="card divide-y divide-[var(--border)]">
            <li className="p-4 text-sm">
              <span className="font-medium">Distance maximale : </span>
              {settings.maxDistanceKm != null ? `${settings.maxDistanceKm} km (aller simple)` : "pas de limite"}
            </li>
            <li className="p-4 text-sm">
              <span className="font-medium">Sans réponse aux disponibilités : </span>
              {settings.requireAvailability ? "exclu après la date limite" : "reste proposé avec une mention"}
            </li>
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Autres règles du système</h2>
        <ul className="card divide-y divide-[var(--border)]">
          {SYSTEM_RULES.filter((r) => r.id !== "distance-max").map((rule) => (
            <li key={rule.id} className="p-4">
              <p className="font-medium text-sm">{rule.label}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{rule.description}</p>
              {rule.href && isAdmin && (
                <Link href={rule.href} className="text-xs text-[var(--accent)] hover:underline">
                  {rule.hrefLabel ?? "Configurer"}
                </Link>
              )}
            </li>
          ))}
        </ul>
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
