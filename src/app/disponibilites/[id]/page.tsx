import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SLOTS, dateToParisLocal, daysBetween, formatDayFr, formatDeadlineFr, parisLocalToDate } from "@/lib/availability";
import { activeReferees, getPeriod, sendInvitation, sendReminder, sendReport } from "@/lib/availability-campaign";
import { AlertToast } from "@/components/alert-toast";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

function back(id: string, kind: "ok" | "error", msg: string): never {
  redirect(`/disponibilites/${id}?${kind}=${encodeURIComponent(msg)}`);
}

function formatSent(iso: string | null) {
  return iso ? formatDeadlineFr(new Date(iso)) : "jamais";
}

export default async function AvailabilityPeriodPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string; filtre?: string }>;
}) {
  const { id } = await params;
  const { error, ok, filtre } = await searchParams;
  const period = await getPeriod(id);
  if (!period) notFound();

  const [referees, { data: responses, error: rError }, { data: slots, error: sError }] = await Promise.all([
    activeReferees(),
    supabaseAdmin.from("AvailabilityResponse").select("refereeId, respondedAt, comment").eq("periodId", id),
    supabaseAdmin.from("AvailabilitySlot").select("refereeId, day, slot").eq("periodId", id),
  ]);
  if (rError) throw rError;
  if (sError) throw sError;

  const responseBy = new Map((responses ?? []).map((r) => [r.refereeId as string, r]));
  const slotsBy = new Map<string, Set<string>>();
  const countBy = new Map<string, string[]>();
  for (const s of slots ?? []) {
    const key = `${s.day}|${s.slot}`;
    if (!slotsBy.has(s.refereeId as string)) slotsBy.set(s.refereeId as string, new Set());
    slotsBy.get(s.refereeId as string)!.add(key);
    countBy.set(key, [...(countBy.get(key) ?? []), s.refereeId as string]);
  }
  const refereeName = new Map(referees.map((r) => [r.id, `${r.lastName} ${r.firstName}`]));
  const days = daysBetween(period.startDate, period.endDate);
  const closed = period.deadline.getTime() <= Date.now();
  const missing = referees.filter((r) => !responseBy.has(r.id));
  const shown = filtre === "sans-reponse" ? missing : referees;

  async function invite() {
    "use server";
    if (!(await getCurrentUser())) return;
    const r = await sendInvitation(id);
    revalidatePath(`/disponibilites/${id}`);
    back(id, r.ok ? "ok" : "error", r.ok ? `Invitation envoyée à ${r.sent} arbitre(s).` : r.error);
  }
  async function remind() {
    "use server";
    if (!(await getCurrentUser())) return;
    const r = await sendReminder(id);
    revalidatePath(`/disponibilites/${id}`);
    back(id, r.ok ? "ok" : "error", r.ok ? `Relance envoyée à ${r.sent} arbitre(s).` : r.error);
  }
  async function report() {
    "use server";
    if (!(await getCurrentUser())) return;
    const r = await sendReport(id);
    revalidatePath(`/disponibilites/${id}`);
    back(id, r.ok ? "ok" : "error", r.ok ? `Rapport envoyé à ${r.sent} répartiteur(s).` : r.error);
  }
  async function updateDeadline(formData: FormData) {
    "use server";
    if (!(await getCurrentUser())) return;
    const local = String(formData.get("deadline") ?? "");
    if (!local) return;
    const { error } = await supabaseAdmin
      .from("AvailabilityPeriod")
      .update({ deadline: parisLocalToDate(local).toISOString(), reminderSentAt: null, reportSentAt: null })
      .eq("id", id);
    if (error) throw error;
    revalidatePath(`/disponibilites/${id}`);
    back(id, "ok", "Date limite modifiée.");
  }
  async function deletePeriod() {
    "use server";
    const user = await getCurrentUser();
    if (!user) return;
    const { error } = await supabaseAdmin.from("AvailabilityPeriod").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/disponibilites");
    redirect("/disponibilites");
  }

  return (
    <div className="space-y-6">
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}
      {ok && <AlertToast message={decodeURIComponent(ok)} variant="success" />}

      <div>
        <Link href="/disponibilites" className="text-sm text-[var(--accent)] hover:underline">
          ← Toutes les périodes
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-2">{period.label}</h1>
        <p className="text-sm text-[var(--muted)]">
          {closed ? "Saisie close depuis le " : "Saisie ouverte jusqu'au "}
          {formatDeadlineFr(period.deadline)} · {responseBy.size} réponse(s) sur {referees.length} arbitre(s) actif(s)
        </p>
      </div>

      <div className="card p-4 flex flex-wrap items-end gap-3">
        <form action={invite}>
          <SubmitButton className="btn btn-secondary text-xs" pendingLabel="Envoi…">
            Envoyer l&apos;invitation
          </SubmitButton>
          <p className="text-[11px] text-[var(--muted)] mt-1">Dernier envoi : {formatSent(period.invitationSentAt)}</p>
        </form>
        {!closed && (
          <form action={remind}>
            <SubmitButton className="btn btn-secondary text-xs" pendingLabel="Envoi…">
              Relancer les {missing.length} sans réponse
            </SubmitButton>
            <p className="text-[11px] text-[var(--muted)] mt-1">Dernière relance : {formatSent(period.reminderSentAt)}</p>
          </form>
        )}
        <form action={report}>
          <SubmitButton className="btn btn-secondary text-xs" pendingLabel="Envoi…">
            M&apos;envoyer le rapport
          </SubmitButton>
          <p className="text-[11px] text-[var(--muted)] mt-1">Dernier rapport : {formatSent(period.reportSentAt)}</p>
        </form>
        <form action={updateDeadline} className="flex items-end gap-2">
          <div>
            <label className="field-label" htmlFor="deadline">
              Date limite
            </label>
            <input
              id="deadline"
              name="deadline"
              type="datetime-local"
              defaultValue={dateToParisLocal(period.deadline)}
              className="input"
            />
          </div>
          <button type="submit" className="btn btn-secondary text-xs">
            Modifier
          </button>
        </form>
        <form action={deletePeriod} className="ml-auto">
          <ConfirmSubmitButton
            className="btn-danger text-xs"
            confirmMessage="Supprimer cette période et toutes les disponibilités saisies ?"
          >
            Supprimer
          </ConfirmSubmitButton>
        </form>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">Arbitres disponibles par créneau</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => (
            <div key={day} className="card p-3">
              <p className="text-sm font-medium mb-2">{formatDayFr(day)}</p>
              {SLOTS.map((s) => {
                const ids = countBy.get(`${day}|${s.id}`) ?? [];
                return (
                  <details key={s.id} className="text-sm py-0.5">
                    <summary className="cursor-pointer">
                      {s.label} : <strong>{ids.length}</strong>
                    </summary>
                    <p className="text-xs text-[var(--muted)] pl-4 pt-1">
                      {ids.length === 0
                        ? "Personne"
                        : ids
                            .map((rid) => refereeName.get(rid) ?? "?")
                            .sort()
                            .join(", ")}
                    </p>
                  </details>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-sm font-semibold">Réponses par arbitre</h2>
          <Link
            href={filtre === "sans-reponse" ? `/disponibilites/${id}` : `/disponibilites/${id}?filtre=sans-reponse`}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            {filtre === "sans-reponse" ? "Afficher tout le monde" : `Seulement les ${missing.length} sans réponse`}
          </Link>
        </div>
        <div className="table-shell overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 font-medium">Arbitre</th>
                {days.map((day) => (
                  <th key={day} className="px-2 py-2 font-medium text-center whitespace-nowrap" colSpan={SLOTS.length}>
                    {formatDayFr(day).split(" ").slice(0, 2).join(" ")}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const response = responseBy.get(r.id);
                const mine = slotsBy.get(r.id);
                return (
                  <tr key={r.id}>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <Link href={`/arbitres/${r.id}`} className="hover:underline">
                        {r.lastName} {r.firstName}
                      </Link>
                      {!response && <span className="ml-2 text-xs text-[var(--danger)]">sans réponse</span>}
                    </td>
                    {days.flatMap((day) =>
                      SLOTS.map((s) => {
                        const on = mine?.has(`${day}|${s.id}`);
                        return (
                          <td
                            key={`${day}-${s.id}`}
                            title={`${formatDayFr(day)} - ${s.label}`}
                            className={`px-1 py-1.5 text-center text-xs ${
                              !response ? "text-[var(--muted)]" : on ? "text-[var(--success)]" : "text-[var(--danger)]"
                            }`}
                          >
                            {!response ? "·" : on ? s.label.charAt(0) : "✕"}
                          </td>
                        );
                      })
                    )}
                    <td className="px-3 py-1.5 text-xs text-[var(--muted)]">{(response?.comment as string | null) ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-1">
          M / A / S : disponible le matin, l&apos;après-midi, le soir · ✕ : pas disponible · « · » : pas de réponse
        </p>
      </section>
    </div>
  );
}
