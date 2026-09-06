import Link from "next/link";
import { findMatches, listCompetitionLevels, listMatchCities } from "@/lib/matches";
import { addWeeks, weekRange, formatDateFr } from "@/lib/dates";
import { MatchesTable } from "@/components/matches-table";
import type { MatchSort, MatchStatus } from "@/lib/matches";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{
    week?: string;
    level?: string;
    status?: string;
    search?: string;
    city?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const weekOffset = Number.parseInt(params.week ?? "0", 10) || 0;
  const referenceDate = addWeeks(new Date(), weekOffset);
  const { start, end } = weekRange(referenceDate);

  const status = (params.status as MatchStatus | "toutes" | undefined) ?? "toutes";
  const competitionLevelId = params.level || undefined;
  const search = params.search || undefined;
  const city = params.city || undefined;
  const sort = (params.sort as MatchSort | undefined) ?? "date_asc";

  const [matches, levels, cities] = await Promise.all([
    findMatches({ from: start, to: end, competitionLevelId, status, search, city, sort }),
    listCompetitionLevels(),
    listMatchCities(),
  ]);

  const weekEnd = new Date(end);
  weekEnd.setDate(weekEnd.getDate() - 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Matchs</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Vue par semaine, tous statuts confondus. Pour désigner en lot tous
            les matchs incomplets à venir (toutes semaines), voir{" "}
            <Link href="/matchs/incomplets" className="text-[var(--accent)] hover:underline">
              Matchs incomplets
            </Link>
            . Pour le nombre d&apos;arbitres nécessaires par gymnase sur une
            journée, voir{" "}
            <Link href="/matchs/gymnase" className="text-[var(--accent)] hover:underline">
              Arbitres par gymnase
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/matchs/nouveau" className="btn btn-primary">
            + Nouveau match
          </Link>
          <Link href={`/matchs?week=${weekOffset - 1}`} className="btn btn-secondary">
            ← Préc.
          </Link>
          <span className="text-[var(--muted)] px-1 font-medium">
            {formatDateFr(start)} → {formatDateFr(weekEnd)}
          </span>
          <Link href={`/matchs?week=${weekOffset + 1}`} className="btn btn-secondary">
            Suiv. →
          </Link>
          {weekOffset !== 0 && (
            <Link href="/matchs" className="btn-ghost text-sm">
              Revenir à cette semaine
            </Link>
          )}
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 card p-4">
        <input type="hidden" name="week" value={weekOffset} />
        <div>
          <label className="field-label">Équipe</label>
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Domicile ou extérieur"
            className="input"
          />
        </div>
        <div>
          <label className="field-label">Niveau de compétition</label>
          <select
            name="level"
            defaultValue={competitionLevelId ?? ""}
            className="input"
          >
            <option value="">Tous les niveaux</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Ville</label>
          <select name="city" defaultValue={city ?? ""} className="input">
            <option value="">Toutes les villes</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Statut</label>
          <select name="status" defaultValue={status} className="input">
            <option value="toutes">Tous les statuts</option>
            <option value="incomplet">Incomplet</option>
            <option value="complet">Complet</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
        <div>
          <label className="field-label">Trier par</label>
          <select name="sort" defaultValue={sort} className="input">
            <option value="date_asc">Date (croissant)</option>
            <option value="date_desc">Date (décroissant)</option>
            <option value="level">Niveau</option>
            <option value="city">Ville</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Filtrer
        </button>
      </form>

      <MatchesTable matches={matches} />
    </div>
  );
}
