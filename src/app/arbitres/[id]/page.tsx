import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getRefereeSheet, addUnavailability, removeUnavailability } from "@/lib/referees";
import { getCurrentUser } from "@/lib/current-user";
import { formatDateTimeFr } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function RefereeSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheet = await getRefereeSheet(id);
  if (!sheet) notFound();

  const { referee, upcoming, past, currentLoad, unavailability } = sheet;

  async function addUnavailabilityAction(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const startDate = String(formData.get("startDate") ?? "");
    const endDate = String(formData.get("endDate") ?? startDate);
    const note = String(formData.get("note") ?? "").trim() || null;
    if (!startDate) return;

    await addUnavailability(id, startDate, endDate || startDate, note);
    revalidatePath(`/arbitres/${id}`);
  }

  async function removeUnavailabilityAction(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const unavailabilityId = String(formData.get("unavailabilityId"));
    await removeUnavailability(unavailabilityId);
    revalidatePath(`/arbitres/${id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/arbitres" className="text-sm text-[var(--accent)] hover:underline">
          ← Retour aux arbitres
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {referee.firstName} {referee.lastName}
          </h1>
          <Link
            href={`/arbitres/${id}/modifier`}
            className="btn-ghost text-xs"
          >
            Modifier
          </Link>
        </div>
        {!referee.active && (
          <p className="text-sm text-[var(--muted)]">Arbitre inactif</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Niveau</span>
            <span className="font-medium">{referee.level.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Zone</span>
            <span className="font-medium">{referee.zone ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Téléphone</span>
            <span className="font-medium">{referee.phone ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Email</span>
            <span className="font-medium">{referee.email ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Charge actuelle</span>
            <span className="font-medium">
              {currentLoad} désignation{currentLoad > 1 ? "s" : ""} à venir
            </span>
          </div>
        </div>
        {referee.notes && (
          <div className="card p-4 text-sm">
            <p className="text-[var(--muted)] mb-1">Notes</p>
            <p>{referee.notes}</p>
          </div>
        )}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Indisponibilités
        </h2>
        {unavailability.length === 0 ? (
          <p className="text-sm text-[var(--muted)] mb-2">Aucune indisponibilité déclarée.</p>
        ) : (
          <ul className="table-shell divide-y divide-[var(--border)] mb-2">
            {unavailability.map((u) => (
              <li key={u.id} className="px-3 py-2 text-sm flex items-center justify-between">
                <span>
                  Du {u.startDate} au {u.endDate}
                  {u.note ? ` · ${u.note}` : ""}
                </span>
                <form action={removeUnavailabilityAction}>
                  <input type="hidden" name="unavailabilityId" value={u.id} />
                  <button type="submit" className="btn-danger text-xs">
                    Retirer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form
          action={addUnavailabilityAction}
          className="flex flex-wrap items-end gap-2 card p-3"
        >
          <div>
            <label className="field-label">Du</label>
            <input
              type="date"
              name="startDate"
              required
              className="input"
            />
          </div>
          <div>
            <label className="field-label">Au</label>
            <input
              type="date"
              name="endDate"
              className="input"
            />
          </div>
          <div className="flex-1 min-w-[10rem]">
            <label className="field-label">Note</label>
            <input
              name="note"
              className="input w-full"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary text-xs"
          >
            Ajouter
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Désignations à venir
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucune désignation à venir.</p>
        ) : (
          <ul className="table-shell divide-y divide-[var(--border)]">
            {upcoming.map((d) => (
              <li key={d.id} className="px-3 py-2 text-sm flex justify-between">
                <Link href={`/matchs/${d.match.id}`} className="hover:underline">
                  {d.match.homeTeam} - {d.match.awayTeam} ({d.match.competitionLevel.label})
                </Link>
                <span className="text-[var(--muted)]">
                  {formatDateTimeFr(d.match.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Historique
        </h2>
        {past.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucun historique.</p>
        ) : (
          <ul className="table-shell divide-y divide-[var(--border)]">
            {past.map((d) => (
              <li key={d.id} className="px-3 py-2 text-sm flex justify-between text-[var(--muted)]">
                <span>
                  {d.match.homeTeam} - {d.match.awayTeam} ({d.match.competitionLevel.label})
                </span>
                <span>{formatDateTimeFr(d.match.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
