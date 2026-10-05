import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "REPARTITEUR";
};

const links = [
  { href: "/matchs", label: "Matchs" },
  { href: "/fbi", label: "FBI" },
  { href: "/arbitres", label: "Arbitres" },
  { href: "/disponibilites", label: "Disponibilités" },
  { href: "/controles", label: "Contrôles" },
  { href: "/statistiques", label: "Statistiques" },
  { href: "/export", label: "Export" },
  { href: "/reglement", label: "Règlement" },
];

const adminLinks = [
  { href: "/admin/niveaux", label: "Niveaux" },
  { href: "/admin/groupes", label: "Groupes" },
  { href: "/admin/parametres", label: "Paramètres" },
  { href: "/admin/import", label: "Import matchs" },
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
];

export function Nav({ user }: { user: NavUser }) {
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  async function logout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <header className="sticky top-0 z-10 bg-[var(--surface)]/90 backdrop-blur border-b border-[var(--border)]">
      <div className="px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Link href="/matchs" className="flex items-center gap-2 shrink-0">
            {/* Fond blanc fixe : le logo (texte bleu nuit) reste lisible en thème sombre. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-alloarbitre-icon.png"
              alt="AlloArbitre"
              width={40}
              height={40}
              className="sm:hidden h-10 w-10 rounded-md bg-white"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-alloarbitre.png"
              alt="AlloArbitre"
              width={900}
              height={284}
              className="hidden sm:block h-11 w-auto rounded-md bg-white px-1"
            />
          </Link>
          <NavLinks links={links} adminLinks={user.role === "ADMIN" ? adminLinks : undefined} />
        </div>
        <div className="flex items-center gap-2 text-sm shrink-0">
          <Link
            href="/compte"
            className="hidden 2xl:flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <span className="avatar-chip">{initial}</span>
            <span className="max-w-[10rem] truncate">{user.name ?? user.email}</span>
          </Link>
          <Link href="/compte" className="hidden xl:block btn-ghost text-xs">
            Mon compte
          </Link>
          <form action={logout} className="hidden xl:block">
            <button type="submit" className="btn btn-secondary">
              Déconnexion
            </button>
          </form>
          <MobileNav
            links={links}
            adminLinks={user.role === "ADMIN" ? adminLinks : undefined}
            userLabel={user.name ?? user.email ?? ""}
            logoutAction={logout}
          />
        </div>
      </div>
    </header>
  );
}
