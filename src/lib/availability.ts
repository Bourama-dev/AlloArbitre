/**
 * Disponibilités saisies par les arbitres dans leur espace (/espace), par
 * campagne (AvailabilityPeriod : un week-end, une semaine...) close à une
 * date limite. Un arbitre coche les créneaux où il est disponible :
 * matin (avant 12 h), début d'après-midi (12 h - 15 h), fin d'après-midi
 * (15 h - 18 h), soir (à partir de 18 h). Un match est rattaché au créneau
 * de son heure de début.
 *
 * Effet sur la désignation, pour un match couvert par une campagne :
 * - l'arbitre a répondu : il n'est proposé que sur les créneaux cochés ;
 * - il n'a pas répondu : simple mention, sauf si le comité a activé
 *   « Sans réponse = exclu » (Admin > Paramètres) et que la saisie est close.
 * Les indisponibilités ponctuelles/récurrentes restent appliquées en plus.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";

export const SLOTS = [
  { id: "matin", label: "Matin", short: "M", hint: "avant 12 h" },
  { id: "debut-apres-midi", label: "Début d'après-midi", short: "A1", hint: "12 h - 15 h" },
  { id: "fin-apres-midi", label: "Fin d'après-midi", short: "A2", hint: "15 h - 18 h" },
  { id: "soir", label: "Soir", short: "S", hint: "à partir de 18 h" },
] as const;
export type SlotId = (typeof SLOTS)[number]["id"];

export function slotLabel(id: string): string {
  return SLOTS.find((s) => s.id === id)?.label ?? id;
}

/** Créneau d'un match (dates stockées à l'heure du gymnase, lues en UTC). */
export function slotOfMatch(date: Date): SlotId {
  const h = date.getUTCHours();
  if (h < 12) return "matin";
  if (h < 15) return "debut-apres-midi";
  if (h < 18) return "fin-apres-midi";
  return "soir";
}

/** Jours "YYYY-MM-DD" de startDate à endDate inclus. */
export function daysBetween(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  const d = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (d <= end && out.length < 62) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function formatDayFr(day: string): string {
  const s = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`)
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const PARIS = "Europe/Paris";

/** "2026-10-02T20:00" saisi à l'heure de Paris -> instant UTC. */
export function parisLocalToDate(local: string): Date {
  const asUtc = new Date(`${local}:00Z`);
  // Décalage de Paris à cet instant (1 h ou 2 h), deux passes pour les changements d'heure.
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: PARIS,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(guess);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
    const shownAsUtc = new Date(`${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:00Z`);
    guess = new Date(guess.getTime() + (asUtc.getTime() - shownAsUtc.getTime()));
  }
  return guess;
}

/** Instant -> "2026-10-02T20:00" à l'heure de Paris (valeur d'un <input type="datetime-local">). */
export function dateToParisLocal(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function formatDeadlineFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS,
  }).format(date);
}

export type AvailabilityPeriod = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  deadline: Date;
};

export function mapPeriod(row: Record<string, unknown>): AvailabilityPeriod {
  return {
    id: row.id as string,
    label: row.label as string,
    startDate: row.startDate as string,
    endDate: row.endDate as string,
    deadline: new Date(row.deadline as string),
  };
}

export const PERIOD_SELECT = "id, label, startDate, endDate, deadline";

export type AvailabilityVerdict = {
  /** Raison bloquante, ou null. */
  block: string | null;
  /** Mention non bloquante (explication), ou null. */
  note: string | null;
};

export type AvailabilityIndex = {
  verdict(refereeId: string, matchDate: Date): AvailabilityVerdict;
};

const NO_EFFECT: AvailabilityVerdict = { block: null, note: null };

/**
 * Charge les campagnes qui recouvrent [fromDay, toDay] avec réponses et
 * créneaux, pour juger n'importe quel (arbitre, match) de cet intervalle.
 */
export async function loadAvailabilityIndex(
  fromDay: string,
  toDay: string,
  requireAvailability: boolean
): Promise<AvailabilityIndex> {
  const { data: periodRows, error } = await supabaseAdmin
    .from("AvailabilityPeriod")
    .select(PERIOD_SELECT)
    .lte("startDate", toDay)
    .gte("endDate", fromDay);
  if (error) throw error;
  const periods = (periodRows ?? []).map((r) => mapPeriod(r as Record<string, unknown>));
  if (periods.length === 0) return { verdict: () => NO_EFFECT };

  const ids = periods.map((p) => p.id);
  const [{ data: responses, error: rError }, { data: slots, error: sError }] = await Promise.all([
    supabaseAdmin.from("AvailabilityResponse").select("periodId, refereeId").in("periodId", ids),
    supabaseAdmin
      .from("AvailabilitySlot")
      .select("periodId, refereeId, day, slot")
      .in("periodId", ids)
      .gte("day", fromDay)
      .lte("day", toDay),
  ]);
  if (rError) throw rError;
  if (sError) throw sError;

  const responded = new Set((responses ?? []).map((r) => `${r.periodId}|${r.refereeId}`));
  const available = new Set((slots ?? []).map((s) => `${s.periodId}|${s.refereeId}|${s.day}|${s.slot}`));
  const now = Date.now();

  return {
    verdict(refereeId, matchDate) {
      const day = matchDate.toISOString().slice(0, 10);
      const covering = periods.filter((p) => p.startDate <= day && day <= p.endDate);
      if (covering.length === 0) return NO_EFFECT;
      const slot = slotOfMatch(matchDate);
      const answered = covering.filter((p) => responded.has(`${p.id}|${refereeId}`));
      if (answered.length > 0) {
        const ok = answered.some((p) => available.has(`${p.id}|${refereeId}|${day}|${slot}`));
        return ok
          ? { block: null, note: `S'est déclaré disponible (${formatDayFr(day)}, ${slotLabel(slot).toLowerCase()})` }
          : { block: `Non disponible sur le créneau « ${slotLabel(slot)} » (disponibilités saisies)`, note: null };
      }
      const closed = covering.some((p) => p.deadline.getTime() <= now);
      if (requireAvailability && closed) {
        return { block: "N'a pas saisi ses disponibilités (saisie close)", note: null };
      }
      return { block: null, note: "N'a pas (encore) saisi ses disponibilités pour cette période" };
    },
  };
}
