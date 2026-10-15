/**
 * Comparaison des noms d'équipes (import de matchs) : insensible à la casse, aux
 * accents et aux troncatures ("SAINT DENIS DE L'HOTEL..."), et au suffixe
 * « (n) » renuméroté d'un jour à l'autre ("USM OLIVET - 2 (3)" = "USM OLIVET - 2 (1)").
 * Le numéro d'équipe avant ("- 2") reste discriminant : "USM OLIVET - 1" et
 * "USM OLIVET - 2" sont deux équipes différentes.
 */
export function normalize(s: string): string {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

export function teamNamesMatchLoose(a: string, b: string): boolean {
  const key = (s: string) => normalize(s.replace(/\.{3}$/, "").replace(/\(\s*\d+\s*\)\s*$/, ""));
  const ka = key(a);
  const kb = key(b);
  return !!ka && !!kb && (ka.startsWith(kb) || kb.startsWith(ka));
}
