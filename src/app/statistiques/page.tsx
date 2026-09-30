import type { Metadata } from "next";
import Link from "next/link";
import { computeSeasonStats, currentSeasonStartYear, parseSeason } from "@/lib/stats";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = { saison?: string; vue?: string; tout?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const p = await searchParams;
  const s = parseSeason(p.saison);
  // Titre = nom du fichier proposé à l'enregistrement en PDF.
  return { title: `Bilan ${p.vue === "clubs" ? "clubs" : "arbitres"} CD45 ${s.label}` };
}

const euros = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const kms = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} km`;

export default async function StatsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const s = parseSeason(params.saison);
  const view = params.vue === "clubs" ? "clubs" : "arbitres";
  const cd45Only = params.tout !== "1";
  const stats = await computeSeasonStats(s, { cd45Only });

  const current = currentSeasonStartYear();
  const seasons = [current + 1, current, current - 1, current - 2].filter((y) => y >= 2024);
  const href = (q: Partial<Params>) => {
    const u = new URLSearchParams({ saison: String(s.startYear), vue: view, ...(cd45Only ? {} : { tout: "1" }) });
    for (const [k, v] of Object.entries(q)) {
      if (v === undefined) u.delete(k);
      else u.set(k, v);
    }
    return `/statistiques?${u.toString()}`;
  };
  const withMatches = stats.referees.filter((r) => r.total > 0);
  const avg = withMatches.length ? stats.totals.designations / withMatches.length : 0;
  const coverage = stats.totals.matches ? Math.round((stats.totals.complete / stats.totals.matches) * 100) : 0;
  const generatedAt = new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

  return (
    <div className="space-y-4">
      <style>{STATS_CSS}</style>

      <div className="rx-no-print space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Statistiques</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Activité de la saison : volume par arbitre, disponibilités, retraits, kilomètres, et service rendu à
              chaque club. Imprimez ou enregistrez en PDF, ou exportez en Excel.
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`/api/statistiques?saison=${s.startYear}${cd45Only ? "" : "&tout=1"}`} className="btn btn-secondary">
              Export Excel
            </a>
            <PrintButton />
          </div>
        </div>
        <div className="card p-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="field-label">Saison</span>
          {seasons.map((y) => (
            <Link
              key={y}
              href={href({ saison: String(y) })}
              className={y === s.startYear ? "btn btn-primary text-xs" : "btn-ghost text-xs"}
            >
              {y}-{y + 1}
            </Link>
          ))}
          <span className="field-label ml-2">Vue</span>
          <Link href={href({ vue: "arbitres" })} className={view === "arbitres" ? "btn btn-primary text-xs" : "btn-ghost text-xs"}>
            Arbitres
          </Link>
          <Link href={href({ vue: "clubs" })} className={view === "clubs" ? "btn btn-primary text-xs" : "btn-ghost text-xs"}>
            Clubs
          </Link>
          <Link href={href({ tout: cd45Only ? "1" : undefined })} className="btn-ghost text-xs">
            {cd45Only ? "Inclure les divisions non désignées par le CD45" : "Divisions CD45 uniquement"}
          </Link>
        </div>
      </div>

      <section className="rx-sheet">
        <header className="rx-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cd45-logo.png" alt="Loiret Basketball 45 - Comité départemental FFBB" width={119} height={176} />
          <div>
            <h2 className="rx-title">{view === "clubs" ? "Bilan par club" : "Bilan des arbitres"}</h2>
            <p className="rx-sub">
              Saison {s.label}
              {cd45Only ? " · divisions désignées par le CD45" : " · toutes divisions"}
            </p>
          </div>
        </header>

        <div className="rx-kpis">
          <div className="rx-kpi">
            <b>{stats.totals.matches}</b>
            <span>matchs</span>
          </div>
          <div className="rx-kpi">
            <b>{coverage} %</b>
            <span>matchs complets</span>
          </div>
          <div className="rx-kpi">
            <b>{stats.totals.designations}</b>
            <span>désignations</span>
          </div>
          <div className="rx-kpi">
            <b>{withMatches.length}</b>
            <span>arbitres actifs sur la saison</span>
          </div>
          <div className="rx-kpi">
            <b>{avg.toFixed(1)}</b>
            <span>matchs / arbitre</span>
          </div>
          <div className="rx-kpi">
            <b>{kms(stats.totals.km)}</b>
            <span>aller-retour estimés</span>
          </div>
          <div className="rx-kpi">
            <b>{euros(stats.totals.estimatedPayment)}</b>
            <span>indemnités estimées</span>
          </div>
        </div>

        {view === "arbitres" ? (
          <div className="rx-scroll">
            <table className="rx-table">
              <thead>
                <tr>
                  <th>Arbitre</th>
                  <th>Niveau</th>
                  <th>Club</th>
                  <th className="rx-num">Matchs</th>
                  <th className="rx-num">Joués</th>
                  <th className="rx-num">À venir</th>
                  <th>Par division</th>
                  <th className="rx-num">Dispos saisies</th>
                  <th className="rx-num">Retraits</th>
                  <th className="rx-num">Km A/R</th>
                  <th className="rx-num">Indemnités</th>
                </tr>
              </thead>
              <tbody>
                {stats.referees.map((r) => (
                  <tr key={r.id} className={r.total === 0 ? "rx-zero" : undefined}>
                    <td>
                      <Link href={`/arbitres/${r.id}`} className="rx-ref">
                        {r.name}
                      </Link>
                      {!r.active && <span className="rx-mut"> (inactif)</span>}
                    </td>
                    <td>{r.level}</td>
                    <td className="rx-mut">{r.club ?? ""}</td>
                    <td className="rx-num rx-strong">{r.total}</td>
                    <td className="rx-num">{r.played}</td>
                    <td className="rx-num">{r.upcoming}</td>
                    <td className="rx-mut">
                      {Object.entries(r.byDivision)
                        .sort((a, b) => b[1] - a[1])
                        .map(([d, n]) => `${d} ${n}`)
                        .join(" · ")}
                    </td>
                    <td className={`rx-num ${r.periods > 0 && r.responses < r.periods ? "rx-warn" : ""}`}>
                      {r.periods > 0 ? `${r.responses}/${r.periods}` : "-"}
                    </td>
                    <td className="rx-num">{r.removals || ""}</td>
                    <td className="rx-num">{r.km ? Math.round(r.km) : ""}</td>
                    <td className="rx-num">{r.estimatedPayment ? euros(r.estimatedPayment) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rx-scroll">
            <table className="rx-table">
              <thead>
                <tr>
                  <th>Club (matchs à domicile)</th>
                  <th className="rx-num">Matchs</th>
                  <th className="rx-num">Complets</th>
                  <th className="rx-num">Partiels</th>
                  <th className="rx-num">Sans arbitre</th>
                  <th className="rx-num">Couverture</th>
                  <th>Par division (complets / total)</th>
                  <th className="rx-num">Arbitres du club</th>
                  <th className="rx-num">Matchs sifflés par ses arbitres</th>
                </tr>
              </thead>
              <tbody>
                {stats.clubs.map((c) => {
                  const rate = c.homeMatches ? Math.round((c.complete / c.homeMatches) * 100) : 0;
                  return (
                    <tr key={c.club}>
                      <td className="rx-strong">{c.club}</td>
                      <td className="rx-num">{c.homeMatches}</td>
                      <td className="rx-num">{c.complete}</td>
                      <td className="rx-num">{c.partial || ""}</td>
                      <td className={`rx-num ${c.none ? "rx-warn" : ""}`}>{c.none || ""}</td>
                      <td className={`rx-num ${rate < 80 ? "rx-warn" : ""}`}>{rate} %</td>
                      <td className="rx-mut">
                        {Object.entries(c.byDivision)
                          .sort((a, b) => a[0].localeCompare(b[0]))
                          .map(([d, v]) => `${d} ${v.complete}/${v.total}`)
                          .join(" · ")}
                      </td>
                      <td className="rx-num">{c.refereeCount || ""}</td>
                      <td className="rx-num">{c.designationsByItsReferees || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="rx-foot">
          AlloArbitre · édité le {generatedAt} · Km et indemnités estimés (40 € + 0,35 €/km aller-retour ; par la route
          quand la distance est connue, sinon à vol d&apos;oiseau ; 0 km pour un 2e match dans la même salle).
          {view === "arbitres" &&
            " Dispos saisies : réponses aux campagnes de disponibilités de la saison. Retraits : désignations retirées par un répartiteur."}
          {view === "clubs" &&
            " Club déduit du nom de l'équipe recevante ; arbitres du club d'après le club renseigné sur leur fiche."}
        </p>
      </section>
    </div>
  );
}

const STATS_CSS = `
.rx-sheet{--navy:#1d2f55;--orange:#ef7d00;--ink:#1f2328;--mut:#667085;--line:#e4e7ec;--soft:#f6f7f9;--warn:#b54708;
  background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:20px;font-size:13px;line-height:1.35}
.rx-head{display:flex;align-items:center;gap:18px;border-bottom:4px solid var(--orange);padding-bottom:14px}
.rx-head img{height:88px;width:auto}
.rx-title{margin:0;font-size:22px;font-weight:700;color:var(--navy)}
.rx-sub{margin:4px 0 0;color:var(--mut);font-size:14px}
.rx-kpis{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 12px}
.rx-kpi{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:8px 14px}
.rx-kpi b{display:block;font-size:20px;color:var(--navy)}
.rx-kpi span{color:var(--mut);font-size:12px}
.rx-scroll{overflow-x:auto}
.rx-table{width:100%;border-collapse:collapse;min-width:980px}
.rx-table th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--mut);border-bottom:2px solid var(--line);padding:6px 8px}
.rx-table td{border-bottom:1px solid var(--line);padding:6px 8px;vertical-align:top}
.rx-table tbody tr:nth-child(even) td{background:#fbfbfc}
.rx-table .rx-num{text-align:right;white-space:nowrap}
.rx-strong,.rx-ref{font-weight:600;color:var(--navy)}
.rx-mut{color:var(--mut);font-size:12px}
.rx-warn{color:var(--warn);font-weight:600}
.rx-zero td{color:var(--mut)}
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
  .rx-table{min-width:0;font-size:10px}
  .rx-scroll{overflow:visible}
  .rx-table tr{break-inside:avoid}
}
`;
