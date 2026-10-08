import Link from "next/link";

/** Onglets Rapports : Statistiques / Export (masqués à l'impression par le parent). */
export function ReportTabs({ current }: { current: "statistiques" | "export" }) {
  const tabs = [
    { id: "statistiques", href: "/statistiques", label: "Statistiques" },
    { id: "export", href: "/export", label: "Export des désignations" },
  ] as const;
  return (
    <nav className="flex gap-2" aria-label="Rapports">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={`chip-btn ${current === t.id ? "font-bold" : ""}`}
          aria-current={current === t.id ? "page" : undefined}
          data-on={current === t.id}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
