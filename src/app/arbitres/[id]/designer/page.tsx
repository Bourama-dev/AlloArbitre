import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getRefereeSheet } from "@/lib/referees";
import { findMatches, listCompetitionLevels } from "@/lib/matches";
import type { MatchSort } from "@/lib/matches";
import { MultiDesignatePanel } from "@/components/multi-designate-panel";

export const dynamic = "force-dynamic";

export default async function MultiDesignatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ level?: string; search?: string; sort?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const sheet = await getRefereeSheet(id);
  if (!sheet) notFound();

  const sp = await searchParams;
  const competitionLevelId = sp.level || undefined;
  const search = sp.search || undefined;
  const sort = (sp.sort as MatchSort | undefined) ?? "date_asc";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [matches, levels] = await Promise.all([
    findMatches({ from: today, status: "incomplet", competitionLevelId, search, sort }),
    listCompetitionLevels(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/arbitres/${id}`} className="text-sm text-[var(--accent)] hover:underline">
          ← Retour à la fiche arbitre
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-2">
          Désigner {sheet.referee.firstName} {sheet.referee.lastName} sur plusieurs matchs
        </h1>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Cochez les matchs incomplets à venir, puis désignez cet arbitre en une seule fois.
          Chaque match repasse par les mêmes règles (conflit d&apos;horaire, quota, niveau...) -
          il est ignoré avec une erreur explicite en cas de violation.
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
          <select name="level" defaultValue={competitionLevelId ?? ""} className="input">
            <option value="">Tous les niveaux</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Filtrer
        </button>
      </form>

      <MultiDesignatePanel refereeId={id} matches={matches} />
    </div>
  );
}
