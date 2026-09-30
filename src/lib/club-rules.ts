/**
 * Règle CD45 : un arbitre ne peut pas arbitrer une rencontre de son propre
 * club, à domicile comme à l'extérieur.
 *
 * Le club de l'arbitre est le champ `zone` (libellé complet, ex. "CHECY
 * JEUNESSE SPORTIVE") ; les équipes viennent de FBI, tronquées à 22
 * caractères et suffixées ("CHECY JEUNESSE SPORTIV", "USM OLIVET - 2 (3)").
 * Comparaison par préfixe après nettoyage. Pour les inter-équipes de CTC
 * ("IE - CTC BLT45 - BOIGN"), chaque club nommé dans l'équipe est testé ;
 * le club porteur d'une CTC désignée par son seul sigle ("IE - CTC BLT45")
 * n'est pas identifiable ici - le contrôle de neutralité FBI prend le relais
 * à l'envoi.
 */

// Segment d'équipe trop court (ex. "SAI" dans "IE - CTC NECOTIN - SAI") :
// trop ambigu pour conclure.
const MIN_SEGMENT_LENGTH = 5;

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/** Noms de club candidats portés par un libellé d'équipe FBI. */
function teamClubSegments(team: string): string[] {
  const cleaned = team
    .replace(/\(\d+\)\s*$/, "") // "(1)" : numéro de poule/équipe
    .replace(/\s-\s*\d*\s*$/, "") // " - 2" ou " -" final
    .trim();
  const isInterEquipe = /^IE\s*-/i.test(cleaned);
  const segments = isInterEquipe
    ? cleaned
        .replace(/^IE\s*-\s*/i, "")
        .split(/\s-\s/)
        .map((s) => s.replace(/^CTC\s+/i, ""))
    : [cleaned];
  return segments.map(normalize).filter((s) => s.length >= MIN_SEGMENT_LENGTH);
}

/**
 * Équipe du match appartenant au club de l'arbitre, ou null. `club` vide
 * (club non renseigné) : aucune restriction connue.
 */
export function refereeOwnClubTeam(
  club: string | null | undefined,
  homeTeam: string,
  awayTeam: string
): string | null {
  const c = normalize(club ?? "");
  if (c.length < MIN_SEGMENT_LENGTH) return null;
  for (const team of [homeTeam, awayTeam]) {
    if (teamClubSegments(team).some((seg) => c.startsWith(seg) || seg.startsWith(c))) return team;
  }
  return null;
}

export function ownClubMessage(team: string): string {
  return `Licencié au club de l'équipe ${team} : ne peut pas arbitrer son club (domicile ou extérieur).`;
}
