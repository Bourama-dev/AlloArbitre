import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "@/components/nav-links";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "REPARTITEUR";
};

const links = [
  { href: "/matchs", label: "Matchs" },
  { href: "/matchs/incomplets", label: "Incomplets" },
  { href: "/arbitres", label: "Arbitres" },
];

const adminLinks = [
  { href: "/admin/niveaux", label: "Niveaux" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
];

export function Nav({ user }: { user: NavUser }) {
  const allLinks = user.role === "ADMIN" ? [...links, ...adminLinks] : links;
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-10 bg-[var(--surface)]/90 backdrop-blur border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/matchs" className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand)] text-white font-bold text-sm">
              A
            </span>
            <span className="font-semibold text-[var(--foreground)] tracking-tight">
              AlloArbitre
            </span>
          </Link>
          <NavLinks links={allLinks} />
        </div>
        <div className="flex items-center gap-3 text-sm shrink-0">
          <span className="hidden sm:flex items-center gap-2 text-[var(--muted)]">
            <span className="avatar-chip">{initial}</span>
            {user.name ?? user.email}
          </span>
          <form
            action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase.auth.signOut();
              redirect("/login");
            }}
          >
            <button type="submit" className="btn btn-secondary">
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
