import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentReferee } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PERIOD_SELECT,
  SLOTS,
  daysBetween,
  formatDayFr,
  formatDeadlineFr,
  mapPeriod,
  type AvailabilityPeriod,
} from "@/lib/availability";
import { formatDateTimeFr } from "@/lib/dates";
import { AlertToast } from "@/components/alert-toast";
import { SubmitButton } from "@/components/submit-button";
import { MIN_PASSWORD_LENGTH } from "@/lib/referee-auth";

export const dynamic = "force-dynamic";

type One<T> = T | T[] | null;
const one = <T,>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export default async function RefereeSpacePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; motdepasse?: string; mdp?: string }>;
}) {
  const me = await getCurrentReferee();
  if (!me) {
    return (
      <div className="max-w-md mx-auto card p-6 space-y-2">
        <h1 className="text-lg font-semibold">Espace arbitre</h1>
        <p className="text-sm text-[var(--muted)]">
          Aucune fiche arbitre active ne correspond à votre compte. Contactez votre répartiteur pour vérifier
          l&apos;adresse e-mail enregistrée sur votre fiche.
        </p>
      </div>
    );
  }
  const { saved, error, motdepasse, mdp } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: periodRows, error: pError }, { data: designationRows, error: dError }] = await Promise.all([
    supabaseAdmin.from("AvailabilityPeriod").select(PERIOD_SELECT).gte("endDate", today).order("startDate"),
    supabaseAdmin
      .from("Designation")
      .select(
        `position, match:Match!inner(id, date, homeTeam, awayTeam, venue, city, venueAddress, cancelled,
         competitionLevel:CompetitionLevel(label),
         designations:Designation(position, refereeId, referee:Referee(firstName, lastName)))`
      )
      .eq("refereeId", me.refereeId)
      .eq("match.cancelled", false)
      .gte("match.date", `${today}T00:00:00`),
  ]);
  if (pError) throw pError;
  if (dError) throw dError;

  const periods = (periodRows ?? []).map((r) => mapPeriod(r as Record<string, unknown>));
  const periodIds = periods.map((p) => p.id);
  const [{ data: responses }, { data: slots }] = periodIds.length
    ? await Promise.all([
        supabaseAdmin
          .from("AvailabilityResponse")
          .select("periodId, respondedAt, comment")
          .eq("refereeId", me.refereeId)
          .in("periodId", periodIds),
        supabaseAdmin
          .from("AvailabilitySlot")
          .select("periodId, day, slot")
          .eq("refereeId", me.refereeId)
          .in("periodId", periodIds),
      ])
    : [{ data: [] }, { data: [] }];
  const responseByPeriod = new Map((responses ?? []).map((r) => [r.periodId as string, r]));
  const checked = new Set((slots ?? []).map((s) => `${s.periodId}|${s.day}|${s.slot}`));

  type DesignationRow = {
    position: number;
    match: One<{
      id: string;
      date: string;
      homeTeam: string;
      awayTeam: string;
      venue: string | null;
      city: string | null;
      venueAddress: string | null;
      competitionLevel: One<{ label: string }>;
      designations: { position: number; refereeId: string; referee: One<{ firstName: string; lastName: string }> }[];
    }>;
  };
  const upcoming = ((designationRows ?? []) as unknown as DesignationRow[])
    .map((d) => ({ position: d.position, match: one(d.match)! }))
    .filter((d) => d.match)
    .sort((a, b) => a.match.date.localeCompare(b.match.date));

  async function saveAvailability(formData: FormData) {
    "use server";
    const me = await getCurrentReferee();
    if (!me) redirect("/espace/connexion");
    const periodId = String(formData.get("periodId"));
    const { data: row, error } = await supabaseAdmin
      .from("AvailabilityPeriod")
      .select(PERIOD_SELECT)
      .eq("id", periodId)
      .maybeSingle();
    if (error) throw error;
    if (!row) redirect("/espace?error=" + encodeURIComponent("Période introuvable."));
    const period = mapPeriod(row as Record<string, unknown>);
    if (period.deadline.getTime() <= Date.now()) {
      redirect("/espace?error=" + encodeURIComponent("La saisie est close pour cette période."));
    }
    const validDays = new Set(daysBetween(period.startDate, period.endDate));
    const validSlots = new Set<string>(SLOTS.map((s) => s.id));
    const picked = [...new Set(formData.getAll("slot").map(String))]
      .map((v) => v.split("|"))
      .filter(([day, slot]) => validDays.has(day) && validSlots.has(slot))
      .map(([day, slot]) => ({ periodId, refereeId: me.refereeId, day, slot }));
    const comment = String(formData.get("comment") ?? "").trim().slice(0, 500) || null;

    const { error: delError } = await supabaseAdmin
      .from("AvailabilitySlot")
      .delete()
      .eq("periodId", periodId)
      .eq("refereeId", me.refereeId);
    if (delError) throw delError;
    if (picked.length > 0) {
      const { error: insError } = await supabaseAdmin.from("AvailabilitySlot").insert(picked);
      if (insError) throw insError;
    }
    const { error: respError } = await supabaseAdmin
      .from("AvailabilityResponse")
      .upsert(
        { periodId, refereeId: me.refereeId, respondedAt: new Date().toISOString(), comment },
        { onConflict: "periodId,refereeId" }
      );
    if (respError) throw respError;
    revalidatePath("/espace");
    redirect("/espace?saved=1");
  }

  async function changePassword(formData: FormData) {
    "use server";
    const me = await getCurrentReferee();
    if (!me || me.isStaff) redirect("/espace");
    const password = String(formData.get("password") ?? "");
    if (password.length < MIN_PASSWORD_LENGTH || password !== String(formData.get("confirm") ?? "")) {
      redirect(
        "/espace?motdepasse=1&error=" +
          encodeURIComponent(`Mots de passe différents ou trop courts (${MIN_PASSWORD_LENGTH} caractères minimum).`)
      );
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) redirect("/espace?motdepasse=1&error=" + encodeURIComponent("Changement impossible : " + error.message));
    redirect("/espace?mdp=1");
  }

  async function logout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/espace/connexion");
  }

  const renderPeriod = (p: AvailabilityPeriod) => {
    const closed = p.deadline.getTime() <= Date.now();
    const response = responseByPeriod.get(p.id);
    return (
      <section key={p.id} className="card p-4 space-y-3">
        <div>
          <h3 className="font-semibold">{p.label}</h3>
          <p className={`text-xs ${closed ? "text-[var(--muted)]" : "text-[var(--warning)]"}`}>
            {closed ? "Saisie close depuis le " : "À saisir avant le "}
            {formatDeadlineFr(p.deadline)}
          </p>
          <p className={`text-xs mt-0.5 ${response ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
            {response ? "Réponse enregistrée" : "Pas encore de réponse"}
          </p>
        </div>
        <form action={saveAvailability} className="space-y-3">
          <input type="hidden" name="periodId" value={p.id} />
          <p className="text-xs text-[var(--muted)]">Cochez les créneaux où vous êtes disponible.</p>
          <div className="space-y-2">
            {daysBetween(p.startDate, p.endDate).map((day) => (
              <div key={day}>
                <p className="text-sm font-medium mb-1">{formatDayFr(day)}</p>
                <div className="grid grid-cols-3 gap-2">
                  {SLOTS.map((s) => {
                    const key = `${p.id}|${day}|${s.id}`;
                    return (
                      <label
                        key={s.id}
                        className="flex flex-col items-center justify-center gap-1 border border-[var(--border)] rounded-lg py-2 text-sm has-[:checked]:bg-[var(--success-bg)] has-[:checked]:border-[var(--success)] has-[:checked]:text-[var(--success)] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          name="slot"
                          value={`${day}|${s.id}`}
                          defaultChecked={checked.has(key)}
                          disabled={closed}
                          className="w-5 h-5"
                        />
                        <span className="font-medium">{s.label}</span>
                        <span className="text-[10px] text-[var(--muted)]">{s.hint}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <textarea
            name="comment"
            defaultValue={(response?.comment as string | null) ?? ""}
            placeholder="Commentaire pour le répartiteur (facultatif)"
            maxLength={500}
            disabled={closed}
            className="input w-full text-sm"
            rows={2}
          />
          {!closed && (
            <SubmitButton className="btn btn-primary w-full" pendingLabel="Enregistrement…">
              {response ? "Mettre à jour mes disponibilités" : "Enregistrer (même si aucun créneau)"}
            </SubmitButton>
          )}
        </form>
      </section>
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {saved && <AlertToast message="Disponibilités enregistrées. Merci !" variant="success" />}
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}
      {mdp && <AlertToast message="Mot de passe enregistré." variant="success" />}

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--muted)]">Espace arbitre</p>
          <h1 className="text-xl font-semibold tracking-tight">
            {me.firstName} {me.lastName}
          </h1>
        </div>
        {!me.isStaff && (
          <form action={logout}>
            <button type="submit" className="btn btn-secondary text-xs">
              Déconnexion
            </button>
          </form>
        )}
      </div>

      {!me.isStaff && (
        <details open={!!motdepasse} className="card p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            {motdepasse ? "Choisissez votre mot de passe" : "Changer mon mot de passe"}
          </summary>
          <form action={changePassword} className="space-y-2 mt-3">
            <input
              name="password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder={`Nouveau mot de passe (${MIN_PASSWORD_LENGTH} caractères min.)`}
              className="input w-full"
            />
            <input
              name="confirm"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder="Confirmez"
              className="input w-full"
            />
            <SubmitButton className="btn btn-primary w-full" pendingLabel="Enregistrement…">
              Enregistrer le mot de passe
            </SubmitButton>
            <p className="text-xs text-[var(--muted)]">
              Ensuite, connectez-vous avec votre n° de licence et ce mot de passe.
            </p>
          </form>
        </details>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Mes disponibilités</h2>
        {periods.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucune période de saisie ouverte pour le moment.</p>
        ) : (
          periods.map(renderPeriod)
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Mes prochaines désignations ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucune désignation à venir.</p>
        ) : (
          <ul className="table-shell divide-y divide-[var(--border)]">
            {upcoming.map(({ position, match: m }) => {
              const partners = m.designations
                .filter((d) => d.refereeId !== me.refereeId)
                .map((d) => one(d.referee))
                .filter((r): r is { firstName: string; lastName: string } => !!r)
                .map((r) => `${r.firstName} ${r.lastName}`);
              const address = [m.venue, m.venueAddress, m.city].filter(Boolean).join(", ");
              return (
                <li key={m.id} className="px-4 py-3 text-sm space-y-0.5">
                  <p className="font-medium">
                    {m.homeTeam} <span className="text-[var(--muted)] font-normal">vs</span> {m.awayTeam}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDateTimeFr(new Date(m.date))} · {one(m.competitionLevel)?.label} · Arbitre {position}
                  </p>
                  {address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      {address}
                    </a>
                  )}
                  {partners.length > 0 && (
                    <p className="text-xs text-[var(--muted)]">Avec : {partners.join(", ")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
