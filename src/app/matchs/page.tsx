import Link from "next/link";
import { findMatches, listCompetitionLevels } from "@/lib/matches";
import { addWeeks, weekRange, formatDateFr } from "@/lib/dates";
import { MatchesTable } from "@/components/matches-table";
import type { MatchStatus } from "@/lib/matches";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{
    week?: string;
    level?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const weekOffset = Number.parseInt(params.week ?? "0", 10) || 0;
  const referenceDate = addWeeks(new Date(), weekOffset);
  const { start, end } = weekRange(referenceDate);

  const status = (params.status as MatchStatus | "toutes" | undefined) ?? "toutes";
  const competitionLevelId = params.level || undefined;

  const [matches, levels] = await Promise.all([
    findMatches({ from: start, to: end, competitionLevelId, status }),
    listCompetitionLevels(),
  ]);

  const weekEnd = new Date(end);
  weekEnd.setDate(weekEnd.getDate() - 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-semibold">Matchs</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/matchs/nouveau"
            className="px-2 py-1 rounded bg-neutral-900 text-white hover:bg-neutral-800"
          >
            + Nouveau match
          </Link>
          <Link
            href={`/matchs?week=${weekOffset - 1}`}
            className="px-2 py-1 border border-neutral-300 rounded hover:bg-neutral-100"
          >
            ← Semaine préc.
          </Link>
          <span className="text-neutral-600 px-2">
            {formatDateFr(start)} → {formatDateFr(weekEnd)}
          </span>
          <Link
            href={`/matchs?week=${weekOffset + 1}`}
            className="px-2 py-1 border border-neutral-300 rounded hover:bg-neutral-100"
          >
            Semaine suiv. →
          </Link>
          {weekOffset !== 0 && (
            <Link
              href="/matchs"
              className="px-2 py-1 text-blue-600 hover:underline"
            >
              Revenir à cette semaine
            </Link>
          )}
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 bg-white border border-neutral-200 rounded-lg p-4">
        <input type="hidden" name="week" value={weekOffset} />
        <div>
          <label className="block text-xs text-neutral-500 mb-1">
            Niveau de compétition
          </label>
          <select
            name="level"
            defaultValue={competitionLevelId ?? ""}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
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
          <label className="block text-xs text-neutral-500 mb-1">Statut</label>
          <select
            name="status"
            defaultValue={status}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="toutes">Tous les statuts</option>
            <option value="incomplet">Incomplet</option>
            <option value="complet">Complet</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded bg-neutral-900 text-white text-sm px-4 py-1.5 hover:bg-neutral-800"
        >
          Filtrer
        </button>
      </form>

      <MatchesTable matches={matches} />
    </div>
  );
}
