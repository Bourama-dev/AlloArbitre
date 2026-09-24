import { distanceKm } from "./geocoding";

/** Semaine ISO (lundi -> dimanche) contenant `date`. */
export function weekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = dimanche
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDateTimeFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Formatte une date SQL "YYYY-MM-DD" (sans heure) en "JJ/MM/AAAA", sans décalage de fuseau. */
export function formatDateOnlyFr(dateStr: string | null): string {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Deux créneaux se chevauchent-ils (même arbitre, matchs qui se recouvrent dans le temps) ? */
export function overlaps(
  aStart: Date,
  aDurationMinutes: number,
  bStart: Date,
  bDurationMinutes: number
): boolean {
  const aEnd = new Date(aStart.getTime() + aDurationMinutes * 60_000);
  const bEnd = new Date(bStart.getTime() + bDurationMinutes * 60_000);
  return aStart < bEnd && bStart < aEnd;
}

// Vitesse moyenne prudente pour estimer un trajet inter-gymnases sur des
// routes de département (pas d'autoroute directe entre la plupart des
// communes du Loiret) + tampon fixe pour se garer, se changer et s'échauffer
// à l'arrivée.
const AVERAGE_TRAVEL_SPEED_KMH = 50;
const ARRIVAL_BUFFER_MINUTES = 15;
// Deux lieux différents mais dont on ne connaît pas les coordonnées (adresse
// non géocodée) : on ne peut pas mesurer le trajet, donc on applique un
// tampon prudent par défaut plutôt que de ne rien vérifier.
const UNKNOWN_VENUE_BUFFER_MINUTES = 45;

export type MatchSlot = {
  date: Date;
  durationMinutes: number;
  /** Nom du gymnase, pour détecter que deux matchs sont au même endroit même sans coordonnées. */
  venue?: string | null;
  lat?: number | null;
  lng?: number | null;
};

/**
 * Vrai si un même arbitre ne peut pas couvrir ces deux matchs : soit ils se
 * chevauchent dans le temps, soit ils sont dans des gymnases différents et
 * l'écart entre la fin de l'un et le début de l'autre ne laisse pas assez de
 * temps pour s'y rendre (distance à vol d'oiseau / vitesse moyenne + tampon
 * d'arrivée ; tampon prudent par défaut si les gymnases ne sont pas
 * géocodés). Deux matchs au même gymnase, dos à dos, ne sont jamais un
 * conflit de trajet (seul le chevauchement direct compte).
 */
export function hasSchedulingConflict(a: MatchSlot, b: MatchSlot): boolean {
  if (overlaps(a.date, a.durationMinutes, b.date, b.durationMinutes)) return true;

  const sameVenue =
    !!a.venue && !!b.venue && a.venue.trim().toLowerCase() === b.venue.trim().toLowerCase();
  if (sameVenue) return false;

  const aEnd = a.date.getTime() + a.durationMinutes * 60_000;
  const bEnd = b.date.getTime() + b.durationMinutes * 60_000;
  const gapMinutes = Math.max(a.date.getTime() - bEnd, b.date.getTime() - aEnd) / 60_000;

  let requiredMinutes = UNKNOWN_VENUE_BUFFER_MINUTES;
  if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
    const km = distanceKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
    requiredMinutes = Math.ceil((km / AVERAGE_TRAVEL_SPEED_KMH) * 60) + ARRIVAL_BUFFER_MINUTES;
  }

  return gapMinutes < requiredMinutes;
}
