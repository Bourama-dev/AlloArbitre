import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FbiDesignationRow } from "./searchDesignations";

export type FbiMismatch = {
  fbiRow: FbiDesignationRow;
  matchId: string | null;
  reason: "etat-different" | "match-introuvable";
  detail: string;
};

type MatchRow = {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  refereesRequired: number;
  designations: { id: string }[];
};

export function parseFbiDateTime(dateStr: string, heureStr: string): Date | null {
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const h = heureStr.match(/^(\d{2}):(\d{2})$/);
  if (!m || !h) return null;
  const [, dd, mm, yyyy] = m;
  const [, hh, min] = h;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
}

function normalize(s: string): string {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/**
 * Vrai si une ligne FBI et un match AlloArbitre désignent la même rencontre
 * (même heure à 5 min près + noms d'équipes compatibles, en tolérant les
 * troncatures FBI type "SAINT DENIS DE L'HOTEL..."). Utilisé dans les deux
 * sens : FBI → AlloArbitre (comparaison en lecture) et AlloArbitre → FBI
 * (résolution de l'idRencontre avant un push).
 */
export function matchesFbiRow(
  fbiRow: FbiDesignationRow,
  match: { date: string | Date; homeTeam: string; awayTeam: string }
): boolean {
  const fbiDate = parseFbiDateTime(fbiRow.date, fbiRow.heure);
  if (!fbiDate) return false;
  const sameTime = Math.abs(new Date(match.date).getTime() - fbiDate.getTime()) < 5 * 60 * 1000;
  if (!sameTime) return false;

  const home = normalize(fbiRow.equipe1.replace(/\.{3}$/, ""));
  const away = normalize(fbiRow.equipe2.replace(/\.{3}$/, ""));
  const mHome = normalize(match.homeTeam);
  const mAway = normalize(match.awayTeam);
  const homeMatches = mHome.startsWith(home) || home.startsWith(mHome);
  const awayMatches = mAway.startsWith(away) || away.startsWith(mAway);
  return homeMatches && awayMatches;
}

/**
 * Rapproche les lignes FBI des matchs AlloArbitre (par date/heure + noms
 * d'équipes, en tolérant les troncatures FBI type "SAINT DENIS DE L'HOTEL...")
 * et signale les écarts d'état (Complète/Incomplète) entre les deux systèmes.
 */
export async function compareWithAlloArbitre(rows: FbiDesignationRow[]): Promise<FbiMismatch[]> {
  if (rows.length === 0) return [];

  const dates = rows
    .map((r) => parseFbiDateTime(r.date, r.heure))
    .filter((d): d is Date => d !== null);
  if (dates.length === 0) return [];

  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())) - 60 * 60 * 1000);
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())) + 60 * 60 * 1000);

  const { data, error } = await supabaseAdmin
    .from("Match")
    .select("id, date, homeTeam, awayTeam, venue, refereesRequired, designations:Designation(id)")
    .gte("date", minDate.toISOString())
    .lte("date", maxDate.toISOString())
    .eq("cancelled", false);
  if (error) throw error;

  const matches = (data ?? []) as unknown as MatchRow[];
  const mismatches: FbiMismatch[] = [];

  for (const row of rows) {
    const fbiDate = parseFbiDateTime(row.date, row.heure);
    if (!fbiDate) continue;

    const candidate = matches.find((m) => matchesFbiRow(row, m));

    if (!candidate) {
      mismatches.push({
        fbiRow: row,
        matchId: null,
        reason: "match-introuvable",
        detail: `Aucun match AlloArbitre trouvé pour ${row.equipe1} - ${row.equipe2} le ${row.date} ${row.heure}`,
      });
      continue;
    }

    const isCompleteInAlloArbitre = candidate.designations.length >= candidate.refereesRequired;
    const isCompleteInFbi = row.etat === "Complète";

    if (isCompleteInAlloArbitre !== isCompleteInFbi) {
      mismatches.push({
        fbiRow: row,
        matchId: candidate.id,
        reason: "etat-different",
        detail: `FBI dit "${row.etat}" mais AlloArbitre a ${candidate.designations.length}/${candidate.refereesRequired} désignation(s)`,
      });
    }
  }

  return mismatches;
}
