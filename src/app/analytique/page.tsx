import Link from "next/link";
import { computeSeasonStats, currentSeasonStartYear, parseSeason } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function AnalytiquePage({ searchParams }: { searchParams: Promise<{ saison?: string }> }) {
  const params = await searchParams;
  const season = parseSeason(params.saison);
  const stats = await computeSeasonStats(season);
  const active = stats.referees.filter((r) => r.total > 0);
  const coverage = stats.totals.matches ? Math.round(stats.totals.complete / stats.totals.matches * 100) : 0;
  const avg = active.length ? stats.totals.designations / active.length : 0;
  const current = currentSeasonStartYear();
  const seasons = [current, current - 1, current - 2].filter((y) => y >= 2024);
  const maxRef = Math.max(1, ...stats.referees.map((r) => r.total));
  const divisions = Object.entries(stats.referees.reduce<Record<string, number>>((acc, r) => {
    for (const [division, count] of Object.entries(r.byDivision)) acc[division] = (acc[division] ?? 0) + count;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxDivision = Math.max(1, ...divisions.map(([, n]) => n));
  const clubs = stats.clubs.slice().sort((a, b) => {
    const ra = a.homeMatches ? a.complete / a.homeMatches : 0;
    const rb = b.homeMatches ? b.complete / b.homeMatches : 0;
    return ra - rb;
  }).slice(0, 6);
  const euros = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <style>{`
        .an-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-card)}
        .an-label{font-size:11px;font-weight:650;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
        .an-value{font-size:27px;font-weight:750;letter-spacing:-.04em;line-height:1.15}
        .an-bar{height:9px;border-radius:99px;background:var(--neutral-bg);overflow:hidden}
        .an-bar>span{display:block;height:100%;border-radius:99px;background:var(--brand)}
        .an-dot{width:8px;height:8px;border-radius:50%;display:inline-block;background:var(--brand)}
        .an-row{display:grid;grid-template-columns:minmax(90px,1fr) 2fr 38px;align-items:center;gap:12px}
        @media(max-width:640px){.an-value{font-size:23px}.an-row{grid-template-columns:90px 1fr 30px;gap:8px}}
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-2"><span>CD45</span><span>·</span><span>Tableau de pilotage</span></div>
          <h1 className="text-2xl font-bold tracking-tight">Analytique</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Une lecture globale de l’activité arbitrale et de la couverture des rencontres.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/api/statistiques?saison=${season.startYear}`} className="btn btn-secondary">↓ Exporter Excel</Link>
          <Link href={`/statistiques?saison=${season.startYear}`} className="btn btn-secondary">Rapport détaillé ↗</Link>
        </div>
      </div>

      <div className="an-card p-3 flex flex-wrap items-center gap-2">
        <span className="an-label mr-2">Saison</span>
        {seasons.map((y) => <Link key={y} href={`/analytique?saison=${y}`} className={y === season.startYear ? "btn btn-primary text-xs" : "btn btn-secondary text-xs"}>{y}-{y + 1}</Link>)}
        <span className="ml-auto text-xs text-[var(--muted)]">Données CD45 · Saison {season.label}</span>
      </div>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="an-card p-4"><div className="an-label">Rencontres</div><div className="an-value mt-2">{stats.totals.matches.toLocaleString("fr-FR")}</div><div className="text-xs text-[var(--muted)] mt-2">Matchs pris en compte</div></div>
        <div className="an-card p-4"><div className="an-label">Taux de couverture</div><div className="an-value mt-2">{coverage}<span className="text-base ml-1">%</span></div><div className="an-bar mt-3"><span style={{width:`${coverage}%`}} /></div></div>
        <div className="an-card p-4"><div className="an-label">Désignations</div><div className="an-value mt-2">{stats.totals.designations.toLocaleString("fr-FR")}</div><div className="text-xs text-[var(--muted)] mt-2">{avg.toFixed(1).replace(".", ",")} par arbitre actif</div></div>
        <div className="an-card p-4"><div className="an-label">Arbitres mobilisés</div><div className="an-value mt-2">{active.length}</div><div className="text-xs text-[var(--muted)] mt-2">Avec au moins une désignation</div></div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="an-card p-5 xl:col-span-3">
          <div className="flex items-start justify-between gap-3 mb-5"><div><h2 className="font-semibold">Répartition des désignations</h2><p className="text-xs text-[var(--muted)] mt-1">Volume par niveau de compétition</p></div><span className="text-xs text-[var(--muted)]">Top 6 divisions</span></div>
          <div className="space-y-4">
            {divisions.map(([name, count]) => <div key={name} className="an-row"><span className="text-xs font-medium truncate" title={name}>{name}</span><div className="an-bar"><span style={{width:`${count / maxDivision * 100}%`}} /></div><span className="text-xs text-right font-semibold tabular-nums">{count}</span></div>)}
            {!divisions.length && <p className="text-sm text-[var(--muted)]">Aucune désignation sur cette saison.</p>}
          </div>
        </div>
        <div className="an-card p-5 xl:col-span-2">
          <h2 className="font-semibold">Indicateurs de service</h2><p className="text-xs text-[var(--muted)] mt-1 mb-5">Mobilité et indemnités estimées</p>
          <div className="space-y-5">
            <div><div className="an-label">Distance aller-retour</div><div className="text-2xl font-bold mt-1">{Math.round(stats.totals.km).toLocaleString("fr-FR")} <span className="text-sm font-medium text-[var(--muted)]">km</span></div></div>
            <div className="h-px bg-[var(--border)]" />
            <div><div className="an-label">Indemnités estimées</div><div className="text-2xl font-bold mt-1">{euros(stats.totals.estimatedPayment)}</div><p className="text-xs text-[var(--muted)] mt-1">Estimation selon les distances connues</p></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="an-card p-5">
          <div className="flex justify-between items-center mb-4"><div><h2 className="font-semibold">Arbitres les plus sollicités</h2><p className="text-xs text-[var(--muted)] mt-1">Classement par nombre de matchs</p></div><Link href={`/statistiques?saison=${season.startYear}`} className="text-xs text-[var(--accent)] hover:underline">Tout voir ↗</Link></div>
          <div className="space-y-4">
            {stats.referees.filter(r => r.total > 0).slice(0, 7).map((r, i) => <div key={r.id} className="flex items-center gap-3"><span className="text-xs text-[var(--muted)] w-4">{i + 1}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-xs mb-1"><Link href={`/arbitres/${r.id}`} className="font-medium truncate hover:text-[var(--accent)]">{r.name}</Link><span className="font-semibold tabular-nums">{r.total}</span></div><div className="an-bar"><span style={{width:`${r.total / maxRef * 100}%`}} /></div></div></div>)}
            {!active.length && <p className="text-sm text-[var(--muted)]">Aucune activité enregistrée.</p>}
          </div>
        </div>
        <div className="an-card p-5">
          <div className="mb-4"><h2 className="font-semibold">Clubs à accompagner</h2><p className="text-xs text-[var(--muted)] mt-1">Les taux de couverture les plus faibles</p></div>
          <div className="space-y-3">
            {clubs.map(c => { const rate = c.homeMatches ? Math.round(c.complete / c.homeMatches * 100) : 0; return <div key={c.club} className="border-b border-[var(--border)] pb-3 last:border-0"><div className="flex justify-between items-center gap-2 mb-2"><span className="text-xs font-semibold truncate">{c.club}</span><span className={rate < 70 ? "text-xs font-semibold text-[var(--danger)]" : "text-xs font-semibold"}>{rate}%</span></div><div className="an-bar"><span style={{width:`${rate}%`,background:rate < 70 ? "var(--danger)" : "var(--success)"}} /></div><p className="text-[11px] text-[var(--muted)] mt-1">{c.complete}/{c.homeMatches} rencontres complètes · {c.none} sans arbitre</p></div>})}
            {!clubs.length && <p className="text-sm text-[var(--muted)]">Aucune donnée club disponible.</p>}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
        <span>Les indicateurs sont calculés à partir des matchs et désignations enregistrés dans AlloArbitre.</span>
        <Link href={`/statistiques?saison=${season.startYear}`} className="hover:text-[var(--accent)]">Consulter le bilan complet →</Link>
      </div>
    </div>
  );
}
