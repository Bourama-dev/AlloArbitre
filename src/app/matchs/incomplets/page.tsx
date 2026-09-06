import { findMatches, listCompetitionLevels } from "@/lib/matches";
import { MatchesTable } from "@/components/matches-table";

export const dynamic = "force-dynamic";

export default async function IncompleteMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const params = await searchParams;
  const competitionLevelId = params.level || undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [matches, levels] = await Promise.all([
    findMatches({ from: today, status: "incomplet", competitionLevelId }),
    listCompetitionLevels(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold">Matchs incomplets</h1>
          <p className="text-sm text-neutral-500">
            Tous les matchs à venir nécessitant encore une désignation.
          </p>
        </div>
        <form className="flex items-end gap-2">
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
          <button
            type="submit"
            className="rounded bg-neutral-900 text-white text-sm px-4 py-1.5 hover:bg-neutral-800"
          >
            Filtrer
          </button>
        </form>
      </div>

      <MatchesTable matches={matches} />
    </div>
  );
}
