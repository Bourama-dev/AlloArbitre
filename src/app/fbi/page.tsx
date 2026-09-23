import { fetchFbiRencontres } from "@/lib/fbi/fetch";
import type { FbiDesignationRow } from "@/lib/fbi/searchDesignations";

export const dynamic = "force-dynamic";
// Login FBI + recherche : quelques secondes, parfois plus quand FBI est lent.
export const maxDuration = 60;

const MAX_DAYS = 31;
const DEFAULT_DAYS = 14;
const ETATS = ["Complète", "Incomplète", "Non débutée"] as const;

/** Date du jour à Paris au format YYYY-MM-DD (valeur des <input type="date">). */
function todayParis(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

function parseIsoDay(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  // Midi UTC : aucun risque de basculer sur la veille/le lendemain à Paris.
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayLabel(dateFr: string): string {
  const [dd, mm, yyyy] = dateFr.split("/").map(Number);
  const label = new Date(Date.UTC(yyyy, mm - 1, dd)).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const etatStyles: Record<string, string> = {
  "Complète": "text-[var(--success)] bg-[var(--success-bg)]",
  "Incomplète": "text-[var(--warning)] bg-[var(--warning-bg)]",
};

function EtatBadge({ etat }: { etat: string }) {
  return (
    <span className={`badge ${etatStyles[etat] ?? "text-[var(--muted)] bg-[var(--neutral-bg)]"}`}>
      {etat || "-"}
    </span>
  );
}

export default async function FbiPage({
  searchParams,
}: {
  searchParams: Promise<{ du?: string; au?: string; code?: string; etat?: string; search?: string }>;
}) {
  const params = await searchParams;

  let du = parseIsoDay(params.du) ?? parseIsoDay(todayParis())!;
  let au = parseIsoDay(params.au) ?? new Date(du.getTime() + (DEFAULT_DAYS - 1) * 86_400_000);
  if (au < du) [du, au] = [au, du];
  const maxAu = new Date(du.getTime() + (MAX_DAYS - 1) * 86_400_000);
  const clamped = au > maxAu;
  if (clamped) au = maxAu;

  const code = params.code || "";
  const etat = params.etat || "";
  const search = (params.search || "").trim();

  let rows: FbiDesignationRow[] = [];
  let error: string | null = null;
  try {
    rows = await fetchFbiRencontres({ du, au });
  } catch (err) {
    error = err instanceof Error ? err.message : "Erreur inconnue";
  }

  const codes = Array.from(new Set(rows.map((r) => r.code))).sort();
  const needle = search.toUpperCase();
  const filtered = rows.filter(
    (r) =>
      (!code || r.code === code) &&
      (!etat || r.etat === etat) &&
      (!needle || r.equipe1.toUpperCase().includes(needle) || r.equipe2.toUpperCase().includes(needle))
  );

  const counts = Object.fromEntries(ETATS.map((e) => [e, filtered.filter((r) => r.etat === e).length]));

  const byDay = new Map<string, FbiDesignationRow[]>();
  for (const r of filtered) {
    byDay.set(r.date, [...(byDay.get(r.date) ?? []), r]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Rencontres FBI</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Désignations lues en direct sur FBI (FFBB) à chaque affichage - rien
            n&apos;est enregistré dans AlloArbitre. Période limitée à {MAX_DAYS} jours.
          </p>
        </div>
        <form className="flex flex-wrap items-end gap-2">
          <div>
            <label className="field-label">Du</label>
            <input type="date" name="du" defaultValue={toIsoDay(du)} className="input" />
          </div>
          <div>
            <label className="field-label">Au</label>
            <input type="date" name="au" defaultValue={toIsoDay(au)} className="input" />
          </div>
          <div>
            <label className="field-label">Division</label>
            <select name="code" defaultValue={code} className="input">
              <option value="">Toutes</option>
              {codes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">État</label>
            <select name="etat" defaultValue={etat} className="input">
              <option value="">Tous</option>
              {ETATS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Équipe</label>
            <input type="text" name="search" defaultValue={search} placeholder="Domicile ou extérieur" className="input" />
          </div>
          <button type="submit" className="btn btn-secondary">
            Afficher
          </button>
        </form>
      </div>

      {clamped && (
        <p className="text-xs text-[var(--warning)]">
          Période ramenée à {MAX_DAYS} jours (jusqu&apos;au {au.toLocaleDateString("fr-FR", { timeZone: "UTC" })}).
        </p>
      )}

      {error ? (
        <div className="card p-4 text-sm">
          <p className="font-medium text-[var(--danger)]">Impossible de lire FBI</p>
          <p className="text-[var(--muted)] mt-1">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-10 text-center card">
          Aucune rencontre FBI ne correspond à ces filtres.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">
              {filtered.length} rencontre{filtered.length > 1 ? "s" : ""}
            </span>
            {ETATS.map((e) => (
              <span key={e} className="inline-flex items-center gap-1">
                <EtatBadge etat={e} />
                <span className="text-[var(--muted)]">{counts[e]}</span>
              </span>
            ))}
          </div>

          {Array.from(byDay.entries()).map(([date, dayRows]) => (
            <section key={date} className="space-y-2">
              <h2 className="text-sm font-semibold">
                {dayLabel(date)}{" "}
                <span className="font-normal text-[var(--muted)]">({dayRows.length})</span>
              </h2>
              <div className="table-shell overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Heure</th>
                      <th>Division</th>
                      <th>N°</th>
                      <th>Domicile</th>
                      <th>Extérieur</th>
                      <th>Salle</th>
                      <th>État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayRows.map((r) => (
                      <tr key={`${r.code}-${r.poule}-${r.numero}`}>
                        <td className="whitespace-nowrap">
                          {r.heure === "00:00" ? <span className="text-[var(--muted)]">À fixer</span> : r.heure}
                        </td>
                        <td className="whitespace-nowrap text-[var(--muted)]">
                          {r.code}
                          {r.poule ? ` · ${r.poule}` : ""}
                        </td>
                        <td className="text-right text-[var(--muted)]">{r.numero}</td>
                        <td className="font-medium whitespace-nowrap">{r.equipe1}</td>
                        <td className="font-medium whitespace-nowrap">{r.equipe2}</td>
                        <td className="whitespace-nowrap text-[var(--muted)]">
                          {r.salle}
                          {r.ville ? ` - ${r.ville}` : ""}
                        </td>
                        <td>
                          <EtatBadge etat={r.etat} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
