import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  getRefereeSheet,
  addPunctualUnavailability,
  addRecurringUnavailability,
  removeUnavailability,
  WEEKDAY_LABELS,
} from "@/lib/referees";
import { getCurrentUser } from "@/lib/current-user";
import { formatDateTimeFr, formatDateOnlyFr } from "@/lib/dates";
import { SubmitButton } from "@/components/submit-button";

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

  async function addPunctualAction(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const startDate = String(formData.get("startDate") ?? "");
    const endDate = String(formData.get("endDate") ?? startDate);
    const note = String(formData.get("note") ?? "").trim() || null;
    if (!startDate) return;

    await addPunctualUnavailability(id, startDate, endDate || startDate, note);
    revalidatePath(`/arbitres/${id}`);
  }

  async function addRecurringAction(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const dayOfWeek = Number(formData.get("dayOfWeek"));
    const startTime = String(formData.get("startTime") ?? "").trim() || null;
    const endTime = String(formData.get("endTime") ?? "").trim() || null;
    const note = String(formData.get("note") ?? "").trim() || null;
    if (Number.isNaN(dayOfWeek)) return;

    await addRecurringUnavailability(id, dayOfWeek, startTime, endTime, note);
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
            <span className="text-[var(--muted)]">Club</span>
            <span className="font-medium">{referee.zone ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">N° national</span>
            <span className="font-medium">{referee.nationalNumber ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">N° licence</span>
            <span className="font-medium">{referee.licenseNumber ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Date de naissance</span>
            <span className="font-medium">{formatDateOnlyFr(referee.birthDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Téléphone</span>
            <span className="font-medium">{referee.phone ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Email</span>
            <span className="font-medium">{referee.email ?? "-"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[var(--muted)] shrink-0">Adresse</span>
            <span className="font-medium text-right">{referee.address ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Charge actuelle</span>
            <span className="font-medium">
              {currentLoad} désignation{currentLoad > 1 ? "s" : ""} à venir
            </span>
          </div>
        </div>
        <div className="card p-4 space-y-2 text-sm">
          <p className="field-label mb-1">Dates réglementaires</p>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Qualification</span>
            <span className="font-medium">{formatDateOnlyFr(referee.qualificationDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Dossier médical</span>
            <span className="font-medium">{formatDateOnlyFr(referee.medicalFileDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Recyclage</span>
            <span className="font-medium">{formatDateOnlyFr(referee.recyclingDate)}</span>
          </div>
          {referee.notes && (
            <>
              <p className="field-label mb-1 pt-2 border-t border-[var(--border)]">Notes</p>
              <p>{referee.notes}</p>
            </>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Indisponibilités
        </h2>
        {unavailability.length === 0 ? (
          <p className="text-sm text-[var(--muted)] mb-2">Aucune indisponibilité déclarée.</p>
        ) : (
          <ul className="table-shell divide-y divide-[var(--border)] mb-3">
            {unavailability.map((u) => (
              <li key={u.id} className="px-3 py-2 text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      u.recurring
                        ? "text-[var(--accent)] bg-[var(--accent-tint)]"
                        : "text-[var(--muted)] bg-[var(--neutral-bg)]"
                    }`}
                  >
                    {u.recurring ? "Récurrente" : "Ponctuelle"}
                  </span>
                  {u.recurring ? (
                    <span>
                      Tous les {WEEKDAY_LABELS[u.dayOfWeek ?? 0]}
                      {u.startTime && u.endTime
                        ? ` de ${u.startTime} à ${u.endTime}`
                        : " (journée entière)"}
                      {u.note ? ` · ${u.note}` : ""}
                    </span>
                  ) : (
                    <span>
                      Du {u.startDate} au {u.endDate}
                      {u.note ? ` · ${u.note}` : ""}
                    </span>
                  )}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <form
            action={addPunctualAction}
            className="flex flex-wrap items-end gap-2 card p-3"
          >
            <p className="field-label w-full">Ajouter - période ponctuelle</p>
            <div>
              <label className="field-label">Du</label>
              <input type="date" name="startDate" required className="input" />
            </div>
            <div>
              <label className="field-label">Au</label>
              <input type="date" name="endDate" className="input" />
            </div>
            <div className="flex-1 min-w-[8rem]">
              <label className="field-label">Note</label>
              <input name="note" className="input w-full" />
            </div>
            <SubmitButton className="btn btn-primary text-xs" pendingLabel="Ajout…">
              Ajouter
            </SubmitButton>
          </form>

          <form
            action={addRecurringAction}
            className="flex flex-wrap items-end gap-2 card p-3"
          >
            <p className="field-label w-full">
              Ajouter - récurrente (chaque semaine)
            </p>
            <div>
              <label className="field-label">Jour</label>
              <select name="dayOfWeek" required defaultValue="6" className="input">
                {WEEKDAY_LABELS.map((label, i) => (
                  <option key={i} value={i}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">De (optionnel)</label>
              <input type="time" name="startTime" className="input" />
            </div>
            <div>
              <label className="field-label">À (optionnel)</label>
              <input type="time" name="endTime" className="input" />
            </div>
            <div className="flex-1 min-w-[8rem]">
              <label className="field-label">Note</label>
              <input name="note" className="input w-full" />
            </div>
            <SubmitButton className="btn btn-primary text-xs" pendingLabel="Ajout…">
              Ajouter
            </SubmitButton>
          </form>
        </div>
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
