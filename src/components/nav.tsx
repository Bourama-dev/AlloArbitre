import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav, type AppNavLink } from "@/components/app-nav";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "REPARTITEUR";
};

// Onglets principaux : barre du bas sur mobile (4 + « Plus »), haut du rail
// latéral sur grand écran.
const tabs: AppNavLink[] = [
  { href: "/matchs", label: "Matchs", icon: "matchs" },
  { href: "/fbi", label: "FBI", icon: "fbi" },
  { href: "/arbitres", label: "Arbitres", icon: "arbitres" },
  { href: "/disponibilites", label: "Disponibilités", shortLabel: "Dispos", icon: "dispos" },
];

const more: AppNavLink[] = [
  { href: "/controles", label: "Contrôles", icon: "controles" },
  { href: "/statistiques", label: "Statistiques", icon: "stats" },
  { href: "/export", label: "Export", icon: "export" },
  { href: "/reglement", label: "Règlement", icon: "reglement" },
];

const adminLinks: AppNavLink[] = [
  { href: "/admin/niveaux", label: "Niveaux", icon: "admin" },
  { href: "/admin/groupes", label: "Groupes", icon: "admin" },
  { href: "/admin/parametres", label: "Paramètres", icon: "admin" },
  { href: "/admin/import", label: "Import matchs", icon: "admin" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "admin" },
];

export function Nav({ user }: { user: NavUser }) {
  async function logout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <AppNav
      tabs={tabs}
      more={more}
      admin={user.role === "ADMIN" ? adminLinks : undefined}
      userLabel={user.name ?? user.email ?? ""}
      logoutAction={logout}
    />
  );
}
