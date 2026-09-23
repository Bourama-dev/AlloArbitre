import Link from "next/link";
import { findMatches, listCompetitionLevels } from "@/lib/matches";
import type { MatchSort } from "@/lib/matches";
import { AutoDesignatePanel } from "@/components/auto-designate-panel";

export const dynamic = "force-dynamic";

export default async function IncompleteMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{
    level?: string;
    search?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const competitionLevelId = params.level || undefined;
  const search = params.search || undefined;
  const sort = (params.sort as MatchSort | undefined) ?? "date_asc";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [matches, levels] = await Promise.all([
    findMatches({ from: today, status: "incomplet", competitionLevelId, search, sort }),
    listCompetitionLevels(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Matchs incomplets</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Tous les matchs à venir nécessitant encore une désignation, toutes
            semaines confondues - avec l&apos;auto-désignation en lot
            ci-dessous. Pour naviguer semaine par semaine tous statuts, voir{" "}
            <Link href="/matchs" className="text-[var(--accent)] hover:underline">
              Matchs
            </Link>
            .
          </p>
        </div>
        <form className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end card p-3 w-full lg:w-auto">
          <div className="col-span-2 sm:col-span-1">
            <label className="field-label">Équipe</label>
            <input
              type="text"
              name="search"
              defaultValue={search ?? ""}
              placeholder="Domicile ou extérieur"
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Niveau</label>
            <select
              name="level"
              defaultValue={competitionLevelId ?? ""}
              className="input w-full"
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
            <label className="field-label">Trier par</label>
            <select name="sort" defaultValue={sort} className="input w-full">
              <option value="date_asc">Date (croissant)</option>
              <option value="date_desc">Date (décroissant)</option>
              <option value="level">Niveau</option>
              <option value="city">Ville</option>
            </select>
          </div>
          <button type="submit" className="btn btn-secondary w-full sm:w-auto">
            Filtrer
          </button>
        </form>
      </div>

      <AutoDesignatePanel matches={matches} />
    </div>
  );
}
