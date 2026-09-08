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
    id: "max-2-jour",
    label: "Maximum 2 matchs par jour",
    description: "Un arbitre ne peut pas siffler plus de 2 matchs au cours d'une même journée.",
    severity: "bloquant",
  },
  {
    id: "max-4-jour-tqr",
    label: "Maximum 4 matchs TQR par jour",
    description:
      "Un TQR se jouant en format réduit (2 mi-temps), un arbitre peut en siffler jusqu'à 4 dans la même journée (soit l'équivalent de 2 matchs classiques), à condition de respecter un repos après 2 matchs d'affilée.",
    severity: "bloquant",
  },
  {
    id: "repos-tqr",
    label: "Repos après 2 TQR d'affilée",
    description:
      "Après 2 matchs TQR joués sans interruption (dos à dos), un arbitre doit laisser passer au moins un match avant d'en resiffler un autre.",
    severity: "bloquant",
  },
  {
    id: "max-3-semaine",
    label: "Maximum 3 désignations par semaine",
    description:
      "Un arbitre ne peut pas être désigné plus de 3 fois au cours d'une même semaine (du lundi au dimanche). Ne s'applique pas aux TQR.",
    severity: "bloquant",
  },
  {
    id: "max-3-weekend",
    label: "Maximum 3 désignations par week-end",
    description:
      "Un arbitre ne peut pas être désigné plus de 3 fois au cours d'un même week-end (samedi et dimanche). Ne s'applique pas aux TQR.",
    severity: "bloquant",
  },
];

const MAX_PER_PERIOD = 3;
export const MAX_PER_DAY = 2;
export const MAX_PER_DAY_TQR = 4;

/** Le jour calendaire (00:00 -> 00:00 le lendemain) contenant `date`. */
function dayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 1);
  return { start, end };
}

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
 * Vérifie les règles de quota (jour / semaine / week-end) pour une nouvelle
 * désignation d'un arbitre sur `matchDate`/`durationMinutes`, étant donné
 * ses désignations actives existantes (`existing`, hors match en cours de
 * création).
 *
 * `isTqr` : un TQR se joue en tournoi (plusieurs matchs courts le même jour,
 * au même endroit) - la règle "max 2 matchs/jour", pensée pour des matchs
 * classiques répartis sur des lieux différents, est remplacée par "max 4
 * matchs TQR/jour" (l'équivalent en mi-temps de 2 matchs classiques), avec
 * obligation de repos après 2 TQR joués sans interruption. Les plafonds
 * "max 3/semaine" et "max 3/week-end" (pensés pour des matchs classiques
 * espacés dans la semaine) ne s'appliquent pas non plus aux TQR.
 */
export function checkQuotaRules(
  matchDate: Date,
  durationMinutes: number,
  existing: { date: Date; durationMinutes: number }[],
  isTqr = false
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const existingDates = existing.map((e) => e.date);

  const { start: dayStart, end: dayEnd } = dayRange(matchDate);
  const dayMatches = existing.filter((e) => e.date >= dayStart && e.date < dayEnd);

  if (isTqr) {
    if (dayMatches.length + 1 > MAX_PER_DAY_TQR) {
      violations.push({
        ruleId: "max-4-jour-tqr",
        severity: "bloquant",
        message: `Cet arbitre a déjà ${dayMatches.length} match(s) TQR ce jour-là (maximum ${MAX_PER_DAY_TQR}).`,
      });
    }

    // Repos obligatoire après 2 TQR d'affilée (sans creux entre eux) : on
    // recherche la plus longue série de matchs qui s'enchaînent sans
    // interruption jusqu'à et y compris celui qu'on tente d'ajouter.
    const all = [...dayMatches, { date: matchDate, durationMinutes }].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    const idx = all.findIndex(
      (e) => e.date.getTime() === matchDate.getTime() && e.durationMinutes === durationMinutes
    );
    let run = 1;
    for (let i = idx; i > 0; i--) {
      const prevEnd = all[i - 1].date.getTime() + all[i - 1].durationMinutes * 60_000;
      if (prevEnd === all[i].date.getTime()) run++;
      else break;
    }
    if (run > 2) {
      violations.push({
        ruleId: "repos-tqr",
        severity: "bloquant",
        message: "Cet arbitre vient d'enchaîner 2 matchs TQR sans interruption : il lui faut un match de repos avant de reprendre.",
      });
    }
  } else if (dayMatches.length + 1 > MAX_PER_DAY) {
    violations.push({
      ruleId: "max-2-jour",
      severity: "bloquant",
      message: `Cet arbitre a déjà ${dayMatches.length} match(s) ce jour-là (maximum ${MAX_PER_DAY}).`,
    });
  }

  if (!isTqr) {
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
  }

  return violations;
}
