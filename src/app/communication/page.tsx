import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CommunicationStudio, type PendingReferee } from "@/components/communication-studio";

export const dynamic = "force-dynamic";

type RefereeRow = {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string | null;
  birthDate: string | null;
  phone: string | null;
};

export default async function CommunicationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ data: referees, error: refError }, { data: accounts, error: accError }] = await Promise.all([
    supabaseAdmin
      .from("Referee")
      .select("id, firstName, lastName, licenseNumber, birthDate, phone")
      .eq("active", true)
      .order("lastName")
      .order("firstName"),
    supabaseAdmin.from("Profile").select("refereeId").eq("role", "ARBITRE"),
  ]);
  if (refError) throw refError;
  if (accError) throw accError;

  const rows = (referees ?? []) as RefereeRow[];
  const activated = new Set((accounts ?? []).map((a) => a.refereeId as string | null).filter(Boolean));
  const notActivated = rows.filter((r) => !activated.has(r.id));
  const activatedCount = rows.length - notActivated.length;
  // Fiches qui empêcheraient l'activation : licence ou date de naissance manquante.
  const incomplete = notActivated.filter((r) => !r.licenseNumber?.trim() || !r.birthDate);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const defaultLink = host ? `${proto}://${host}/espace/connexion` : "";

  const pending: PendingReferee[] = notActivated.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    licence: r.licenseNumber?.trim() || null,
    phone: r.phone,
  }));

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Communication</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Messages prêts à copier pour annoncer AlloArbitre et relancer les arbitres, avec le suivi des comptes activés.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Arbitres actifs", value: rows.length },
          { label: "Comptes activés", value: activatedCount },
          { label: "À relancer", value: notActivated.length },
        ].map((k) => (
          <div key={k.label} className="card p-3">
            <p className="text-[11px] text-[var(--muted)]">{k.label}</p>
            <p className="text-lg font-semibold">{k.value}</p>
          </div>
        ))}
      </div>

      {incomplete.length > 0 && (
        <section className="rounded-xl p-4 text-sm bg-[var(--warning-bg)] text-[var(--warning)] space-y-2">
          <p className="font-semibold">
            {incomplete.length} fiche{incomplete.length > 1 ? "s" : ""} à compléter avant l&apos;envoi
          </p>
          <p className="text-xs">
            L&apos;activation demande le n° de licence et la date de naissance : sans l&apos;un des deux, l&apos;arbitre sera refusé.
          </p>
          <ul className="text-xs list-disc pl-5 space-y-0.5">
            {incomplete.map((r) => (
              <li key={r.id}>
                <Link href={`/arbitres/${r.id}/modifier`} className="underline">
                  {r.firstName} {r.lastName}
                </Link>
                {" : "}
                {[!r.licenseNumber?.trim() && "licence manquante", !r.birthDate && "date de naissance manquante"].filter(Boolean).join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <CommunicationStudio defaultLink={defaultLink} pending={pending} />

      <section className="card p-4 text-sm space-y-1">
        <p className="font-semibold">Rappels</p>
        <ul className="text-xs text-[var(--muted)] list-disc pl-5 space-y-1">
          <li>L&apos;activation se fait avec le n° de licence et la date de naissance, une seule fois.</li>
          <li>Après 5 essais incorrects, l&apos;activation d&apos;une licence est bloquée une heure.</li>
          <li>
            Le tableau des licences expose les noms et numéros : le seul verrou est la date de naissance. Surveillez{" "}
            <Link href="/admin/utilisateurs" className="underline">
              Admin &gt; Utilisateurs
            </Link>{" "}
            après l&apos;envoi.
          </li>
          <li>Un arbitre bloqué reçoit un lien personnel depuis sa fiche ou Admin &gt; Utilisateurs.</li>
        </ul>
      </section>
    </div>
  );
}
