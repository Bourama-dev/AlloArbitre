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
import { formatDateOnlyFr, formatDateTimeFr, isDeadlinePassed } from "@/lib/dates";
import { AlertToast } from "@/components/alert-toast";
import { RefereeTabs } from "@/components/referee-tabs";
import { SubmitButton } from "@/components/submit-button";
import { MIN_PASSWORD_LENGTH } from "@/lib/referee-auth";
import { computeSeasonStats, currentSeasonStartYear, season } from "@/lib/stats";
import { WEEKDAY_LABELS } from "@/lib/referees";

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

  // « Mon suivi » : saison en cours, indisponibilités et dossier (lecture seule).
  const [seasonStats, { data: unavailabilityRows, error: uError }, { data: sheet, error: sheetError }] = await Promise.all([
    computeSeasonStats(season(currentSeasonStartYear()), { cd45Only: false, refereeId: me.refereeId }),
    supabaseAdmin
      .from("Unavailability")
      .select("id, recurring, startDate, endDate, dayOfWeek, startTime, endTime, note")
      .eq("refereeId", me.refereeId),
    supabaseAdmin
      .from("Referee")
      .select("qualificationDate, medicalFileDate, recyclingDate, level:RefereeLevel(label)")
      .eq("id", me.refereeId)
      .maybeSingle(),
  ]);
  if (uError) throw uError;
  if (sheetError) throw sheetError;
  const myStats = seasonStats.referees[0];
  const pastLines = (myStats?.lines ?? []).filter((l) => l.date < new Date()).sort((a, b) => b.date.getTime() - a.date.getTime());
  const myUnavailability = (
    (unavailabilityRows ?? []) as {
      id: string;
      recurring: boolean;
      startDate: string | null;
      endDate: string | null;
      dayOfWeek: number | null;
      startTime: string | null;
      endTime: string | null;
      note: string | null;
    }[]
  )
    .filter((u) => u.recurring || (u.endDate ?? "") >= today)
    .sort((a, b) => Number(a.recurring) - Number(b.recurring) || (a.startDate ?? "").localeCompare(b.startDate ?? ""));
  const myLevel = one((sheet?.level ?? null) as One<{ label: string }>)?.label ?? null;

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
    const closed = isDeadlinePassed(p.deadline);
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
    <div className={`max-w-xl mx-auto space-y-6 ${me.isStaff ? "" : "pb-24"}`}>
      {saved && <AlertToast message="Disponibilités enregistrées. Merci !" variant="success" />}
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}
      {mdp && <AlertToast message="Mot de passe enregistré." variant="success" />}

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--muted)]">Espace arbitre</p>
          <h1 className="text-xl font-bold tracking-tight">
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
        <details open={!!motdepasse} className="card p-4" id="sec-compte">
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
              Ensuite, connectez-vous avec votre adresse e-mail (ou n° de licence) et ce mot de passe.
            </p>
          </form>
        </details>
      )}

      <div className="space-y-3 scroll-mt-4" id="sec-dispos">
        <h2 className="text-sm font-bold">Mes disponibilités</h2>
        {periods.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucune période de saisie ouverte pour le moment.</p>
        ) : (
          periods.map(renderPeriod)
        )}
      </div>

      <div className="space-y-3 scroll-mt-4" id="sec-matchs">
        <h2 className="text-sm font-bold">Mes prochaines désignations ({upcoming.length})</h2>
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

      <div className="space-y-3 scroll-mt-4" id="sec-suivi">
        <h2 className="text-sm font-bold">Mon suivi · saison {seasonStats.season.label}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Matchs arbitrés", value: String(myStats?.played ?? 0) },
            { label: "À venir", value: String(myStats?.upcoming ?? 0) },
            {
              label: "Disponibilités saisies",
              value: myStats && myStats.periods > 0 ? `${myStats.responses} / ${myStats.periods}` : "-",
            },
            { label: "Niveau", value: myLevel ?? "-" },
          ].map((k) => (
            <div key={k.label} className="card p-3">
              <p className="text-[11px] text-[var(--muted)]">{k.label}</p>
              <p className="text-lg font-semibold">{k.value}</p>
            </div>
          ))}
        </div>
        {myStats && Object.keys(myStats.byDivision).length > 0 && (
          <p className="text-xs text-[var(--muted)]">
            Par division :{" "}
            {Object.entries(myStats.byDivision)
              .sort((a, b) => b[1] - a[1])
              .map(([d, n]) => `${d} ${n}`)
              .join(" · ")}
          </p>
        )}

        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-medium">Mes matchs arbitrés ({pastLines.length})</summary>
          {pastLines.length === 0 ? (
            <p className="text-sm text-[var(--muted)] mt-2">Aucun match arbitré cette saison pour l&apos;instant.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--border)] text-sm">
              {pastLines.map((l) => (
                <li key={l.matchId} className="py-2">
                  <p className="font-medium">
                    {l.homeTeam} <span className="text-[var(--muted)] font-normal">vs</span> {l.awayTeam}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDateTimeFr(l.date)} · {l.division} · Arbitre {l.position}
                    {l.venue ? ` · ${l.venue}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </details>

        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Mes indisponibilités enregistrées ({myUnavailability.length})
          </summary>
          {myUnavailability.length === 0 ? (
            <p className="text-sm text-[var(--muted)] mt-2">Aucune indisponibilité enregistrée.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--border)] text-sm">
              {myUnavailability.map((u) => {
                const hours = u.startTime && u.endTime ? ` de ${u.startTime} à ${u.endTime}` : " (journée entière)";
                return (
                  <li key={u.id} className="py-2">
                    {u.recurring
                      ? `Chaque ${(WEEKDAY_LABELS[u.dayOfWeek ?? 0] ?? "").toLowerCase()}${hours}`
                      : u.startDate === u.endDate
                        ? `Le ${formatDateOnlyFr(u.startDate)}${hours}`
                        : `Du ${formatDateOnlyFr(u.startDate)} au ${formatDateOnlyFr(u.endDate)}${hours}`}
                    {u.note && <span className="text-xs text-[var(--muted)]"> · {u.note}</span>}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-[var(--muted)] mt-2">
            Une absence prolongée à signaler ou une erreur ? Contactez votre répartiteur.
          </p>
        </details>

        <div className="card p-4 text-sm space-y-1">
          <p className="text-xs font-medium text-[var(--muted)]">Mon dossier</p>
          <p>Qualification : {formatDateOnlyFr((sheet?.qualificationDate as string | null) ?? null)}</p>
          <p>Dossier médical : {formatDateOnlyFr((sheet?.medicalFileDate as string | null) ?? null)}</p>
          <p>Recyclage : {formatDateOnlyFr((sheet?.recyclingDate as string | null) ?? null)}</p>
        </div>
      </div>

      {!me.isStaff && (
        <RefereeTabs
          tabs={[
            { id: "sec-dispos", label: "Dispos", icon: "dispos" },
            { id: "sec-matchs", label: "Matchs", icon: "matchs" },
            { id: "sec-suivi", label: "Suivi", icon: "stats" },
            { id: "sec-compte", label: "Compte", icon: "compte" },
          ]}
        />
      )}
    </div>
  );
}
