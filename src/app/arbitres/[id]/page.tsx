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
        <Link href="/arbitres" className="text-sm text-blue-600 hover:underline">
          ← Retour aux arbitres
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-lg font-semibold">
            {referee.firstName} {referee.lastName}
          </h1>
          <Link
            href={`/arbitres/${id}/modifier`}
            className="text-xs text-blue-600 hover:underline"
          >
            Modifier
          </Link>
        </div>
        {!referee.active && (
          <p className="text-sm text-neutral-500">Arbitre inactif</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Niveau</span>
            <span className="font-medium">{referee.level.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Zone</span>
            <span className="font-medium">{referee.zone ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Téléphone</span>
            <span className="font-medium">{referee.phone ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Email</span>
            <span className="font-medium">{referee.email ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Charge actuelle</span>
            <span className="font-medium">
              {currentLoad} désignation{currentLoad > 1 ? "s" : ""} à venir
            </span>
          </div>
        </div>
        {referee.notes && (
          <div className="bg-white border border-neutral-200 rounded-lg p-4 text-sm">
            <p className="text-neutral-500 mb-1">Notes</p>
            <p>{referee.notes}</p>
          </div>
        )}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-2">
          Indisponibilités
        </h2>
        {unavailability.length === 0 ? (
          <p className="text-sm text-neutral-500 mb-2">Aucune indisponibilité déclarée.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg bg-white mb-2">
            {unavailability.map((u) => (
              <li key={u.id} className="px-3 py-2 text-sm flex items-center justify-between">
                <span>
                  Du {u.startDate} au {u.endDate}
                  {u.note ? ` · ${u.note}` : ""}
                </span>
                <form action={removeUnavailabilityAction}>
                  <input type="hidden" name="unavailabilityId" value={u.id} />
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Retirer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form
          action={addUnavailabilityAction}
          className="flex flex-wrap items-end gap-2 bg-white border border-neutral-200 rounded-lg p-3"
        >
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Du</label>
            <input
              type="date"
              name="startDate"
              required
              className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Au</label>
            <input
              type="date"
              name="endDate"
              className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[10rem]">
            <label className="block text-xs text-neutral-500 mb-1">Note</label>
            <input
              name="note"
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-neutral-900 text-white text-xs px-3 py-1.5 hover:bg-neutral-800"
          >
            Ajouter
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-2">
          Désignations à venir
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune désignation à venir.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg bg-white">
            {upcoming.map((d) => (
              <li key={d.id} className="px-3 py-2 text-sm flex justify-between">
                <Link href={`/matchs/${d.match.id}`} className="hover:underline">
                  {d.match.homeTeam} - {d.match.awayTeam} ({d.match.competitionLevel.label})
                </Link>
                <span className="text-neutral-500">
                  {formatDateTimeFr(d.match.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-2">
          Historique
        </h2>
        {past.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun historique.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg bg-white">
            {past.map((d) => (
              <li key={d.id} className="px-3 py-2 text-sm flex justify-between text-neutral-500">
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
