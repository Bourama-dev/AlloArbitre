import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { findMatches, listCompetitionLevels } from "@/lib/matches";
import { autoDesignateMatches } from "@/lib/suggestions";
import { getCurrentUser } from "@/lib/current-user";
import { MatchesTable } from "@/components/matches-table";

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
  searchParams: Promise<{ level?: string; error?: string; assigned?: string; errors?: string }>;
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
            Tous les matchs à venir nécessitant encore une désignation, toutes
            semaines confondues - avec l&apos;auto-désignation en lot
            ci-dessous. Pour naviguer semaine par semaine tous statuts, voir{" "}
            <Link href="/matchs" className="underline">
              Matchs
            </Link>
            .
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

      {params.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {decodeURIComponent(params.error)}
        </p>
      )}
      {params.assigned !== undefined && (
        <div className="text-sm rounded border border-green-200 bg-green-50 text-green-800 px-3 py-2 space-y-1">
          <p>{params.assigned} désignation(s) créée(s) automatiquement.</p>
          {params.errors && <p className="text-red-700">{params.errors}</p>}
        </div>
      )}

      <form action={autoDesignate} className="space-y-3">
        {matches.length > 0 && (
          <button
            type="submit"
            className="rounded bg-neutral-900 text-white text-sm px-4 py-1.5 hover:bg-neutral-800"
          >
            Auto-désignation des matchs sélectionnés
          </button>
        )}
        <MatchesTable matches={matches} selectable />
      </form>
    </div>
  );
}
