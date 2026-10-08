import Link from "next/link";

/** Vues de la liste des matchs : par semaine, par gymnase, contrôles des désignations. */
export function MatchViewTabs({ current }: { current: "semaine" | "gymnase" | "controles" }) {
  const tabs = [
    { id: "semaine", href: "/matchs", label: "Par semaine" },
    { id: "gymnase", href: "/matchs/gymnase", label: "Par gymnase" },
    { id: "controles", href: "/controles", label: "Contrôles" },
  ] as const;
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Vues des matchs">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className="chip-btn"
          data-on={current === t.id}
          aria-current={current === t.id ? "page" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
