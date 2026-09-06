import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/current-user";
import { getMatchById, matchStatus } from "@/lib/matches";
import { suggestReferees, designateReferee } from "@/lib/suggestions";
import { formatDateTimeFr } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";

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
        <Link href="/matchs" className="text-sm text-blue-600 hover:underline">
          ← Retour aux matchs
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-lg font-semibold">
            {match.homeTeam} - {match.awayTeam}
          </h1>
          <StatusBadge status={status} />
          <Link
            href={`/matchs/${id}/modifier`}
            className="text-xs text-blue-600 hover:underline"
          >
            Modifier
          </Link>
        </div>
        <p className="text-sm text-neutral-500 mt-1">
          {match.competitionLevel.label} · {formatDateTimeFr(match.date)}
          {match.venue ? ` · ${match.venue}` : ""}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {decodeURIComponent(error)}
        </p>
      )}

      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-2">
          Arbitres désignés ({match.designations.length}/{match.refereesRequired})
        </h2>
        {match.designations.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun arbitre désigné pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg bg-white">
            {match.designations.map((d) => (
              <li key={d.id} className="px-3 py-2 text-sm flex items-center justify-between">
                <Link href={`/arbitres/${d.referee.id}`} className="hover:underline">
                  {d.referee.firstName} {d.referee.lastName}
                </Link>
                <form action={removeDesignation}>
                  <input type="hidden" name="designationId" value={d.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-600 hover:underline"
                  >
                    Retirer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {status === "incomplet" && (
        <section>
          <h2 className="text-sm font-semibold text-neutral-700 mb-2">
            Suggestions ({slotsLeft} désignation{slotsLeft > 1 ? "s" : ""} restante
            {slotsLeft > 1 ? "s" : ""})
          </h2>
          {!minLevelLabel && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2">
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
            <p className="text-xs text-neutral-500 mb-2">
              Niveau minimum requis : {minLevelLabel}
            </p>
          )}
          {suggestions.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Aucun arbitre disponible ne correspond aux critères pour ce match.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg bg-white">
              {suggestions.map((s) => (
                <li key={s.id} className="px-3 py-2 text-sm flex items-center justify-between">
                  <div>
                    <Link href={`/arbitres/${s.id}`} className="hover:underline">
                      {s.firstName} {s.lastName}
                    </Link>
                    <span className="text-neutral-500">
                      {" "}
                      · {s.levelLabel} · {s.zone ?? "zone inconnue"} ·{" "}
                      {s.currentLoad} désignation{s.currentLoad > 1 ? "s" : ""}
                    </span>
                  </div>
                  <form action={designate}>
                    <input type="hidden" name="refereeId" value={s.id} />
                    <button
                      type="submit"
                      className="rounded bg-neutral-900 text-white text-xs px-3 py-1.5 hover:bg-neutral-800"
                    >
                      Désigner
                    </button>
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
