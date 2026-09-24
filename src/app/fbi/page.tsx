import { findMatches, listActiveReferees } from "@/lib/matches";
import { matchStatus } from "@/lib/match-status";
import type { MatchSort, MatchStatus } from "@/lib/matches";
import { PushAllToFbiButton, ImportFbiMatchesButton } from "@/components/push-all-to-fbi-button";
import { FbiMatchesPanel } from "@/components/fbi-matches-panel";
import { getCurrentUser } from "@/lib/current-user";
import { designateReferee } from "@/lib/suggestions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_DAYS = 31;
const DEFAULT_DAYS = 14;

/** Regroupements de divisions (par code de compétition, identique au label CompetitionLevel). */
const GROUPES: Record<string, { label: string; match: (code: string) => boolean }> = {
  departemental: {
    label: "Départemental (DM2-DM4, PRF, PRM)",
    match: (c) => ["DM2", "DM3", "DM4", "PRF", "PRM"].includes(c),
  },
  "region-jeunes": {
    label: "Région jeunes (RFU/RMU 13 à 18)",
    match: (c) => /^R[FM]U(13|15|18)$/.test(c),
  },
};

/** Date du jour à Paris au format YYYY-MM-DD (valeur des <input type="date">). */
function todayParis(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

function parseIsoDay(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function FbiPage({
  searchParams,
}: {
  searchParams: Promise<{ du?: string; au?: string; groupe?: string; code?: string; etat?: string; search?: string }>;
}) {
  const params = await searchParams;

  let du = parseIsoDay(params.du) ?? parseIsoDay(todayParis())!;
  let au = parseIsoDay(params.au) ?? new Date(du.getTime() + (DEFAULT_DAYS - 1) * 86_400_000);
  if (au < du) [du, au] = [au, du];
  const maxAu = new Date(du.getTime() + (MAX_DAYS - 1) * 86_400_000);
  const clamped = au > maxAu;
  if (clamped) au = maxAu;
  const auExclusive = new Date(au.getTime() + 86_400_000);

  const groupe = params.groupe && GROUPES[params.groupe] ? params.groupe : "";
  const code = params.code || "";
  const status = (params.etat as MatchStatus | "toutes" | undefined) ?? "toutes";
  const search = (params.search || "").trim();

  const [referees, matchesRaw] = await Promise.all([
    listActiveReferees(),
    findMatches({ from: du, to: auExclusive, status: "toutes", search: search || undefined, sort: "date_asc" as MatchSort }),
  ]);

  const inGroupe = (label: string) => !groupe || GROUPES[groupe].match(label);
  const codes = Array.from(new Set(matchesRaw.map((m) => m.competitionLevel.label).filter(inGroupe))).sort();

  const filtered = matchesRaw.filter(
    (m) =>
      inGroupe(m.competitionLevel.label) &&
      (!code || m.competitionLevel.label === code) &&
      (status === "toutes" || matchStatus(m) === status)
  );

  const counts = {
    complet: filtered.filter((m) => matchStatus(m) === "complet").length,
    incomplet: filtered.filter((m) => matchStatus(m) === "incomplet").length,
    annule: filtered.filter((m) => matchStatus(m) === "annule").length,
  };

  const byDayMap = new Map<string, typeof filtered>();
  for (const m of filtered) {
    // Heure du gymnase stockée sans fuseau : regroupement en UTC (cf. formatDateTimeFr).
    const key = m.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    byDayMap.set(key, [...(byDayMap.get(key) ?? []), m]);
  }
  const byDay = Array.from(byDayMap.entries());

  async function designate(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const matchId = String(formData.get("matchId"));
    const refereeId = String(formData.get("refereeId"));
    const result = await designateReferee(matchId, refereeId, user.id);
    revalidatePath("/fbi");
    revalidatePath(`/matchs/${matchId}`);
    if (!result.ok) {
      redirect(`/fbi?error=${encodeURIComponent(result.error)}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Rencontres</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Matchs AlloArbitre sur la période, avec l&apos;état de la désignation FBI en un clic sur une ligne.
            Période limitée à {MAX_DAYS} jours.
          </p>
        </div>
        <form className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 items-end card p-3 w-full lg:w-auto">
          <div>
            <label className="field-label">Du</label>
            <input type="date" name="du" defaultValue={toIsoDay(du)} className="input w-full" />
          </div>
          <div>
            <label className="field-label">Au</label>
            <input type="date" name="au" defaultValue={toIsoDay(au)} className="input w-full" />
          </div>
          <div>
            <label className="field-label">Groupe</label>
            <select name="groupe" defaultValue={groupe} className="input w-full">
              <option value="">Tous</option>
              {Object.entries(GROUPES).map(([key, g]) => (
                <option key={key} value={key}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Division</label>
            <select name="code" defaultValue={code} className="input w-full">
              <option value="">Toutes</option>
              {codes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Statut</label>
            <select name="etat" defaultValue={status} className="input w-full">
              <option value="toutes">Tous</option>
              <option value="incomplet">Incomplet</option>
              <option value="complet">Complet</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="field-label">Équipe</label>
            <input type="text" name="search" defaultValue={search} placeholder="Domicile ou extérieur" className="input w-full" />
          </div>
          <button type="submit" className="btn btn-secondary w-full sm:w-auto">
            Afficher
          </button>
        </form>
      </div>

      <section className="space-y-2">
        <div>
          <h2 className="text-sm font-semibold">Calendrier AlloArbitre</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Importé automatiquement chaque matin depuis FBI (cron). En cas de besoin immédiat (nouvelle rencontre FBI pas
            encore reprise ici), relancez l&apos;import maintenant.
          </p>
        </div>
        <ImportFbiMatchesButton />
      </section>

      <section className="space-y-2">
        <div>
          <h2 className="text-sm font-semibold">Envoi vers FBI</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Pousse toutes les désignations AlloArbitre à venir vers FBI en une fois. Ne touche jamais une position déjà
            occupée sur FBI par quelqu&apos;un d&apos;autre.
          </p>
        </div>
        <PushAllToFbiButton />
      </section>

      {clamped && (
        <p className="text-xs text-[var(--warning)]">
          Période ramenée à {MAX_DAYS} jours (jusqu&apos;au {au.toLocaleDateString("fr-FR", { timeZone: "UTC" })}).
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-10 text-center card">Aucun match ne correspond à ces filtres.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">
              {filtered.length} match{filtered.length > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="badge text-[var(--success)] bg-[var(--success-bg)]">Complet</span>
              <span className="text-[var(--muted)]">{counts.complet}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="badge text-[var(--warning)] bg-[var(--warning-bg)]">Incomplet</span>
              <span className="text-[var(--muted)]">{counts.incomplet}</span>
            </span>
            {counts.annule > 0 && (
              <span className="inline-flex items-center gap-1">
                <span className="badge text-[var(--muted)] bg-[var(--neutral-bg)]">Annulé</span>
                <span className="text-[var(--muted)]">{counts.annule}</span>
              </span>
            )}
          </div>

          <FbiMatchesPanel byDay={byDay} referees={referees} designateAction={designate} />
        </>
      )}
    </div>
  );
}
