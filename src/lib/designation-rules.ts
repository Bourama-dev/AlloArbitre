import { weekRange } from "@/lib/dates";

export type RuleSeverity = "bloquant" | "avertissement";

export type DesignationRule = {
  id: string;
  label: string;
  description: string;
  severity: RuleSeverity;
};

/**
 * Règles de désignation du CD45 et du Règlement des officiels FFBB
 * 2026-2027 (art. 5 et annexe 15). Chaque règle documentée ici doit avoir sa
 * vérification correspondante (checkQuotaRules, divisionReasons dans
 * algo-rules.ts, ou les contrôles de suggestions.ts) si elle est de nature à
 * bloquer ou déconseiller une désignation. Les plafonds propres au CD45
 * (2/jour, 3/semaine, 3/week-end) sont plus stricts que ceux de la FFBB et
 * s'appliquent en plus.
 */
/**
 * Quotas (jour / semaine / week-end / TQR) : « avertissement » - une
 * désignation manuelle qui les dépasse est enregistrée avec une alerte ;
 * les suggestions et l'auto-désignation n'en proposent jamais.
 * (checkQuotaRules renvoie toujours ces dépassements avec la sévérité
 * « bloquant » pour que les suggestions les écartent.)
 */
export const DESIGNATION_RULES: DesignationRule[] = [
  {
    id: "max-2-jour",
    label: "Maximum 2 matchs par jour",
    description: "Un arbitre ne peut pas siffler plus de 2 matchs au cours d'une même journée.",
    severity: "avertissement",
  },
  {
    id: "presence-30-min",
    label: "Présence 30 min avant le match (trajet compris)",
    description:
      "Un arbitre doit être au gymnase au moins 30 minutes avant le début du match. Pour deux matchs le même jour dans des gymnases différents, l'écart entre la fin du premier (durée comptée : 2 h) et le début du second doit couvrir le trajet (estimé à 50 km/h à vol d'oiseau) plus ces 30 minutes, ou 1 h si un des gymnases n'est pas géocodé. Dans le même gymnase, les matchs peuvent s'enchaîner.",
    severity: "bloquant",
  },
  {
    id: "max-4-jour-tqr",
    label: "Maximum 4 matchs TQR par jour",
    description:
      "Un TQR se jouant en format réduit (2 mi-temps), un arbitre peut en siffler jusqu'à 4 dans la même journée (soit l'équivalent de 2 matchs classiques), à condition de respecter un repos après 2 matchs d'affilée.",
    severity: "avertissement",
  },
  {
    id: "repos-tqr",
    label: "Repos après 2 TQR d'affilée",
    description:
      "Après 2 matchs TQR joués sans interruption (dos à dos), un arbitre doit laisser passer au moins un match avant d'en resiffler un autre.",
    severity: "avertissement",
  },
  {
    id: "max-3-semaine",
    label: "Maximum 3 désignations par semaine",
    description:
      "Un arbitre ne peut pas être désigné plus de 3 fois au cours d'une même semaine (du lundi au dimanche). Ne s'applique pas aux TQR.",
    severity: "avertissement",
  },
  {
    id: "max-3-weekend",
    label: "Maximum 3 désignations par week-end",
    description:
      "Un arbitre ne peut pas être désigné plus de 3 fois au cours d'un même week-end (samedi et dimanche). Ne s'applique pas aux TQR.",
    severity: "avertissement",
  },
  {
    id: "max-4-sur-3-jours",
    label: "Maximum 4 rencontres sur 3 jours glissants (FFBB)",
    description:
      "Règlement des officiels 2026-2027, art. 5.7 : pour des raisons médicales, physiques et de concentration, un arbitre ne peut pas être désigné sur plus de 4 rencontres sur 3 jours consécutifs, quelle que soit la fenêtre de 3 jours retenue. Seules les rencontres arbitrées sont comptées ici : les matchs joués par l'arbitre (qui réduisent ce plafond à 3 ou 2 arbitrées) ne sont pas connus de l'application. Ne s'applique pas aux TQR.",
    severity: "avertissement",
  },
  {
    id: "age-15-ans",
    label: "Âge minimum de 15 ans (FFBB)",
    description:
      "Règlement des officiels 2026-2027, art. 5.6 et annexe 15 : seuls les arbitres de 15 ans révolus peuvent être désignés par le comité. En dessous, ils officient à domicile comme arbitres club (sans désignation). Sans date de naissance, le contrôle ne bloque pas mais est signalé dans Contrôles.",
    severity: "bloquant",
  },
  {
    id: "mineur-categorie",
    label: "Arbitre de 15 ans : pas de match U20/U21 ni senior (FFBB)",
    description:
      "Annexe 15 : un arbitre de 15 ans ne peut pas être désigné sur une rencontre U20, U21 ou senior (division reconnue d'après son libellé : « U20 », « U21 », « Seniors », PRM/PRF, DM/DF). Dès 16 ans, ces rencontres lui sont ouvertes, accompagné d'un arbitre majeur.",
    severity: "bloquant",
  },
  {
    id: "distance-max",
    label: "Distance maximale fixée par le comité",
    description:
      "Si une distance maximale est fixée (Admin > Paramètres), un arbitre plus loin du gymnase (par la route quand la distance routière est connue, sinon à vol d'oiseau) n'est ni proposé ni désignable. Un 2e match le même jour dans le même gymnase n'est pas concerné.",
    severity: "bloquant",
  },
  {
    id: "age-min",
    label: "Âge minimum par division",
    description:
      "Si un âge minimum est fixé pour une division (Admin > Niveaux), un arbitre plus jeune à la date du match ne peut pas y être désigné. Sans date de naissance, le contrôle ne bloque pas mais est signalé dans Contrôles.",
    severity: "bloquant",
  },
  {
    id: "disponibilites",
    label: "Disponibilités saisies par l'arbitre",
    description:
      "Sur une période ouverte à la saisie (menu Disponibilités), un arbitre qui a répondu n'est proposé que sur les créneaux qu'il a cochés (matin avant 12 h, début d'après-midi 12 h - 15 h, fin d'après-midi 15 h - 18 h, soir à partir de 18 h ; un match compte dans le créneau de son heure de début). Sans réponse, il reste proposé avec une mention, sauf si « Sans réponse = exclu » est activé (Admin > Paramètres) et que la saisie est close. L'auto-désignation, elle, ne retient que les arbitres qui ont répondu et coché le créneau du match.",
    severity: "bloquant",
  },
  {
    id: "groupes",
    label: "Groupes de désignation",
    description:
      "Une division rattachée à un ou plusieurs groupes (Admin > Groupes) n'est ouverte qu'aux arbitres membres de ces groupes. Une division sans groupe reste ouverte à tous.",
    severity: "bloquant",
  },
];

const MAX_PER_PERIOD = 3;
/** FFBB, art. 5.7 : 4 rencontres maximum sur 3 jours glissants. */
export const MAX_PER_3_DAYS = 4;
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
    // 3 jours glissants : on teste les trois fenêtres de 3 jours consécutifs
    // qui contiennent le jour du match (match en 1re, 2e ou 3e position).
    const DAY_MS = 86_400_000;
    for (let offset = 0; offset < 3; offset++) {
      const winStart = new Date(dayStart.getTime() - offset * DAY_MS);
      const winEnd = new Date(winStart.getTime() + 3 * DAY_MS);
      const count = existingDates.filter((d) => d >= winStart && d < winEnd).length;
      if (count + 1 > MAX_PER_3_DAYS) {
        violations.push({
          ruleId: "max-4-sur-3-jours",
          severity: "bloquant",
          message: `Cet arbitre a déjà ${count} désignation(s) sur 3 jours consécutifs autour de cette date (maximum ${MAX_PER_3_DAYS} sur 3 jours glissants, règlement FFBB).`,
        });
        break;
      }
    }

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
