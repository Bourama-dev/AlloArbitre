import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { describeRule, SYSTEM_RULES } from "@/lib/designation-rules";
import { getAllRules } from "@/lib/rules-store";

export const dynamic = "force-dynamic";

const SEVERITY_LABEL = {
  bloquant: "Bloquant",
  avertissement: "Avertissement",
} as const;

export default async function ReglementPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { rules } = await getAllRules();
  const active = rules.filter((r) => r.active);

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Règlement des désignations</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Règles appliquées automatiquement lors de la désignation d&apos;un arbitre sur un
          match (manuelle ou en auto-désignation). Une règle « bloquante » empêche la
          désignation manuelle ; une règle « avertissement » la signale sans l&apos;empêcher.
          Dans les deux cas, l&apos;arbitre n&apos;est jamais proposé automatiquement.
        </p>
        {user.role === "ADMIN" && (
          <Link href="/admin/regles" className="btn btn-primary mt-3 inline-flex">
            Modifier les règles
          </Link>
        )}
      </div>

      {active.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Aucune règle configurée pour l&apos;instant.</p>
      ) : (
        <ul className="table-shell divide-y divide-[var(--border)]">
          {active.map((rule) => (
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
              <p className="text-sm text-[var(--muted)]">{rule.description || describeRule(rule)}</p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-base font-semibold pt-2">Règles du système</h2>
      <ul className="table-shell divide-y divide-[var(--border)]">
        {SYSTEM_RULES.map((rule) => (
          <li key={rule.id} className="px-4 py-3">
            <div className="font-medium text-sm mb-1">{rule.label}</div>
            <p className="text-sm text-[var(--muted)]">{rule.description}</p>
            {rule.href && (
              <Link href={rule.href} className="text-sm text-[var(--primary)] underline">
                {rule.hrefLabel ?? "Configurer"}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
