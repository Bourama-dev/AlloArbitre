import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findMatches, listCompetitionLevels, listMatchCities, listActiveReferees } from "@/lib/matches";
import { designateReferee } from "@/lib/suggestions";
import { getCurrentUser } from "@/lib/current-user";
import { addWeeks, weekRange, formatDayMonthFr } from "@/lib/dates";
import { MatchesTable } from "@/components/matches-table";
import { AlertToast } from "@/components/alert-toast";
import { ConflictConfirm } from "@/components/conflict-confirm";
import { decodeGroups, encodeGroups } from "@/lib/designation-messages";
import { SwipeNav } from "@/components/swipe-nav";
import { CollapsibleFilters } from "@/components/collapsible-filters";
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
    error?: string;
    alerte?: string;
    confirm?: string;
    motifs?: string;
    groupes?: string;
    matchId?: string;
    refereeId?: string;
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

  const [matches, levels, cities, referees] = await Promise.all([
    findMatches({ from: start, to: end, competitionLevelId, status, search, city, sort }),
    listCompetitionLevels(),
    listMatchCities(),
    listActiveReferees(),
  ]);

  async function designate(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const matchId = String(formData.get("matchId"));
    const refereeId = String(formData.get("refereeId"));
    const confirmConflict = formData.get("confirmConflict") === "1";
    const result = await designateReferee(matchId, refereeId, user.id, { confirmConflict, addToGroupIds: formData.getAll("addToGroupIds").map(String) });
    revalidatePath("/matchs");
    revalidatePath("/fbi");
    revalidatePath(`/matchs/${matchId}`);
    if (!result.ok) {
      // Conflit d'horaire : la page demande confirmation au lieu d'afficher un refus.
      if (result.confirmable) {
        redirect(`/matchs?confirm=conflit&matchId=${encodeURIComponent(matchId)}&refereeId=${encodeURIComponent(refereeId)}&motifs=${encodeURIComponent(result.error)}&groupes=${encodeURIComponent(encodeGroups(result.groupsToAdd))}`);
      }
      redirect(`/matchs?error=${encodeURIComponent(result.error)}`);
    }
    if (result.warnings.length) {
      redirect(`/matchs?alerte=${encodeURIComponent("Désigné malgré : " + result.warnings.join(" "))}`);
    }
  }

  const weekEnd = new Date(end);
  weekEnd.setUTCDate(weekEnd.getUTCDate() - 1);

  // Les filtres sont conservés quand on change de semaine.
  const weekHref = (offset: number) => {
    const q = new URLSearchParams();
    if (offset !== 0) q.set("week", String(offset));
    for (const [key, value] of Object.entries({ level: competitionLevelId, search, city, sort: params.sort })) {
      if (value) q.set(key, value);
    }
    if (status !== "toutes") q.set("status", status);
    const qs = q.toString();
    return qs ? `/matchs?${qs}` : "/matchs";
  };
  const activeFilters = [competitionLevelId, search, city, status !== "toutes" ? status : "", params.sort].filter(Boolean).length;

  return (
    <SwipeNav prevHref={weekHref(weekOffset - 1)} nextHref={weekHref(weekOffset + 1)}>
    <div className="space-y-3 lg:space-y-4">
      {params.error && <AlertToast message={decodeURIComponent(params.error)} variant="error" />}
      {params.alerte && <AlertToast message={decodeURIComponent(params.alerte)} variant="warning" />}
      {params.confirm === "conflit" && params.matchId && params.refereeId && (
        <ConflictConfirm
          refereeName={(() => {
            const r = referees.find((x) => x.id === params.refereeId);
            return r ? `${r.firstName} ${r.lastName}` : "cet arbitre";
          })()}
          message={params.motifs ?? ""}
          groups={decodeGroups(params.groupes)}
          fields={{ matchId: params.matchId, refereeId: params.refereeId }}
          action={designate}
        />
      )}

      <div className="week-bar">
        <Link href={weekHref(weekOffset - 1)} className="week-arrow" aria-label="Semaine précédente">
          ‹
        </Link>
        <div className="text-center min-w-0 flex-1 lg:text-left lg:flex-none lg:px-2">
          <h1 className="text-lg lg:text-xl font-bold tracking-tight leading-tight">
            {weekOffset === 0 ? "Cette semaine" : "Matchs"}
          </h1>
          <p className="text-xs text-[var(--muted)] font-medium">
            {formatDayMonthFr(start)} → {formatDayMonthFr(weekEnd)}
          </p>
        </div>
        <Link href={weekHref(weekOffset + 1)} className="week-arrow" aria-label="Semaine suivante">
          ›
        </Link>
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          {weekOffset !== 0 && (
            <Link href="/matchs" className="btn-ghost text-sm">
              Revenir à cette semaine
            </Link>
          )}
          <Link href="/matchs/nouveau" className="btn btn-primary">
            + Nouveau match
          </Link>
        </div>
      </div>

      <p className="hidden lg:block text-xs text-[var(--muted)]">
        Vue par semaine, tous statuts confondus. Pour désigner en lot tous les matchs incomplets à venir (toutes
        semaines), voir{" "}
        <Link href="/fbi" className="text-[var(--accent)] hover:underline">
          FBI
        </Link>
        . Pour le nombre d&apos;arbitres nécessaires par gymnase sur une journée, voir{" "}
        <Link href="/matchs/gymnase" className="text-[var(--accent)] hover:underline">
          Arbitres par gymnase
        </Link>
        .
      </p>

      <CollapsibleFilters activeCount={activeFilters}>
      <form className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end card p-4">
        <input type="hidden" name="week" value={weekOffset} />
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
          <label className="field-label">Niveau de compétition</label>
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
          <label className="field-label">Ville</label>
          <select name="city" defaultValue={city ?? ""} className="input w-full">
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
          <select name="status" defaultValue={status} className="input w-full">
            <option value="toutes">Tous les statuts</option>
            <option value="incomplet">Incomplet</option>
            <option value="complet">Complet</option>
            <option value="annule">Annulé</option>
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
        <button type="submit" className="btn btn-primary w-full sm:w-auto">
          Filtrer
        </button>
      </form>
      </CollapsibleFilters>

      {weekOffset !== 0 && (
        <Link href="/matchs" className="chip-btn lg:hidden" data-on="true">
          ↺ Revenir à cette semaine
        </Link>
      )}

      <MatchesTable matches={matches} referees={referees} designateAction={designate} />

      <Link href="/matchs/nouveau" className="fab" aria-label="Nouveau match">
        <span className="text-xl leading-none">＋</span> Match
      </Link>
    </div>
    </SwipeNav>
  );
}
