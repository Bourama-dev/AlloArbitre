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
  { href: "/matchs/incomplets", label: "Incomplets" },
  { href: "/arbitres", label: "Arbitres" },
  { href: "/reglement", label: "Règlement" },
];

const adminLinks = [
  { href: "/admin/niveaux", label: "Niveaux" },
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
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Link href="/matchs" className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand)] text-white font-bold text-sm">
              A
            </span>
            <span className="hidden sm:inline font-semibold text-[var(--foreground)] tracking-tight">
              AlloArbitre
            </span>
          </Link>
          <NavLinks links={links} adminLinks={user.role === "ADMIN" ? adminLinks : undefined} />
        </div>
        <div className="flex items-center gap-2 text-sm shrink-0">
          <span className="hidden lg:flex items-center gap-2 text-[var(--muted)]">
            <span className="avatar-chip">{initial}</span>
            <span className="max-w-[10rem] truncate">{user.name ?? user.email}</span>
          </span>
          <form action={logout} className="hidden md:block">
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
