import { weekRange } from "@/lib/dates";
import { divisionAgeCategory } from "@/lib/algo-rules-shared";

/**
 * Règles de désignation pilotées par des données (table "DesignationRule",
 * modifiable depuis page Règles). Ce fichier ne contient que le moteur
 * (pur, sans accès base) et les valeurs par défaut : celles-ci s'appliquent
 * tant que la table est vide ou absente, et servent de modèle à la migration.
 *
 * Trois types de règles :
 * - « quota » : nombre maximum de désignations par jour / semaine / week-end /
 *   3 jours glissants ;
 * - « tqr-repos » : repos obligatoire après N TQR enchaînés ;
 * - « forbid » : certains arbitres (niveau, âge) ne peuvent pas arbitrer
 *   certaines divisions.
 *
 * Gravité : « bloquant » = la désignation manuelle est refusée ;
 * « avertissement » = elle est enregistrée avec une alerte. Dans les deux cas
 * les suggestions et l'auto-désignation n'en proposent jamais.
 */

export type RuleSeverity = "bloquant" | "avertissement";

export type QuotaParams = {
  period: "day" | "week" | "weekend" | "rolling3";
  max: number;
  /** classiques : hors TQR ; tqr : TQR seulement ; tous : les deux. */
  scope: "classiques" | "tqr" | "tous";
};
export type TqrRestParams = { maxConsecutive: number };
export type ForbidParams = {
  /** L'une OU l'autre condition suffit : niveau d'arbitre listé, ou âge inférieur à `ageUnder`. */
  referee: { levels: string[]; ageUnder: number | null };
  division: { scope: "all" | "seniors" | "u20plus" | "custom"; labels: string[] };
};

type RuleBase = {
  id: string;
  label: string;
  description: string | null;
  severity: RuleSeverity;
  active: boolean;
  /** Règle fournie avec l'application : modifiable et désactivable, mais pas supprimable. */
  builtin: boolean;
  position: number;
};
export type Rule =
  | (RuleBase & { kind: "quota"; params: QuotaParams })
  | (RuleBase & { kind: "tqr-repos"; params: TqrRestParams })
  | (RuleBase & { kind: "forbid"; params: ForbidParams });

export type RuleViolation = { ruleId: string; severity: RuleSeverity; message: string };

export const STAGIAIRE_LEVELS = ["NAT-STG", "FED-STG", "REG-STG", "DEP-STG"];

/** Valeurs par défaut (identiques au jeu de départ inséré par la migration). */
export const DEFAULT_RULES: Rule[] = [
  {
    id: "max-2-jour",
    kind: "quota",
    label: "Maximum 2 matchs par jour",
    description: "Un arbitre ne peut pas siffler plus de 2 matchs au cours d'une même journée (hors TQR).",
    severity: "avertissement",
    active: true,
    builtin: true,
    position: 10,
    params: { period: "day", max: 2, scope: "classiques" },
  },
  {
    id: "max-3-semaine",
    kind: "quota",
    label: "Maximum 3 désignations par semaine",
    description: "Un arbitre ne peut pas être désigné plus de 3 fois du lundi au dimanche (hors TQR).",
    severity: "avertissement",
    active: true,
    builtin: true,
    position: 20,
    params: { period: "week", max: 3, scope: "classiques" },
  },
  {
    id: "max-3-weekend",
    kind: "quota",
    label: "Maximum 3 désignations par week-end",
    description: "Un arbitre ne peut pas être désigné plus de 3 fois sur un même week-end, samedi et dimanche (hors TQR).",
    severity: "avertissement",
    active: true,
    builtin: true,
    position: 30,
    params: { period: "weekend", max: 3, scope: "classiques" },
  },
  {
    id: "max-4-sur-3-jours",
    kind: "quota",
    label: "Maximum 4 rencontres sur 3 jours glissants (FFBB)",
    description:
      "Règlement des officiels 2026-2027, art. 5.7 : pas plus de 4 rencontres sur 3 jours consécutifs, pour des raisons médicales, physiques et de concentration. Seules les rencontres arbitrées sont comptées : les matchs joués par l'arbitre, qui réduisent ce plafond, ne sont pas connus de l'application (hors TQR).",
    severity: "avertissement",
    active: true,
    builtin: true,
    position: 40,
    params: { period: "rolling3", max: 4, scope: "classiques" },
  },
  {
    id: "max-4-jour-tqr",
    kind: "quota",
    label: "Maximum 4 matchs TQR par jour",
    description:
      "Un TQR se jouant en format réduit (2 mi-temps), un arbitre peut en siffler jusqu'à 4 dans la même journée, soit l'équivalent de 2 matchs classiques.",
    severity: "avertissement",
    active: true,
    builtin: true,
    position: 50,
    params: { period: "day", max: 4, scope: "tqr" },
  },
  {
    id: "repos-tqr",
    kind: "tqr-repos",
    label: "Repos après 2 TQR d'affilée",
    description:
      "Après 2 matchs TQR joués sans interruption (dos à dos), un arbitre doit laisser passer au moins un match avant d'en resiffler un autre.",
    severity: "avertissement",
    active: true,
    builtin: true,
    position: 60,
    params: { maxConsecutive: 2 },
  },
  {
    id: "age-15-ans",
    kind: "forbid",
    label: "Âge minimum de 15 ans (FFBB)",
    description:
      "Règlement des officiels 2026-2027, art. 5.6 et annexe 15 : seuls les arbitres de 15 ans révolus peuvent être désignés par le comité. En dessous, ils officient à domicile comme arbitres club. Sans date de naissance, le contrôle ne bloque pas mais est signalé dans Contrôles.",
    severity: "bloquant",
    active: true,
    builtin: true,
    position: 70,
    params: { referee: { levels: [], ageUnder: 15 }, division: { scope: "all", labels: [] } },
  },
  {
    id: "mineur-categorie",
    kind: "forbid",
    label: "Arbitre de 15 ans : pas de match U20/U21 ni senior (FFBB)",
    description:
      "Annexe 15 : un arbitre de 15 ans ne peut pas être désigné sur une rencontre U20, U21 ou senior. Dès 16 ans, ces rencontres lui sont ouvertes, accompagné d'un arbitre majeur.",
    severity: "bloquant",
    active: true,
    builtin: true,
    position: 80,
    params: { referee: { levels: [], ageUnder: 16 }, division: { scope: "u20plus", labels: [] } },
  },
  {
    id: "stagiaire-u16-senior",
    kind: "forbid",
    label: "Stagiaires et moins de 16 ans : pas de match senior",
    description:
      "Un arbitre stagiaire, ou de moins de 16 ans, ne peut pas arbitrer de match senior (règle du CD45).",
    severity: "bloquant",
    active: true,
    builtin: false,
    position: 90,
    params: { referee: { levels: STAGIAIRE_LEVELS, ageUnder: 16 }, division: { scope: "seniors", labels: [] } },
  },
];

/**
 * Règles appliquées ailleurs dans l'application (réglages, niveaux, groupes,
 * disponibilités) : affichées pour information avec le lien où les configurer.
 */
export type SystemRule = { id: string; label: string; description: string; href?: string; hrefLabel?: string };
export const SYSTEM_RULES: SystemRule[] = [
  {
    id: "presence-30-min",
    label: "Présence 30 min avant le match (trajet compris)",
    description:
      "Un arbitre doit être au gymnase au moins 30 minutes avant le début du match. Pour deux matchs le même jour dans des gymnases différents, l'écart entre la fin du premier (durée comptée : 2 h) et le début du second doit couvrir le trajet (estimé à 50 km/h à vol d'oiseau) plus ces 30 minutes, ou 1 h si un des gymnases n'est pas géocodé. Dans le même gymnase, les matchs peuvent s'enchaîner. Le répartiteur peut passer outre après confirmation.",
  },
  {
    id: "mineur-accompagne",
    label: "Mineur : jamais seul, jamais avec un autre mineur",
    description:
      "Règlement des officiels 2026-2027, art. 5.6 : un arbitre mineur ne doit pas officier seul et, pour le CD45, n'est jamais associé à un autre mineur : un mineur est toujours accompagné d'un arbitre majeur.",
  },
  {
    id: "distance-max",
    label: "Distance maximale fixée par le comité",
    description:
      "Si une distance maximale est fixée, un arbitre plus loin du gymnase (par la route quand la distance routière est connue, sinon à vol d'oiseau) n'est ni proposé ni désignable. Un 2e match le même jour dans le même gymnase n'est pas concerné.",
    href: "/reglement#parametres",
    hrefLabel: "Paramètres du comité",
  },
  {
    id: "age-min",
    label: "Âge minimum par division",
    description:
      "Si un âge minimum est fixé pour une division, un arbitre plus jeune à la date du match ne peut pas y être désigné.",
    href: "/admin/niveaux",
    hrefLabel: "Admin > Niveaux",
  },
  {
    id: "disponibilites",
    label: "Disponibilités saisies par l'arbitre",
    description:
      "Sur une période ouverte à la saisie, un arbitre qui a répondu n'est proposé que sur les créneaux qu'il a cochés. Sans réponse, il reste proposé avec une mention, sauf si « Sans réponse = exclu » est activé. L'auto-désignation ne retient que les arbitres qui ont répondu et coché le créneau du match.",
    href: "/disponibilites",
    hrefLabel: "Disponibilités",
  },
  {
    id: "groupes",
    label: "Groupes de désignation",
    description:
      "Une division rattachée à un ou plusieurs groupes n'est ouverte qu'aux arbitres membres de ces groupes. Une division sans groupe reste ouverte à tous.",
    href: "/admin/groupes",
    hrefLabel: "Admin > Groupes",
  },
];

const PERIOD_LABEL: Record<QuotaParams["period"], string> = {
  day: "par jour",
  week: "par semaine",
  weekend: "par week-end",
  rolling3: "sur 3 jours glissants",
};
const SCOPE_LABEL: Record<ForbidParams["division"]["scope"], string> = {
  all: "toutes les divisions",
  seniors: "les matchs seniors",
  u20plus: "les matchs U20, U21 et seniors",
  custom: "les divisions choisies",
};

/** Phrase décrivant une règle, générée depuis ses paramètres (affichée sous le libellé). */
export function describeRule(rule: Rule): string {
  if (rule.kind === "quota") {
    const { period, max, scope } = rule.params;
    const who = scope === "tqr" ? "TQR" : scope === "tous" ? "désignations (TQR compris)" : "désignations (hors TQR)";
    return `Maximum ${max} ${who} ${PERIOD_LABEL[period]}.`;
  }
  if (rule.kind === "tqr-repos") {
    return `Un match de repos obligatoire après ${rule.params.maxConsecutive} TQR enchaînés sans interruption.`;
  }
  const { referee, division } = rule.params;
  const who: string[] = [];
  if (referee.levels.length) who.push(`niveau ${referee.levels.join(", ")}`);
  if (referee.ageUnder != null) who.push(`moins de ${referee.ageUnder} ans`);
  const where = division.scope === "custom" ? division.labels.join(", ") || "aucune division" : SCOPE_LABEL[division.scope];
  return `Interdit aux arbitres (${who.join(" ou ")}) sur ${where}.`;
}

// ---------------------------------------------------------------- moteur ---

const DAY_MS = 86_400_000;

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

/** Nombre de désignations existantes qui, avec la nouvelle, dépasseraient le quota ; null si pas de dépassement. */
function quotaOverflow(
  params: QuotaParams,
  matchDate: Date,
  existing: { date: Date }[]
): { count: number } | null {
  const inRange = (start: Date, end: Date) => existing.filter((e) => e.date >= start && e.date < end).length;
  switch (params.period) {
    case "day": {
      const { start, end } = dayRange(matchDate);
      const count = inRange(start, end);
      return count + 1 > params.max ? { count } : null;
    }
    case "week": {
      const { start, end } = weekRange(matchDate);
      const count = inRange(start, end);
      return count + 1 > params.max ? { count } : null;
    }
    case "weekend": {
      const range = weekendRange(matchDate);
      if (!range) return null;
      const count = inRange(range.start, range.end);
      return count + 1 > params.max ? { count } : null;
    }
    case "rolling3": {
      // Les trois fenêtres de 3 jours consécutifs contenant le jour du match.
      const { start: dayStart } = dayRange(matchDate);
      for (let offset = 0; offset < 3; offset++) {
        const winStart = new Date(dayStart.getTime() - offset * DAY_MS);
        const count = inRange(winStart, new Date(winStart.getTime() + 3 * DAY_MS));
        if (count + 1 > params.max) return { count };
      }
      return null;
    }
  }
}

function quotaMessage(params: QuotaParams, count: number): string {
  const what = params.scope === "tqr" ? "match(s) TQR" : "désignation(s)";
  switch (params.period) {
    case "day":
      return `Cet arbitre a déjà ${count} ${what} ce jour-là (maximum ${params.max}).`;
    case "week":
      return `Cet arbitre a déjà ${count} ${what} cette semaine (maximum ${params.max}).`;
    case "weekend":
      return `Cet arbitre a déjà ${count} ${what} ce week-end (maximum ${params.max}).`;
    case "rolling3":
      return `Cet arbitre a déjà ${count} ${what} sur 3 jours consécutifs autour de cette date (maximum ${params.max} sur 3 jours glissants).`;
  }
}

/**
 * Vérifie les règles de quota et de repos TQR pour une nouvelle désignation
 * d'un arbitre sur `matchDate`/`durationMinutes`, étant donné ses
 * désignations actives existantes (`existing`, hors match en cours de
 * création). Chaque violation porte la gravité de sa règle.
 *
 * `isTqr` : un TQR se joue en tournoi (plusieurs matchs courts le même jour,
 * au même endroit) ; chaque règle précise si elle vise les matchs
 * classiques, les TQR ou les deux.
 */
export function checkQuotaRules(
  matchDate: Date,
  durationMinutes: number,
  existing: { date: Date; durationMinutes: number }[],
  isTqr = false,
  rules: Rule[] = DEFAULT_RULES
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;

    if (rule.kind === "quota") {
      const { scope } = rule.params;
      if ((scope === "classiques" && isTqr) || (scope === "tqr" && !isTqr)) continue;
      const overflow = quotaOverflow(rule.params, matchDate, existing);
      if (overflow) {
        violations.push({ ruleId: rule.id, severity: rule.severity, message: quotaMessage(rule.params, overflow.count) });
      }
      continue;
    }

    if (rule.kind === "tqr-repos" && isTqr) {
      // Repos obligatoire après N TQR d'affilée (sans creux entre eux) : on
      // recherche la plus longue série de matchs qui s'enchaînent sans
      // interruption jusqu'à et y compris celui qu'on tente d'ajouter.
      const { start: dayStart, end: dayEnd } = dayRange(matchDate);
      const dayMatches = existing.filter((e) => e.date >= dayStart && e.date < dayEnd);
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
      if (run > rule.params.maxConsecutive) {
        violations.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: `Cet arbitre vient d'enchaîner ${rule.params.maxConsecutive} matchs TQR sans interruption : il lui faut un match de repos avant de reprendre.`,
        });
      }
    }
  }

  return violations;
}

/** Âge révolu à `date` (dates de match à l'heure du gymnase, lues en UTC). */
function ageOn(birthDate: string | null | undefined, date: Date): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.slice(0, 10).split("-").map(Number);
  let age = date.getUTCFullYear() - y;
  const beforeBirthday = date.getUTCMonth() + 1 < m || (date.getUTCMonth() + 1 === m && date.getUTCDate() < d);
  if (beforeBirthday) age--;
  return age;
}

function divisionMatches(scope: ForbidParams["division"], divisionLabel: string | null | undefined): boolean {
  if (scope.scope === "all") return true;
  const label = (divisionLabel ?? "").trim();
  if (scope.scope === "custom") {
    return scope.labels.some((l) => l.trim().toLowerCase() === label.toLowerCase());
  }
  const category = divisionAgeCategory(label);
  if (category == null) return false;
  return scope.scope === "seniors" ? category >= 99 : category >= 20;
}

/**
 * Règles « interdiction » : l'arbitre (niveau, âge) a-t-il le droit d'arbitrer
 * cette division ? Sans date de naissance, le critère d'âge ne peut pas être
 * évalué : il ne bloque pas (le contrôle « date de naissance manquante »
 * le signale ailleurs).
 */
export function checkRefereeRules(
  rules: Rule[],
  referee: { birthDate: string | null; levelLabel: string | null },
  division: { label: string | null },
  matchDate: Date
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const age = ageOn(referee.birthDate, matchDate);
  for (const rule of rules) {
    if (!rule.active || rule.kind !== "forbid") continue;
    const { referee: who, division: where } = rule.params;
    if (!divisionMatches(where, division.label)) continue;

    const reasons: string[] = [];
    if (referee.levelLabel && who.levels.includes(referee.levelLabel)) reasons.push(`niveau ${referee.levelLabel}`);
    if (who.ageUnder != null && age != null && age < who.ageUnder) reasons.push(`${age} ans`);
    if (reasons.length === 0) continue;

    violations.push({
      ruleId: rule.id,
      severity: rule.severity,
      message: `Règle « ${rule.label} » : arbitre concerné (${reasons.join(", ")}).`,
    });
  }
  return violations;
}

/** Plafond de matchs classiques par jour, utilisé pour estimer le besoin en arbitres par gymnase. */
export const MAX_PER_DAY =
  (DEFAULT_RULES.find((r) => r.id === "max-2-jour")?.params as QuotaParams | undefined)?.max ?? 2;
