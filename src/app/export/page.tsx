import type { Metadata } from "next";
import Link from "next/link";
import { findMatches, type MatchWithRelations } from "@/lib/matches";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

const MAX_DAYS = 31;

/** Divisions désignées par le CD45 : jeunes régionaux CVL + pré-régionale. */
const isCd45Level = (label: string) => /^R[FM]U\d+$/.test(label) || label === "PRF" || label === "PRM";

type Params = { du?: string; au?: string; niv?: string | string[]; f?: string; vides?: string };

function todayParis(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

function parseIsoDay(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const toIsoDay = (d: Date) => d.toISOString().slice(0, 10);
const DAY_MS = 86_400_000;

/** Période demandée, par défaut le prochain week-end (samedi-dimanche, ou celui en cours). */
function resolvePeriod(params: Params) {
  const today = parseIsoDay(todayParis())!;
  const dow = today.getUTCDay(); // 0 = dimanche, 6 = samedi
  const nextSaturday = new Date(today.getTime() + (dow === 0 ? -1 : 6 - dow) * DAY_MS);
  let du = parseIsoDay(params.du) ?? nextSaturday;
  let au = parseIsoDay(params.au) ?? new Date(du.getTime() + DAY_MS);
  if (au < du) [du, au] = [au, du];
  const maxAu = new Date(du.getTime() + (MAX_DAYS - 1) * DAY_MS);
  if (au > maxAu) au = maxAu;
  return { du, au };
}

const fmtDay = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString("fr-FR", { ...opts, timeZone: "UTC" });

function periodLabel(du: Date, au: Date): string {
  if (toIsoDay(du) === toIsoDay(au)) return fmtDay(du, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const sameMonth = du.getUTCMonth() === au.getUTCMonth() && du.getUTCFullYear() === au.getUTCFullYear();
  return sameMonth
    ? `${fmtDay(du, { weekday: "long", day: "numeric" })} et ${fmtDay(au, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
    : `${fmtDay(du, { day: "numeric", month: "long" })} au ${fmtDay(au, { day: "numeric", month: "long", year: "numeric" })}`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const { du } = resolvePeriod(await searchParams);
  // Titre = nom du fichier proposé à l'enregistrement en PDF.
  return { title: `Désignations CD45 - ${fmtDay(du, { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-")}` };
}

function levelClass(label: string) {
  if (/^R[FM]U\d+$/.test(label)) return "rx-div rx-jeunes";
  if (label === "PRF" || label === "PRM") return "rx-div rx-dep";
  return "rx-div";
}

function matchTime(m: MatchWithRelations) {
  // Heure du gymnase stockée sans fuseau (lue en UTC) ; 00:00 = heure non renseignée sur FBI.
  const hh = m.date.getUTCHours();
  const mm = m.date.getUTCMinutes();
  return hh === 0 && mm === 0 ? null : `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default async function ExportPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { du, au } = resolvePeriod(params);
  const auExclusive = new Date(au.getTime() + DAY_MS);

  const all = (await findMatches({ from: du, to: auExclusive, sort: "date_asc" })).filter((m) => !m.cancelled);
  const levelsInPeriod = Array.from(new Set(all.map((m) => m.competitionLevel.label))).sort((a, b) => {
    // Jeunes CVL, puis PRF/PRM, puis le reste, chacun par ordre alphabétique.
    const rank = (l: string) => (/^R[FM]U\d+$/.test(l) ? 0 : l === "PRF" || l === "PRM" ? 1 : 2);
    return rank(a) - rank(b) || a.localeCompare(b);
  });

  // Formulaire jamais envoyé : sélection par défaut = divisions CD45.
  const submitted = params.f === "1";
  const requested = params.niv === undefined ? [] : Array.isArray(params.niv) ? params.niv : [params.niv];
  const selected = new Set(submitted ? requested : levelsInPeriod.filter(isCd45Level));
  const includeEmpty = submitted ? params.vides === "1" : true;

  const matches = all.filter(
    (m) => selected.has(m.competitionLevel.label) && (includeEmpty || m.designations.length > 0)
  );
  const positions = Math.max(2, ...matches.map((m) => m.refereesRequired));

  const byDay = new Map<string, MatchWithRelations[]>();
  for (const m of matches) {
    const key = fmtDay(m.date, { weekday: "long", day: "numeric", month: "long" });
    byDay.set(key, [...(byDay.get(key) ?? []), m]);
  }

  const countFilled = (list: MatchWithRelations[]) =>
    list.reduce((n, m) => n + Math.min(m.designations.length, m.refereesRequired), 0);
  const countRequired = (list: MatchWithRelations[]) => list.reduce((n, m) => n + m.refereesRequired, 0);

  const presetHref = (levels: string[]) => {
    const q = new URLSearchParams({ du: toIsoDay(du), au: toIsoDay(au), f: "1" });
    if (includeEmpty) q.set("vides", "1");
    for (const l of levels) q.append("niv", l);
    return `/export?${q.toString()}`;
  };

  const generatedAt = new Date().toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      <style>{RECAP_CSS}</style>

      <div className="rx-no-print space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Export des désignations</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Tableau récapitulatif à imprimer ou enregistrer en PDF. Choisissez la période et les divisions.
            </p>
          </div>
          <PrintButton />
        </div>

        <form className="card p-3 space-y-3">
          <input type="hidden" name="f" value="1" />
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="field-label">Du</label>
              <input type="date" name="du" defaultValue={toIsoDay(du)} className="input" />
            </div>
            <div>
              <label className="field-label">Au</label>
              <input type="date" name="au" defaultValue={toIsoDay(au)} className="input" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm pb-2">
              <input type="checkbox" name="vides" value="1" defaultChecked={includeEmpty} />
              Inclure les matchs sans arbitre
            </label>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="field-label">Divisions</span>
              <Link href={presetHref(levelsInPeriod.filter(isCd45Level))} className="btn-ghost text-xs">
                CD45 (jeunes CVL + PRF/PRM)
              </Link>
              <Link href={presetHref(levelsInPeriod)} className="btn-ghost text-xs">
                Tout
              </Link>
              <Link href={presetHref([])} className="btn-ghost text-xs">
                Aucune
              </Link>
            </div>
            {levelsInPeriod.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Aucun match sur cette période.</p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {levelsInPeriod.map((l) => (
                  <label key={l} className="inline-flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="niv" value={l} defaultChecked={selected.has(l)} />
                    {l}
                    <span className="text-xs text-[var(--muted)]">
                      ({all.filter((m) => m.competitionLevel.label === l).length})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-secondary">
            Générer le tableau
          </button>
        </form>
      </div>

      <section className="rx-sheet">
        <header className="rx-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cd45-logo.png" alt="Loiret Basketball 45 - Comité départemental FFBB" width={119} height={176} />
          <div>
            <h2 className="rx-title">Désignations des arbitres</h2>
            <p className="rx-sub">{periodLabel(du, au)}</p>
          </div>
        </header>

        <div className="rx-kpis">
          <div className="rx-kpi">
            <b>{matches.length}</b>
            <span>rencontres</span>
          </div>
          <div className="rx-kpi">
            <b>{countFilled(matches)}</b>
            <span>arbitres désignés</span>
          </div>
          <div className="rx-kpi rx-warn">
            <b>{countRequired(matches) - countFilled(matches)}</b>
            <span>postes à pourvoir</span>
          </div>
        </div>

        {matches.length === 0 ? (
          <p className="rx-empty">Aucune rencontre pour ces divisions sur cette période.</p>
        ) : (
          Array.from(byDay.entries()).map(([day, list]) => (
            <div key={day}>
              <h3 className="rx-day">
                <span className="rx-dayname">{day}</span>
                <small>
                  {list.length} rencontre{list.length > 1 ? "s" : ""} · {countFilled(list)} désigné
                  {countFilled(list) > 1 ? "s" : ""} · {countRequired(list) - countFilled(list)} à pourvoir
                </small>
              </h3>
              <div className="rx-scroll">
                <table className="rx-table">
                  <thead>
                    <tr>
                      <th>Heure</th>
                      <th>Division</th>
                      <th>Rencontre</th>
                      <th>Salle</th>
                      {Array.from({ length: positions }, (_, i) => (
                        <th key={i}>Arbitre {i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((m) => {
                      const time = matchTime(m);
                      const complete = m.designations.length >= m.refereesRequired;
                      return (
                        <tr key={m.id} className={complete ? undefined : "rx-incomplet"}>
                          <td className="rx-h">{time ?? <span className="rx-tbc">à confirmer</span>}</td>
                          <td>
                            <span className={levelClass(m.competitionLevel.label)}>{m.competitionLevel.label}</span>
                            {m.poule && <span className="rx-poule">Poule {m.poule}</span>}
                          </td>
                          <td className="rx-match">
                            <span className="rx-dom">{m.homeTeam}</span>
                            <span className="rx-vs">reçoit</span>
                            <span>{m.awayTeam}</span>
                          </td>
                          <td>
                            <span>{m.venue ?? "-"}</span>
                            {m.city && <span className="rx-ville">{m.city}</span>}
                          </td>
                          {Array.from({ length: positions }, (_, i) => {
                            const d = m.designations.find((x) => x.position === i + 1);
                            if (d) {
                              return (
                                <td key={i} className="rx-ref">
                                  {d.referee.firstName} {d.referee.lastName}
                                </td>
                              );
                            }
                            return (
                              <td key={i}>{i < m.refereesRequired ? <span className="rx-vac">À pourvoir</span> : null}</td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        <div className="rx-legend">
          <span>
            <i className="rx-jeunes" />
            Jeunes régionaux (CVL)
          </span>
          <span>
            <i className="rx-dep" />
            Pré-régionale (PRF / PRM)
          </span>
          <span>
            <i className="rx-autre" />
            Autres divisions
          </span>
          <span>
            <i className="rx-inc" />
            Rencontre incomplète
          </span>
        </div>
        <footer className="rx-foot">
          Source : AlloArbitre, état au {generatedAt}. Horaire « à confirmer » : heure non renseignée sur FBI. Les
          désignations peuvent encore évoluer ; FBI fait foi.
        </footer>
      </section>
    </div>
  );
}

// Feuille "papier" : couleurs fixes (identiques en thème sombre et à
// l'impression), indépendantes du thème du site.
const RECAP_CSS = `
.rx-sheet{--navy:#1d2f55;--orange:#ef7d00;--ink:#1f2328;--mut:#667085;--line:#e4e7ec;--soft:#f6f7f9;--warn:#b54708;--warnbg:#fff4e5;
  background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:20px;font-size:13px;line-height:1.35}
.rx-head{display:flex;align-items:center;gap:18px;border-bottom:4px solid var(--orange);padding-bottom:14px}
.rx-head img{height:88px;width:auto}
.rx-title{margin:0;font-size:22px;font-weight:700;color:var(--navy)}
.rx-sub{margin:4px 0 0;color:var(--mut);font-size:14px}
.rx-sub::first-letter{text-transform:uppercase}
.rx-kpis{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 4px}
.rx-kpi{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:8px 14px}
.rx-kpi b{display:block;font-size:20px;color:var(--navy)}
.rx-kpi span{color:var(--mut);font-size:12px}
.rx-kpi.rx-warn b{color:var(--warn)}
.rx-day{margin:22px 0 8px;font-size:16px;font-weight:700;color:#fff;background:var(--navy);padding:8px 12px;border-radius:6px;display:flex;flex-wrap:wrap;gap:6px;justify-content:space-between;align-items:center}
.rx-dayname::first-letter{text-transform:uppercase}
.rx-day small{font-weight:400;font-size:12px;opacity:.85}
.rx-scroll{overflow-x:auto}
.rx-table{width:100%;border-collapse:collapse;min-width:880px}
.rx-table th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--mut);border-bottom:2px solid var(--line);padding:6px 8px}
.rx-table td{border-bottom:1px solid var(--line);padding:7px 8px;vertical-align:top}
.rx-table tbody tr:nth-child(even) td{background:#fbfbfc}
.rx-table tr.rx-incomplet td{background:var(--warnbg)}
.rx-table td span{display:block}
.rx-h{font-weight:700;color:var(--navy);white-space:nowrap}
.rx-tbc{font-weight:400;font-style:italic;color:var(--warn);font-size:12px}
.rx-table .rx-div{display:inline-block;font-weight:700;font-size:11px;padding:2px 7px;border-radius:4px;color:#fff;background:#667085}
.rx-table .rx-div.rx-jeunes{background:var(--orange)}
.rx-table .rx-div.rx-dep{background:var(--navy)}
.rx-poule{color:var(--mut);font-size:11px;margin-top:3px}
.rx-dom{font-weight:600}
.rx-vs{color:var(--mut);font-size:10px;text-transform:uppercase;letter-spacing:.05em}
.rx-ville{color:var(--mut);font-size:12px}
.rx-ref{font-weight:600}
.rx-vac{color:var(--warn);font-weight:600;font-style:italic}
.rx-empty{color:var(--mut);padding:24px 0;text-align:center}
.rx-legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;color:var(--mut);font-size:12px;align-items:center}
.rx-legend i{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:4px}
.rx-legend i.rx-jeunes{background:var(--orange)} .rx-legend i.rx-dep{background:var(--navy)}
.rx-legend i.rx-autre{background:#667085} .rx-legend i.rx-inc{background:var(--warnbg);border:1px solid #f5c98b}
.rx-foot{margin-top:14px;color:var(--mut);font-size:11px;border-top:1px solid var(--line);padding-top:8px}
@media (max-width:600px){.rx-sheet{padding:12px}.rx-head{flex-direction:column;align-items:flex-start}.rx-head img{height:64px}}
@media print{
  @page{size:A4 landscape;margin:10mm}
  body{background:#fff!important}
  body > header,.rx-no-print{display:none!important}
  main{padding:0!important}
  .rx-sheet{border:0;border-radius:0;padding:0}
  .rx-head img{height:64px}
  .rx-sheet *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .rx-table{min-width:0;font-size:11px}
  .rx-scroll{overflow:visible}
  .rx-table tr{break-inside:avoid}
  .rx-day{break-after:avoid}
}
`;
