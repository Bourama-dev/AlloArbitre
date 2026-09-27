import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/algo-rules";
import { AlertToast } from "@/components/alert-toast";

export const dynamic = "force-dynamic";

export default async function SettingsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/matchs");

  const { error, saved } = await searchParams;
  const settings = await getSettings();

  async function saveSettings(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") return;
    const raw = String(formData.get("maxDistanceKm") ?? "").trim().replace(",", ".");
    const value = raw === "" ? null : Number(raw);
    if (value != null && (!Number.isFinite(value) || value <= 0)) {
      redirect(`/admin/parametres?error=${encodeURIComponent("Distance maximale : un nombre de km positif, ou vide.")}`);
    }
    const { error } = await supabaseAdmin
      .from("Settings")
      .upsert({ id: 1, maxDistanceKm: value, updatedAt: new Date().toISOString() });
    if (error) throw error;
    revalidatePath("/admin/parametres");
    redirect("/admin/parametres?saved=1");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}
      {saved && <AlertToast message="Paramètres enregistrés." variant="success" />}

      <div>
        <h1 className="text-xl font-semibold tracking-tight">Paramètres du comité</h1>
        <p className="text-sm text-[var(--muted)]">
          Règles appliquées par l&apos;algorithme de suggestion, l&apos;auto-désignation et la désignation manuelle.
        </p>
      </div>

      <form action={saveSettings} className="card p-4 space-y-3">
        <div>
          <label htmlFor="maxDistanceKm" className="field-label">
            Distance maximale domicile → gymnase (km, aller simple)
          </label>
          <input
            id="maxDistanceKm"
            name="maxDistanceKm"
            type="number"
            min={1}
            step="0.1"
            defaultValue={settings.maxDistanceKm ?? ""}
            placeholder="Pas de limite"
            className="input w-40 mt-1"
          />
          <p className="text-xs text-[var(--muted)] mt-1">
            Au-delà, l&apos;arbitre n&apos;est plus proposé et la désignation est refusée. La distance est calculée
            par la route (Google Routes) quand elle est disponible, sinon à vol d&apos;oiseau. Un 2e match dans le même
            gymnase le même jour n&apos;est pas concerné (aucun nouveau déplacement). Laisser vide pour ne pas limiter.
          </p>
        </div>
        <button type="submit" className="btn btn-primary">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
