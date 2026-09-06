import Link from "next/link";
import { signOut } from "@/auth";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "REPARTITEUR";
};

const links = [
  { href: "/matchs", label: "Matchs" },
  { href: "/matchs/incomplets", label: "Matchs incomplets" },
  { href: "/arbitres", label: "Arbitres" },
];

export function Nav({ user }: { user: NavUser }) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/matchs" className="font-semibold text-neutral-900">
            AlloArbitre
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-neutral-600 hover:text-neutral-900"
              >
                {l.label}
              </Link>
            ))}
            {user.role === "ADMIN" && (
              <Link
                href="/admin/niveaux"
                className="text-neutral-600 hover:text-neutral-900"
              >
                Admin niveaux
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-500">{user.name ?? user.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-neutral-600 hover:text-neutral-900 underline"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
