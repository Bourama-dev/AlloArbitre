import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AlertToast } from "@/components/alert-toast";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "REPARTITEUR" | "ARBITRE";
type ProfileRow = { id: string; email: string; name: string; role: Role; refereeId: string | null; createdAt: string };
type RefereeRow = { id: string; firstName: string; lastName: string; licenseNumber: string | null; zone: string | null };

const STAFF_ROLES = ["ADMIN", "REPARTITEUR"] as const;

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "jamais";
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function back(kind: "ok" | "error", msg: string): never {
  redirect(`/admin/utilisateurs?${kind}=${encodeURIComponent(msg)}`);
}

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; vue?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "ADMIN") redirect("/matchs");
  const { error, ok, vue } = await searchParams;

  const [{ data: profiles, error: profilesError }, { data: referees, error: refereesError }, authList] = await Promise.all([
    supabaseAdmin.from("Profile").select("id, email, name, role, refereeId, createdAt").order("name"),
    supabaseAdmin
      .from("Referee")
      .select("id, firstName, lastName, licenseNumber, zone")
      .eq("active", true)
      .order("lastName"),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (profilesError) throw profilesError;
  if (refereesError) throw refereesError;
  const lastSignIn = new Map((authList.data?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]));

  const rows = (profiles ?? []) as ProfileRow[];
  const staff = rows.filter((p) => p.role !== "ARBITRE");
  const refereeAccounts = rows.filter((p) => p.role === "ARBITRE");
  const refereeById = new Map(((referees ?? []) as RefereeRow[]).map((r) => [r.id, r]));
  const activatedIds = new Set(refereeAccounts.map((p) => p.refereeId).filter(Boolean));
  const notActivated = ((referees ?? []) as RefereeRow[]).filter((r) => !activatedIds.has(r.id));
  const adminCount = staff.filter((p) => p.role === "ADMIN").length;

  async function changeRole(formData: FormData) {
    "use server";
    const admin = await getCurrentUser();
    if (admin?.role !== "ADMIN") return;
    const id = String(formData.get("id"));
    const role = String(formData.get("role"));
    if (!(STAFF_ROLES as readonly string[]).includes(role)) return;
    if (id === admin.id && role !== "ADMIN") back("error", "Vous ne pouvez pas retirer votre propre rôle ADMIN.");

    // Jamais de changement de rôle sur un compte arbitre : son rôle est fixé
    // côté serveur (app_metadata) et le cantonne à son espace.
    const { data: target, error: targetError } = await supabaseAdmin.from("Profile").select("role").eq("id", id).maybeSingle();
    if (targetError) throw targetError;
    if (!target || target.role === "ARBITRE") back("error", "Le rôle d'un compte arbitre ne se modifie pas ici.");

    const { error } = await supabaseAdmin.from("Profile").update({ role }).eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/utilisateurs");
    back("ok", "Rôle modifié.");
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const admin = await getCurrentUser();
    if (admin?.role !== "ADMIN") return;
    const id = String(formData.get("id"));
    if (id === admin.id) back("error", "Vous ne pouvez pas supprimer votre propre compte.");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) back("error", "Suppression impossible : ce compte a créé des désignations existantes.");
    revalidatePath("/admin/utilisateurs");
    back("ok", "Compte supprimé.");
  }

  return (
    <div className="space-y-8">
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}
      {ok && <AlertToast message={decodeURIComponent(ok)} variant="success" />}

      <section className="space-y-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Comptes du staff</h1>
          <p className="text-sm text-[var(--muted)]">
            Répartiteurs et administrateurs. Un nouveau compte créé via <code>/signup</code> est REPARTITEUR par
            défaut ; promouvez-le en ADMIN ici si besoin.
          </p>
        </div>
        <div className="table-shell overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 font-medium">Nom</th>
                <th className="px-3 py-2 font-medium">E-mail</th>
                <th className="px-3 py-2 font-medium">Dernière connexion</th>
                <th className="px-3 py-2 font-medium">Rôle</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {staff.map((p) => {
                const isMe = p.id === currentUser.id;
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {p.name}
                      {isMe && <span className="text-xs text-[var(--muted)]"> (vous)</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">{p.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">{formatWhen(lastSignIn.get(p.id))}</td>
                    <td className="px-3 py-2">
                      {isMe ? (
                        <span className="text-sm">{p.role}</span>
                      ) : (
                        <form action={changeRole} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={p.id} />
                          <select name="role" defaultValue={p.role} className="input">
                            <option value="REPARTITEUR">REPARTITEUR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <button type="submit" className="btn btn-primary text-xs">
                            Enregistrer
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {!isMe && (
                        <form action={deleteUser}>
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmSubmitButton
                            confirmMessage={`Supprimer définitivement le compte de ${p.name} ?`}
                            className="btn-danger text-xs"
                          >
                            Supprimer
                          </ConfirmSubmitButton>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--muted)]">
          {adminCount} administrateur(s). Vous ne pouvez ni modifier votre propre rôle ni supprimer votre compte.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Comptes arbitres</h2>
            <p className="text-sm text-[var(--muted)]">
              <strong>{activatedIds.size}</strong> arbitre(s) actif(s) sur {refereeById.size} ont activé leur espace.
              Mot de passe oublié : générez un lien personnel depuis la fiche de l&apos;arbitre. Supprimer un compte
              ne touche pas à la fiche : l&apos;arbitre pourra le réactiver.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <Link
              href="/admin/utilisateurs"
              className={vue === "sans-compte" ? "btn-ghost" : "btn btn-primary"}
            >
              Comptes activés ({refereeAccounts.length})
            </Link>
            <Link
              href="/admin/utilisateurs?vue=sans-compte"
              className={vue === "sans-compte" ? "btn btn-primary" : "btn-ghost"}
            >
              Pas encore activé ({notActivated.length})
            </Link>
          </div>
        </div>

        {vue === "sans-compte" ? (
          notActivated.length === 0 ? (
            <p className="text-sm text-[var(--success)]">Tous les arbitres actifs ont activé leur espace.</p>
          ) : (
            <div className="table-shell overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 font-medium">Arbitre</th>
                    <th className="px-3 py-2 font-medium">Licence</th>
                    <th className="px-3 py-2 font-medium">Club</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {notActivated.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {r.lastName} {r.firstName}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">
                        {r.licenseNumber ?? <span className="text-[var(--warning)]">aucune : lien personnel requis</span>}
                      </td>
                      <td className="px-3 py-2 text-[var(--muted)]">{r.zone ?? ""}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <Link href={`/arbitres/${r.id}`} className="text-xs text-[var(--accent)] hover:underline">
                          Fiche / lien personnel
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : refereeAccounts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucun arbitre n&apos;a encore activé son espace.</p>
        ) : (
          <div className="table-shell overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-medium">Arbitre</th>
                  <th className="px-3 py-2 font-medium">E-mail de connexion</th>
                  <th className="px-3 py-2 font-medium">Activé le</th>
                  <th className="px-3 py-2 font-medium">Dernière connexion</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {refereeAccounts.map((p) => {
                  const referee = p.refereeId ? refereeById.get(p.refereeId) : undefined;
                  return (
                    <tr key={p.id}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {referee ? (
                          <Link href={`/arbitres/${referee.id}`} className="hover:underline">
                            {referee.lastName} {referee.firstName}
                          </Link>
                        ) : (
                          <span>
                            {p.name} <span className="text-xs text-[var(--warning)]">(fiche inactive ou introuvable)</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">{p.email}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">{formatWhen(p.createdAt)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">{formatWhen(lastSignIn.get(p.id))}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <form action={deleteUser}>
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmSubmitButton
                            confirmMessage={`Supprimer le compte de connexion de ${p.name} ? Sa fiche et ses disponibilités sont conservées ; il pourra réactiver son espace.`}
                            className="btn-danger text-xs"
                          >
                            Supprimer le compte
                          </ConfirmSubmitButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
