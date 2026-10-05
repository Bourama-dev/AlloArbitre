import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/current-user";
import { getMatchById, matchStatus } from "@/lib/matches";
import { getMatchCandidates, designateReferee } from "@/lib/suggestions";
import { distanceKm, estimatePayment } from "@/lib/geocoding";
import { coordKey, roadDistancesTo } from "@/lib/routing";
import { formatDateTimeFr } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
import { AlertToast } from "@/components/alert-toast";
import { SuggestionsList } from "@/components/suggestions-list";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; alerte?: string }>;
}) {
  const { id } = await params;
  const { error, alerte } = await searchParams;

  const match = await getMatchById(id);
  if (!match) notFound();

  const status = matchStatus(match);
  const slotsLeft = match.refereesRequired - match.designations.length;

  const { minLevelLabel, eligible, ineligible } =
    status === "incomplet"
      ? await getMatchCandidates(id)
      : { minLevelLabel: null, eligible: [], ineligible: [] };

  // Distance par la route des arbitres déjà désignés (cache, sinon Google).
  const designatedHomes = match.designations
    .filter((d) => d.referee.lat != null && d.referee.lng != null)
    .map((d) => ({ lat: d.referee.lat!, lng: d.referee.lng! }));
  const roadKm =
    match.lat != null && match.lng != null && designatedHomes.length > 0
      ? await roadDistancesTo({ lat: match.lat, lng: match.lng }, designatedHomes)
      : new Map<string, { km: number; minutes: number }>();

  async function designate(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) return;
    const refereeId = String(formData.get("refereeId"));
    const result = await designateReferee(id, refereeId, user.id);
    revalidatePath(`/matchs/${id}`);
    revalidatePath("/matchs");
    revalidatePath("/fbi");
    if (!result.ok) {
      redirect(`/matchs/${id}?error=${encodeURIComponent(result.error)}`);
    }
    if (result.warnings.length) {
      redirect(`/matchs/${id}?alerte=${encodeURIComponent("Désigné malgré : " + result.warnings.join(" "))}`);
    }
  }

  async function removeDesignation(formData: FormData) {
    "use server";
    const designationId = String(formData.get("designationId"));
    const { error } = await supabaseAdmin.from("Designation").delete().eq("id", designationId);
    if (error) throw error;
    revalidatePath(`/matchs/${id}`);
    revalidatePath("/matchs");
    revalidatePath("/fbi");
  }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-3xl">
      <Link href="/matchs" className="chip-btn">
        ‹ Matchs
      </Link>

      <header className="card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--brand)]">
            {match.competitionLevel.label}
            {match.poule ? ` · Poule ${match.poule}` : ""}
          </span>
          <StatusBadge status={status} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight leading-tight">
          {match.homeTeam}
          <span className="block text-sm font-medium text-[var(--muted)] my-0.5">contre</span>
          {match.awayTeam}
        </h1>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{formatDateTimeFr(match.date)}</p>
          {(match.venue || match.city) && (
            <p className="text-[var(--muted)]">
              {match.venue}
              {match.venue && match.city ? " · " : ""}
              {match.city}
            </p>
          )}
        </div>
        {match.notes && <p className="text-sm text-[var(--muted)] italic">{match.notes}</p>}
        <Link href={`/matchs/${id}/modifier`} className="btn btn-secondary w-full sm:w-auto">
          Modifier le match
        </Link>
      </header>

      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}
      {alerte && <AlertToast message={decodeURIComponent(alerte)} variant="warning" />}

      <section>
        <h2 className="text-sm font-bold mb-2">
          Arbitres désignés ({match.designations.length}/{match.refereesRequired})
        </h2>
        {match.designations.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucun arbitre désigné pour l&apos;instant.</p>
        ) : (
          <ul className="table-shell card-list divide-y divide-[var(--border)]">
            {match.designations.map((d) => {
              // 2e match du jour dans la même salle : pas de frais kilométriques (règle CD45).
              const home =
                d.referee.lat != null && d.referee.lng != null ? { lat: d.referee.lat, lng: d.referee.lng } : null;
              const road = home ? roadKm.get(coordKey(home)) : undefined;
              const oneWayKm = d.sameVenueEarlier
                ? 0
                : road
                  ? road.km
                  : match.lat != null && match.lng != null && home
                    ? distanceKm({ lat: match.lat, lng: match.lng }, home)
                    : null;
              return (
              <li key={d.id} className="px-4 py-3 text-sm flex items-center justify-between gap-2">
                <Link
                  href={`/arbitres/${d.referee.id}`}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <span className="avatar-chip">
                    {d.referee.firstName.charAt(0)}
                    {d.referee.lastName.charAt(0)}
                  </span>
                  <span>
                    {d.referee.firstName} {d.referee.lastName}{" "}
                    <span className="text-[var(--muted)] text-xs">(Arbitre {d.position})</span>
                    {oneWayKm != null && (
                      <span className="text-[var(--muted)] text-xs block">
                        {d.sameVenueEarlier
                          ? `0 km (2e match du jour dans la même salle) · ${estimatePayment(0).toFixed(2)} €`
                          : `${road ? "" : "~"}${oneWayKm.toFixed(1)} km${road ? " (route)" : ""} · ${estimatePayment(oneWayKm).toFixed(2)} €`}
                      </span>
                    )}
                  </span>
                </Link>
                <form action={removeDesignation}>
                  <input type="hidden" name="designationId" value={d.id} />
                  <button type="submit" className="btn-danger text-xs">
                    Retirer
                  </button>
                </form>
              </li>
              );
            })}
          </ul>
        )}
      </section>

      {status === "incomplet" && (
        <section>
          <h2 className="text-sm font-bold mb-2">
            Suggestions ({slotsLeft} désignation{slotsLeft > 1 ? "s" : ""} restante
            {slotsLeft > 1 ? "s" : ""})
          </h2>
          {!minLevelLabel && (
            <p className="text-xs text-[var(--warning)] bg-[var(--warning-bg)] rounded-lg p-2 mb-2">
              Aucun niveau d&apos;arbitre minimum n&apos;est configuré pour «&nbsp;{match.competitionLevel.label}&nbsp;».
              Toutes les suggestions sont affichées sans filtre de niveau. Vous pouvez
              corriger cela dans{" "}
              <Link href="/admin/niveaux" className="underline">
                Admin niveaux
              </Link>
              .
            </p>
          )}
          {minLevelLabel && (
            <p className="text-xs text-[var(--muted)] mb-2">
              Niveau minimum requis : {minLevelLabel}
            </p>
          )}
          <SuggestionsList eligible={eligible} ineligible={ineligible} designateAction={designate} />
        </section>
      )}
    </div>
  );
}
