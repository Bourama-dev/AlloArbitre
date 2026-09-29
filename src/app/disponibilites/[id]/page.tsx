import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SLOTS, dateToParisLocal, daysBetween, formatDayFr, formatDeadlineFr, parisLocalToDate } from "@/lib/availability";
import { activeReferees, announcementMessage, getPeriod, reminderMessage } from "@/lib/availability-campaign";
import { AlertToast } from "@/components/alert-toast";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { CopyText } from "@/components/copy-text";

export const dynamic = "force-dynamic";

function back(id: string, kind: "ok" | "error", msg: string): never {
  redirect(`/disponibilites/${id}?${kind}=${encodeURIComponent(msg)}`);
}

export default async function AvailabilityPeriodPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string; filtre?: string; modifier?: string }>;
}) {
  const { id } = await params;
  const { error, ok, filtre, modifier } = await searchParams;
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
  const editing = modifier ? referees.find((r) => r.id === modifier) : undefined;
  const editResponse = editing ? responseBy.get(editing.id) : undefined;
  const editSlots = editing ? slotsBy.get(editing.id) : undefined;

  /**
   * Correction par un répartiteur (arbitre qui a prévenu par message, erreur
   * de saisie...) : remplace les créneaux de l'arbitre sur la période, même
   * après la date limite. La réponse est marquée comme donnée.
   */
  async function saveRefereeAvailability(formData: FormData) {
    "use server";
    if (!(await getCurrentUser())) return;
    const refereeId = String(formData.get("refereeId") ?? "");
    const current = await getPeriod(id);
    if (!current || !refereeId) back(id, "error", "Arbitre ou période introuvable.");
    const validDays = new Set(daysBetween(current.startDate, current.endDate));
    const validSlots = new Set<string>(SLOTS.map((sl) => sl.id));
    const picked = [...new Set(formData.getAll("slot").map(String))]
      .map((v) => v.split("|"))
      .filter(([day, slot]) => validDays.has(day) && validSlots.has(slot))
      .map(([day, slot]) => ({ periodId: id, refereeId, day, slot }));
    const comment = String(formData.get("comment") ?? "").trim().slice(0, 500) || null;

    const { error: delError } = await supabaseAdmin
      .from("AvailabilitySlot")
      .delete()
      .eq("periodId", id)
      .eq("refereeId", refereeId);
    if (delError) throw delError;
    if (picked.length > 0) {
      const { error: insError } = await supabaseAdmin.from("AvailabilitySlot").insert(picked);
      if (insError) throw insError;
    }
    const { data: existing, error: exError } = await supabaseAdmin
      .from("AvailabilityResponse")
      .select("respondedAt")
      .eq("periodId", id)
      .eq("refereeId", refereeId)
      .maybeSingle();
    if (exError) throw exError;
    const { error: respError } = await supabaseAdmin.from("AvailabilityResponse").upsert(
      {
        periodId: id,
        refereeId,
        respondedAt: (existing?.respondedAt as string | undefined) ?? new Date().toISOString(),
        comment,
      },
      { onConflict: "periodId,refereeId" }
    );
    if (respError) throw respError;
    revalidatePath(`/disponibilites/${id}`);
    revalidatePath("/fbi");
    back(
      id,
      "ok",
      `Disponibilités de ${String(formData.get("refereeName") ?? "l'arbitre")} enregistrées (${picked.length} créneau(x)).`
    );
  }

  /** Remet l'arbitre « sans réponse » sur cette période. */
  async function clearRefereeAvailability(formData: FormData) {
    "use server";
    if (!(await getCurrentUser())) return;
    const refereeId = String(formData.get("refereeId") ?? "");
    const { error: e1 } = await supabaseAdmin.from("AvailabilitySlot").delete().eq("periodId", id).eq("refereeId", refereeId);
    if (e1) throw e1;
    const { error: e2 } = await supabaseAdmin
      .from("AvailabilityResponse")
      .delete()
      .eq("periodId", id)
      .eq("refereeId", refereeId);
    if (e2) throw e2;
    revalidatePath(`/disponibilites/${id}`);
    revalidatePath("/fbi");
    back(id, "ok", "Réponse effacée : l'arbitre est de nouveau « sans réponse ».");
  }

  async function updateDeadline(formData: FormData) {
    "use server";
    if (!(await getCurrentUser())) return;
    const local = String(formData.get("deadline") ?? "");
    if (!local) return;
    const { error } = await supabaseAdmin
      .from("AvailabilityPeriod")
      .update({ deadline: parisLocalToDate(local).toISOString() })
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <CopyText label="Annonce à coller dans le groupe WhatsApp" text={announcementMessage(period)} />
        </div>
        <div className="card p-4">
          {closed ? (
            <div className="space-y-1">
              <p className="field-label">Bilan de clôture</p>
              <p className="text-sm">
                {missing.length === 0
                  ? "Tous les arbitres actifs ont répondu."
                  : `${missing.length} arbitre(s) n'ont pas répondu : ${missing.map((r) => `${r.lastName} ${r.firstName}`).join(", ")}.`}
              </p>
            </div>
          ) : missing.length === 0 ? (
            <p className="text-sm text-[var(--success)]">Tout le monde a répondu : pas de relance nécessaire.</p>
          ) : (
            <CopyText label={`Relance des ${missing.length} sans réponse`} text={reminderMessage(period, missing)} />
          )}
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-end gap-3">
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

      {editing && (
        <section id="modifier" className="card p-4 space-y-3 border-2 border-[var(--accent)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">
                Modifier les disponibilités de {editing.lastName} {editing.firstName}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {editResponse ? "A répondu" : "Sans réponse pour l'instant"} · cochez les créneaux où l&apos;arbitre est
                disponible. Possible même après la date limite.
              </p>
            </div>
            <Link href={`/disponibilites/${id}`} className="btn-ghost text-xs">
              Annuler
            </Link>
          </div>
          <form action={saveRefereeAvailability} className="space-y-3">
            <input type="hidden" name="refereeId" value={editing.id} />
            <input type="hidden" name="refereeName" value={`${editing.firstName} ${editing.lastName}`} />
            <div className="grid gap-3 sm:grid-cols-2">
              {days.map((day) => (
                <fieldset key={day} className="space-y-1">
                  <legend className="text-sm font-medium mb-1">{formatDayFr(day)}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {SLOTS.map((sl) => (
                      <label
                        key={sl.id}
                        className="flex items-center gap-2 border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm cursor-pointer has-[:checked]:bg-[var(--success-bg)] has-[:checked]:border-[var(--success)]"
                      >
                        <input
                          type="checkbox"
                          name="slot"
                          value={`${day}|${sl.id}`}
                          defaultChecked={editSlots?.has(`${day}|${sl.id}`) ?? false}
                        />
                        <span>
                          {sl.label} <span className="text-[10px] text-[var(--muted)]">{sl.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <div>
              <label htmlFor="edit-comment" className="field-label">
                Commentaire
              </label>
              <textarea
                id="edit-comment"
                name="comment"
                rows={2}
                maxLength={500}
                defaultValue={(editResponse?.comment as string | null) ?? ""}
                className="input w-full text-sm"
              />
            </div>
            <button type="submit" className="btn btn-primary text-sm">
              Enregistrer
            </button>
          </form>
          {editResponse && (
            <form action={clearRefereeAvailability}>
              <input type="hidden" name="refereeId" value={editing.id} />
              <ConfirmSubmitButton
                className="btn-danger text-xs"
                confirmMessage={`Effacer la réponse de ${editing.firstName} ${editing.lastName} ? Il redeviendra « sans réponse ».`}
              >
                Effacer la réponse
              </ConfirmSubmitButton>
            </form>
          )}
        </section>
      )}

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
                <th className="px-3 py-2" />
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
                            {!response ? "·" : on ? s.short : "✕"}
                          </td>
                        );
                      })
                    )}
                    <td className="px-3 py-1.5 text-xs text-[var(--muted)]">{(response?.comment as string | null) ?? ""}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      <Link
                        href={`/disponibilites/${id}?modifier=${r.id}${filtre ? `&filtre=${filtre}` : ""}#modifier`}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-1">
          M : matin · A1 : début d&apos;après-midi (12 h - 15 h) · A2 : fin d&apos;après-midi (15 h - 18 h) · S : soir ·
          ✕ : pas disponible · « · » : pas de réponse
        </p>
      </section>
    </div>
  );
}
