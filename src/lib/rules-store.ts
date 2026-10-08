import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_RULES,
  type ForbidParams,
  type QuotaParams,
  type Rule,
  type RuleSeverity,
} from "@/lib/designation-rules";

type Row = {
  id: string;
  kind: string;
  label: string;
  description: string | null;
  severity: string;
  active: boolean;
  builtin: boolean;
  position: number;
  params: unknown;
};

const num = (v: unknown, fallback: number, min = 1, max = 99) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];

/** Valide une ligne de la table : une ligne malformée est ignorée plutôt que de casser les désignations. */
export function normalizeRule(row: Row): Rule | null {
  const severity: RuleSeverity = row.severity === "bloquant" ? "bloquant" : "avertissement";
  const base = {
    id: row.id,
    label: row.label,
    description: row.description,
    severity,
    active: !!row.active,
    builtin: !!row.builtin,
    position: row.position ?? 0,
  };
  const p = (row.params ?? {}) as Record<string, unknown>;

  if (row.kind === "quota") {
    const period = (["day", "week", "weekend", "rolling3"] as const).find((x) => x === p.period);
    const scope = (["classiques", "tqr", "tous"] as const).find((x) => x === p.scope) ?? "classiques";
    if (!period) return null;
    const params: QuotaParams = { period, max: num(p.max, 1), scope };
    return { ...base, kind: "quota", params };
  }
  if (row.kind === "tqr-repos") {
    return { ...base, kind: "tqr-repos", params: { maxConsecutive: num(p.maxConsecutive, 2) } };
  }
  if (row.kind === "forbid") {
    const referee = (p.referee ?? {}) as Record<string, unknown>;
    const division = (p.division ?? {}) as Record<string, unknown>;
    const scope = (["all", "seniors", "u20plus", "custom"] as const).find((x) => x === division.scope) ?? "all";
    const ageUnder = referee.ageUnder == null || referee.ageUnder === "" ? null : num(referee.ageUnder, 0, 1, 99);
    const params: ForbidParams = {
      referee: { levels: strings(referee.levels), ageUnder },
      division: { scope, labels: strings(division.labels) },
    };
    // Sans aucun critère d'arbitre, la règle ne vise personne : on l'ignore.
    if (params.referee.levels.length === 0 && params.referee.ageUnder == null) return null;
    return { ...base, kind: "forbid", params };
  }
  return null;
}

/** Toutes les règles (actives ou non), pour la page d'administration. Valeurs par défaut si la table est vide ou absente. */
export async function getAllRules(): Promise<{ rules: Rule[]; fromDatabase: boolean }> {
  const { data, error } = await supabaseAdmin.from("DesignationRule").select("*").order("position").order("createdAt");
  if (error || !data || data.length === 0) return { rules: DEFAULT_RULES, fromDatabase: false };
  const rules = (data as Row[]).map(normalizeRule).filter((r): r is Rule => r !== null);
  return { rules, fromDatabase: true };
}

/** Règles à appliquer (les actives, déjà triées). */
export async function getRules(): Promise<Rule[]> {
  const { rules } = await getAllRules();
  return rules.filter((r) => r.active);
}
