import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PERIOD_SELECT, formatDeadlineFr, mapPeriod, parisLocalToDate } from "@/lib/availability";
import { AlertToast } from "@/components/alert-toast";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

function formatDay(day: string) {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

export default async function AvailabilityPeriodsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;

  const [{ data: rows, error: pError }, { count: activeCount, error: cError }, { data: responses, error: rError }] =
    await Promise.all([
      supabaseAdmin.from("AvailabilityPeriod").select(PERIOD_SELECT).order("startDate", { ascending: false }).limit(30),
      supabaseAdmin.from("Referee").select("id", { count: "exact", head: true }).eq("active", true),
      supabaseAdmin.from("AvailabilityResponse").select("periodId"),
    ]);
  if (pError) throw pError;
  if (cError) throw cError;
  if (rError) throw rError;
  const periods = (rows ?? []).map((r) => mapPeriod(r as Record<string, unknown>));
  const responseCount = new Map<string, number>();
  for (const r of responses ?? []) responseCount.set(r.periodId as string, (responseCount.get(r.periodId as string) ?? 0) + 1);

  async function createPeriod(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) return;
    const label = String(formData.get("label") ?? "").trim();
    const startDate = String(formData.get("startDate") ?? "");
    const endDate = String(formData.get("endDate") ?? "");
    const deadlineLocal = String(formData.get("deadline") ?? "");
    if (!label || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !deadlineLocal) {
      redirect(`/disponibilites?error=${encodeURIComponent("Nom, dates et date limite sont obligatoires.")}`);
    }
    if (endDate < startDate) {
      redirect(`/disponibilites?error=${encodeURIComponent("La date de fin précède la date de début.")}`);
    }
    const deadline = parisLocalToDate(deadlineLocal);
    const { data, error } = await supabaseAdmin
      .from("AvailabilityPeriod")
      .insert({ label, startDate, endDate, deadline: deadline.toISOString() })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/disponibilites");
    redirect(`/disponibilites/${data.id}?ok=${encodeURIComponent("Période créée : partagez le message ci-dessous dans le groupe WhatsApp.")}`);
  }

  return (
    <div className="space-y-6">
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}
      {ok && <AlertToast message={decodeURIComponent(ok)} variant="success" />}

      <div>
        <h1 className="text-xl font-semibold tracking-tight">Disponibilités</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Ouvrez une période (un week-end, une semaine…) : les arbitres saisissent leurs créneaux disponibles dans leur
          espace jusqu&apos;à la date limite, puis la saisie est verrouillée. Chaque période fournit un message
          d&apos;annonce et un message de relance (avec les noms des retardataires) à coller dans le groupe WhatsApp.
          Les créneaux saisis filtrent directement les suggestions de désignation.
        </p>
      </div>

      <form action={createPeriod} className="card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
        <div className="lg:col-span-2">
          <label className="field-label" htmlFor="label">
            Nom
          </label>
          <input id="label" name="label" required placeholder="Week-end du 10-11 octobre" className="input w-full" />
        </div>
        <div>
          <label className="field-label" htmlFor="startDate">
            Du
          </label>
          <input id="startDate" name="startDate" type="date" required className="input w-full" />
        </div>
        <div>
          <label className="field-label" htmlFor="endDate">
            Au
          </label>
          <input id="endDate" name="endDate" type="date" required className="input w-full" />
        </div>
        <div>
          <label className="field-label" htmlFor="deadline">
            Date limite de saisie
          </label>
          <input id="deadline" name="deadline" type="datetime-local" required className="input w-full" />
        </div>
        <SubmitButton className="btn btn-primary" pendingLabel="Création…">
          Ouvrir la période
        </SubmitButton>
      </form>

      {periods.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Aucune période pour l&apos;instant.</p>
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 font-medium">Période</th>
                <th className="px-3 py-2 font-medium">Dates</th>
                <th className="px-3 py-2 font-medium">Clôture</th>
                <th className="px-3 py-2 font-medium">Réponses</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const closed = p.deadline.getTime() <= Date.now();
                const n = responseCount.get(p.id) ?? 0;
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-2">
                      <Link href={`/disponibilites/${p.id}`} className="font-medium hover:underline">
                        {p.label}
                      </Link>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDay(p.startDate)} → {formatDay(p.endDate)}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${closed ? "text-[var(--muted)]" : ""}`}>
                      {closed ? "Close · " : "Ouverte · "}
                      {formatDeadlineFr(p.deadline)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {n} / {activeCount ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
