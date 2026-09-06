import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { DESIGNATION_RULES } from "@/lib/designation-rules";

export const dynamic = "force-dynamic";

const SEVERITY_LABEL = {
  bloquant: "Bloquant",
  avertissement: "Avertissement",
} as const;

export default async function ReglementPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Règlement des désignations</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Règles appliquées automatiquement lors de la désignation d&apos;un arbitre sur un
          match (manuelle ou en auto-désignation). Une règle « bloquante » empêche la
          désignation ; une règle « avertissement » la signale sans l&apos;empêcher. Cette
          liste sera complétée au fur et à mesure des règles communiquées par le CD45.
        </p>
      </div>

      {DESIGNATION_RULES.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Aucune règle configurée pour l&apos;instant.</p>
      ) : (
        <ul className="table-shell divide-y divide-[var(--border)]">
          {DESIGNATION_RULES.map((rule) => (
            <li key={rule.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`badge ${
                    rule.severity === "bloquant"
                      ? "text-[var(--danger)] bg-[var(--danger-bg)]"
                      : "text-[var(--warning)] bg-[var(--warning-bg)]"
                  }`}
                >
                  {SEVERITY_LABEL[rule.severity]}
                </span>
                <span className="font-medium text-sm">{rule.label}</span>
              </div>
              <p className="text-sm text-[var(--muted)]">{rule.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
