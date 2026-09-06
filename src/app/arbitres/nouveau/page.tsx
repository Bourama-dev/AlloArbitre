import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { listRefereeLevels } from "@/lib/referees";
import { geocodeAddress } from "@/lib/geocoding";
import { AlertToast } from "@/components/alert-toast";

export const dynamic = "force-dynamic";

async function createReferee(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const zone = String(formData.get("zone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const levelId = String(formData.get("levelId") ?? "");
  const nationalNumber = String(formData.get("nationalNumber") ?? "").trim() || null;
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim() || null;
  const birthDate = String(formData.get("birthDate") ?? "").trim() || null;
  const qualificationDate = String(formData.get("qualificationDate") ?? "").trim() || null;
  const medicalFileDate = String(formData.get("medicalFileDate") ?? "").trim() || null;
  const recyclingDate = String(formData.get("recyclingDate") ?? "").trim() || null;

  if (!firstName || !lastName || !levelId) {
    redirect(`/arbitres/nouveau?error=${encodeURIComponent("Champs obligatoires manquants.")}`);
  }

  const coords = address ? await geocodeAddress(address) : null;

  const { data, error } = await supabaseAdmin
    .from("Referee")
    .insert({
      firstName,
      lastName,
      phone,
      email,
      zone,
      address,
      notes,
      levelId,
      nationalNumber,
      licenseNumber,
      birthDate,
      qualificationDate,
      medicalFileDate,
      recyclingDate,
      active: true,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/arbitres/nouveau?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/arbitres/${data.id}`);
}

export default async function NewRefereePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;
  const levels = await listRefereeLevels();

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <Link href="/arbitres" className="text-sm text-[var(--accent)] hover:underline">
          ← Retour aux arbitres
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-2">Nouvel arbitre</h1>
      </div>

      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}

      <form
        action={createReferee}
        className="space-y-3 card p-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label">Prénom *</label>
            <input
              name="firstName"
              required
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Nom *</label>
            <input
              name="lastName"
              required
              className="input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label">Téléphone</label>
            <input
              name="phone"
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              name="email"
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Adresse postale</label>
          <input name="address" className="input w-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label">Club</label>
            <input
              name="zone"
              className="input w-full"
            />
          </div>
          <div>
            <label className="field-label">Niveau *</label>
            <select
              name="levelId"
              required
              defaultValue=""
              className="input w-full"
            >
              <option value="" disabled>
                Sélectionner...
              </option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="field-label">N° national</label>
            <input name="nationalNumber" className="input w-full" />
          </div>
          <div>
            <label className="field-label">N° licence</label>
            <input name="licenseNumber" className="input w-full" />
          </div>
          <div>
            <label className="field-label">Date de naissance</label>
            <input type="date" name="birthDate" className="input w-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="field-label">Qualification</label>
            <input type="date" name="qualificationDate" className="input w-full" />
          </div>
          <div>
            <label className="field-label">Dossier médical</label>
            <input type="date" name="medicalFileDate" className="input w-full" />
          </div>
          <div>
            <label className="field-label">Recyclage</label>
            <input type="date" name="recyclingDate" className="input w-full" />
          </div>
        </div>

        <div>
          <label className="field-label">Notes</label>
          <textarea
            name="notes"
            rows={2}
            className="input w-full"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
        >
          Créer l&apos;arbitre
        </button>
      </form>
    </div>
  );
}
