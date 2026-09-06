import { weekRange } from "@/lib/dates";

export type RuleSeverity = "bloquant" | "avertissement";

export type DesignationRule = {
  id: string;
  label: string;
  description: string;
  severity: RuleSeverity;
};

/**
 * Règles de désignation du CD45, à compléter au fur et à mesure qu'elles
 * sont communiquées. Chaque règle documentée ici doit avoir sa vérification
 * correspondante (voir checkQuotaRules) si elle est de nature à bloquer ou
 * déconseiller une désignation.
 */
export const DESIGNATION_RULES: DesignationRule[] = [
  {
    id: "max-3-semaine",
    label: "Maximum 3 désignations par semaine",
    description:
      "Un arbitre ne peut pas être désigné plus de 3 fois au cours d'une même semaine (du lundi au dimanche).",
    severity: "bloquant",
  },
  {
    id: "max-3-weekend",
    label: "Maximum 3 désignations par week-end",
    description:
      "Un arbitre ne peut pas être désigné plus de 3 fois au cours d'un même week-end (samedi et dimanche).",
    severity: "bloquant",
  },
];

const MAX_PER_PERIOD = 3;

/** Le week-end (sam. 00:00 -> lun. 00:00) contenant `date`, ou null si `date` n'est ni un samedi ni un dimanche. */
function weekendRange(date: Date): { start: Date; end: Date } | null {
  const day = date.getUTCDay(); // 0 = dimanche, 6 = samedi
  if (day !== 0 && day !== 6) return null;
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  if (day === 0) start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 2);
  return { start, end };
}

export type RuleViolation = { ruleId: string; severity: RuleSeverity; message: string };

/**
 * Vérifie les règles de quota (semaine / week-end) pour une nouvelle
 * désignation d'un arbitre sur `matchDate`, étant donné ses désignations
 * actives existantes (`existingDates`, hors match en cours de création).
 */
export function checkQuotaRules(matchDate: Date, existingDates: Date[]): RuleViolation[] {
  const violations: RuleViolation[] = [];

  const { start: weekStart, end: weekEnd } = weekRange(matchDate);
  const weekCount = existingDates.filter((d) => d >= weekStart && d < weekEnd).length;
  if (weekCount + 1 > MAX_PER_PERIOD) {
    violations.push({
      ruleId: "max-3-semaine",
      severity: "bloquant",
      message: `Cet arbitre a déjà ${weekCount} désignation(s) cette semaine (maximum ${MAX_PER_PERIOD}).`,
    });
  }

  const weekend = weekendRange(matchDate);
  if (weekend) {
    const weekendCount = existingDates.filter(
      (d) => d >= weekend.start && d < weekend.end
    ).length;
    if (weekendCount + 1 > MAX_PER_PERIOD) {
      violations.push({
        ruleId: "max-3-weekend",
        severity: "bloquant",
        message: `Cet arbitre a déjà ${weekendCount} désignation(s) ce week-end (maximum ${MAX_PER_PERIOD}).`,
      });
    }
  }

  return violations;
}
