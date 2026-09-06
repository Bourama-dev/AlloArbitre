import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/current-user";
import { getMatchById, matchStatus } from "@/lib/matches";
import { suggestReferees, designateReferee } from "@/lib/suggestions";
import { distanceKm, estimatePayment } from "@/lib/geocoding";
import { formatDateTimeFr } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
import { AlertToast } from "@/components/alert-toast";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const match = await getMatchById(id);
  if (!match) notFound();

  const status = matchStatus(match);
  const slotsLeft = match.refereesRequired - match.designations.length;

  const { minLevelLabel, suggestions } =
    status === "incomplet" ? await suggestReferees(id) : { minLevelLabel: null, suggestions: [] };

  async function designate(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) return;
    const refereeId = String(formData.get("refereeId"));
    const result = await designateReferee(id, refereeId, user.id);
    revalidatePath(`/matchs/${id}`);
    revalidatePath("/matchs");
    revalidatePath("/matchs/incomplets");
    if (!result.ok) {
      redirect(`/matchs/${id}?error=${encodeURIComponent(result.error)}`);
    }
  }

  async function removeDesignation(formData: FormData) {
    "use server";
    const designationId = String(formData.get("designationId"));
    const { error } = await supabaseAdmin.from("Designation").delete().eq("id", designationId);
    if (error) throw error;
    revalidatePath(`/matchs/${id}`);
    revalidatePath("/matchs");
    revalidatePath("/matchs/incomplets");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/matchs" className="text-sm text-[var(--accent)] hover:underline">
          ← Retour aux matchs
        </Link>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <h1 className="text-xl font-semibold tracking-tight">
            {match.homeTeam} <span className="text-[var(--muted)] font-normal">vs</span>{" "}
            {match.awayTeam}
          </h1>
          <StatusBadge status={status} />
          <Link href={`/matchs/${id}/modifier`} className="btn-ghost text-sm">
            Modifier
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)] mt-2">
          <span>{match.competitionLevel.label}</span>
          {match.poule && <span>Poule {match.poule}</span>}
          <span>{formatDateTimeFr(match.date)}</span>
          {(match.venue || match.city) && (
            <span>
              {match.venue}
              {match.venue && match.city ? " · " : ""}
              {match.city}
            </span>
          )}
        </div>
        {match.notes && (
          <p className="text-sm text-[var(--muted)] mt-1 italic">{match.notes}</p>
        )}
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-md">
          <div className="card p-3 text-center">
            <p className="field-label mb-1">Domicile</p>
            <p className="font-semibold">{match.homeTeam}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="field-label mb-1">Extérieur</p>
            <p className="font-semibold">{match.awayTeam}</p>
          </div>
        </div>
      </div>

      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}

      <section>
        <h2 className="text-sm font-semibold mb-2">
          Arbitres désignés ({match.designations.length}/{match.refereesRequired})
        </h2>
        {match.designations.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucun arbitre désigné pour l&apos;instant.</p>
        ) : (
          <ul className="table-shell divide-y divide-[var(--border)]">
            {match.designations.map((d) => {
              const oneWayKm =
                match.lat != null && match.lng != null && d.referee.lat != null && d.referee.lng != null
                  ? distanceKm({ lat: match.lat, lng: match.lng }, { lat: d.referee.lat, lng: d.referee.lng })
                  : null;
              return (
              <li key={d.id} className="px-4 py-2.5 text-sm flex items-center justify-between">
                <Link
                  href={`/arbitres/${d.referee.id}`}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <span className="avatar-chip">
                    {d.referee.firstName.charAt(0)}
                    {d.referee.lastName.charAt(0)}
                  </span>
                  <span>
                    {d.referee.firstName} {d.referee.lastName}
                    {oneWayKm != null && (
                      <span className="text-[var(--muted)] text-xs block">
                        {oneWayKm.toFixed(1)} km · {estimatePayment(oneWayKm).toFixed(2)} €
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
          <h2 className="text-sm font-semibold mb-2">
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
          {suggestions.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Aucun arbitre disponible ne correspond aux critères pour ce match.
            </p>
          ) : (
            <ul className="table-shell divide-y divide-[var(--border)]">
              {suggestions.map((s) => (
                <li key={s.id} className="px-4 py-2.5 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="avatar-chip">
                      {s.firstName.charAt(0)}
                      {s.lastName.charAt(0)}
                    </span>
                    <div>
                      <Link href={`/arbitres/${s.id}`} className="hover:underline font-medium">
                        {s.firstName} {s.lastName}
                      </Link>
                      <div className="text-[var(--muted)] text-xs">
                        {s.levelLabel} · {s.zone ?? "zone inconnue"} ·{" "}
                        {s.currentLoad} désignation{s.currentLoad > 1 ? "s" : ""}
                        {s.distanceKm != null && (
                          <>
                            {" "}
                            · {s.distanceKm.toFixed(1)} km ·{" "}
                            {s.estimatedPayment!.toFixed(2)} €
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <form action={designate}>
                    <input type="hidden" name="refereeId" value={s.id} />
                    <SubmitButton pendingLabel="Désignation…">Désigner</SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
