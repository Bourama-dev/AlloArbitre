import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { LevelMappingPanel } from "./niveaux-panel";
import { GroupsPanel } from "./groupes-panel";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "niveaux", label: "Niveaux requis" },
  { id: "groupes", label: "Groupes" },
] as const;

export default async function DivisionsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/matchs");
  const params = await searchParams;
  const tab = params.onglet === "groupes" ? "groupes" : "niveaux";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Divisions et groupes</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Qui peut arbitrer quelle division : niveau d&apos;arbitre minimum, âge minimum et groupes autorisés.
        </p>
      </div>
      <nav className="flex gap-2" aria-label="Sections">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/divisions?onglet=${t.id}`}
            className={`chip-btn ${tab === t.id ? "font-bold" : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            data-on={tab === t.id}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {tab === "niveaux" ? (
        <LevelMappingPanel searchParams={Promise.resolve({ error: params.error })} />
      ) : (
        <GroupsPanel searchParams={Promise.resolve({ error: params.error })} />
      )}
    </div>
  );
}
