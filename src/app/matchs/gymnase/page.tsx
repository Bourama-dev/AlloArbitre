import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { findMatches, computeMinReferees } from "@/lib/matches";
import { formatDateFr } from "@/lib/dates";

export const dynamic = "force-dynamic";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function GymnaseJourneePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const dateStr = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayIso();

  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const matches = await findMatches({ from: dayStart, to: dayEnd, status: "toutes" });
  const activeMatches = matches.filter((m) => !m.cancelled);

  const groups = new Map<string, typeof activeMatches>();
  for (const m of activeMatches) {
    const key = m.venue?.trim() || "Lieu non renseigné";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const sortedVenues = Array.from(groups.keys()).sort();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/matchs" className="text-sm text-[var(--accent)] hover:underline">
          ← Retour aux matchs
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-2">
          Arbitres nécessaires par gymnase
        </h1>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Pour une journée donnée, regroupe les matchs par gymnase et calcule le nombre
          minimum d&apos;arbitres distincts nécessaires (un même arbitre peut couvrir
          plusieurs matchs tant qu&apos;ils ne se chevauchent pas dans le temps - par
          exemple un doublage sur des TQR qui s&apos;enchaînent au même endroit). Chaque
          match exige au moins 2 arbitres.
        </p>
      </div>

      <form className="flex items-end gap-3 card p-4">
        <div>
          <label className="field-label">Date</label>
          <input type="date" name="date" defaultValue={dateStr} className="input" />
        </div>
        <button type="submit" className="btn btn-primary">
          Afficher
        </button>
      </form>

      <p className="text-sm font-medium">{formatDateFr(dayStart)}</p>

      {sortedVenues.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Aucun match ce jour-là.</p>
      ) : (
        <div className="space-y-4">
          {sortedVenues.map((venue) => {
            const venueMatches = groups
              .get(venue)!
              .slice()
              .sort((a, b) => a.date.getTime() - b.date.getTime());
            const minReferees = computeMinReferees(venueMatches);
            const city = venueMatches.find((m) => m.city)?.city;

            return (
              <section key={venue} className="card p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <h2 className="font-semibold text-sm">{venue}</h2>
                    {city && <p className="text-xs text-[var(--muted)]">{city}</p>}
                  </div>
                  <span className="badge text-[var(--accent)] bg-[var(--accent-tint)]">
                    Arbitres minimum : {minReferees}
                  </span>
                </div>
                <ul className="table-shell divide-y divide-[var(--border)]">
                  {venueMatches.map((m) => (
                    <li key={m.id} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                      <Link href={`/matchs/${m.id}`} className="hover:underline flex-1 min-w-0">
                        <span className="text-[var(--muted)] mr-2">
                          {m.date.toISOString().slice(11, 16)}
                        </span>
                        {m.homeTeam} <span className="text-[var(--muted)]">vs</span> {m.awayTeam}
                      </Link>
                      <span className="text-xs text-[var(--muted)] whitespace-nowrap">
                        {m.competitionLevel.label} · {m.refereesRequired} arb.
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
