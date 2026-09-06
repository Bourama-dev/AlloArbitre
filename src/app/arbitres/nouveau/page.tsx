import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { listRefereeLevels } from "@/lib/referees";

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
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const levelId = String(formData.get("levelId") ?? "");

  if (!firstName || !lastName || !levelId) {
    redirect(`/arbitres/nouveau?error=${encodeURIComponent("Champs obligatoires manquants.")}`);
  }

  const { data, error } = await supabaseAdmin
    .from("Referee")
    .insert({ firstName, lastName, phone, email, zone, notes, levelId, active: true })
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
        <Link href="/arbitres" className="text-sm text-blue-600 hover:underline">
          ← Retour aux arbitres
        </Link>
        <h1 className="text-lg font-semibold mt-2">Nouvel arbitre</h1>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {decodeURIComponent(error)}
        </p>
      )}

      <form
        action={createReferee}
        className="space-y-3 bg-white border border-neutral-200 rounded-lg p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Prénom *</label>
            <input
              name="firstName"
              required
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Nom *</label>
            <input
              name="lastName"
              required
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Téléphone</label>
            <input
              name="phone"
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Email</label>
            <input
              type="email"
              name="email"
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Zone / club</label>
            <input
              name="zone"
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Niveau *</label>
            <select
              name="levelId"
              required
              defaultValue=""
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
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

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={2}
            className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-neutral-900 text-white text-sm px-4 py-1.5 hover:bg-neutral-800"
        >
          Créer l&apos;arbitre
        </button>
      </form>
    </div>
  );
}
