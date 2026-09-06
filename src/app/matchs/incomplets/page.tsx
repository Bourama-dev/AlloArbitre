import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { findMatches, listCompetitionLevels } from "@/lib/matches";
import type { MatchSort } from "@/lib/matches";
import { autoDesignateMatches } from "@/lib/suggestions";
import { getCurrentUser } from "@/lib/current-user";
import { MatchesTable } from "@/components/matches-table";
import { AlertToast } from "@/components/alert-toast";

export const dynamic = "force-dynamic";

async function autoDesignate(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const matchIds = formData.getAll("matchIds").map(String);
  if (matchIds.length === 0) {
    redirect(`/matchs/incomplets?error=${encodeURIComponent("Sélectionnez au moins un match.")}`);
  }

  const summary = await autoDesignateMatches(matchIds, user.id);

  revalidatePath("/matchs/incomplets");
  revalidatePath("/matchs");

  const params = new URLSearchParams({
    assigned: String(summary.assigned),
    errors: summary.errors.join(" | "),
  });
  redirect(`/matchs/incomplets?${params.toString()}`);
}

export default async function IncompleteMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{
    level?: string;
    search?: string;
    sort?: string;
    error?: string;
    assigned?: string;
    errors?: string;
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
        <form className="flex flex-wrap items-end gap-2">
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
            <label className="field-label">Niveau</label>
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
            <label className="field-label">Trier par</label>
            <select name="sort" defaultValue={sort} className="input">
              <option value="date_asc">Date (croissant)</option>
              <option value="date_desc">Date (décroissant)</option>
              <option value="level">Niveau</option>
              <option value="city">Ville</option>
            </select>
          </div>
          <button type="submit" className="btn btn-secondary">
            Filtrer
          </button>
        </form>
      </div>

      {params.error && <AlertToast message={decodeURIComponent(params.error)} variant="error" />}
      {params.assigned !== undefined && (
        <div className="text-sm rounded-lg bg-[var(--success-bg)] text-[var(--success)] px-3 py-2">
          <p>{params.assigned} désignation(s) créée(s) automatiquement.</p>
        </div>
      )}
      {params.errors && <AlertToast message={params.errors} variant="warning" />}

      <form action={autoDesignate} className="space-y-3">
        {matches.length > 0 && (
          <button type="submit" className="btn btn-primary">
            Auto-désignation des matchs sélectionnés
          </button>
        )}
        <MatchesTable matches={matches} selectable />
      </form>
    </div>
  );
}
