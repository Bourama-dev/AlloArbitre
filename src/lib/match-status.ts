export type MatchStatus = "incomplet" | "complet" | "annule";

/** Pure, sans dépendance serveur - importable depuis un composant client (voir matches-table.tsx). */
export function matchStatus(match: {
  cancelled: boolean;
  refereesRequired: number;
  designations: unknown[];
}): MatchStatus {
  if (match.cancelled) return "annule";
  return match.designations.length >= match.refereesRequired ? "complet" : "incomplet";
}
