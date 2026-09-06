import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AlertToast } from "@/components/alert-toast";

export const dynamic = "force-dynamic";

type ProfileRow = { id: string; email: string; name: string; role: "ADMIN" | "REPARTITEUR" };

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "ADMIN") {
    redirect("/matchs");
  }

  const { error } = await searchParams;

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("Profile")
    .select("id, email, name, role")
    .order("email", { ascending: true });
  if (profilesError) throw profilesError;

  async function changeRole(formData: FormData) {
    "use server";
    const admin = await getCurrentUser();
    if (admin?.role !== "ADMIN") return;

    const id = String(formData.get("id"));
    const role = String(formData.get("role"));
    if (role !== "ADMIN" && role !== "REPARTITEUR") return;

    const { error } = await supabaseAdmin.from("Profile").update({ role }).eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/utilisateurs");
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const admin = await getCurrentUser();
    if (admin?.role !== "ADMIN") return;

    const id = String(formData.get("id"));
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      redirect(
        `/admin/utilisateurs?error=${encodeURIComponent(
          "Suppression impossible : ce compte a créé des désignations existantes."
        )}`
      );
    }
    revalidatePath("/admin/utilisateurs");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Comptes utilisateurs</h1>
        <p className="text-sm text-[var(--muted)]">
          Un nouveau compte se crée via <code>/signup</code> avec le rôle
          REPARTITEUR par défaut. Promouvez-le en ADMIN ici si besoin.
        </p>
      </div>

      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}

      <div className="table-shell overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 font-medium">Nom</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Rôle</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(profiles as ProfileRow[]).map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2 whitespace-nowrap">{p.name}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">{p.email}</td>
                <td className="px-3 py-2">
                  <form action={changeRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <select
                      name="role"
                      defaultValue={p.role}
                      className="input"
                    >
                      <option value="REPARTITEUR">REPARTITEUR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <button
                      type="submit"
                      className="btn btn-primary text-xs"
                    >
                      Enregistrer
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <form action={deleteUser}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Supprimer définitivement le compte de ${p.name} ?`}
                      className="btn-danger text-xs"
                    >
                      Supprimer
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
