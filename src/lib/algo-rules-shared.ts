/**
 * Catégorie d'âge d'une division d'après son libellé : « U15 », « RMU18 »,
 * « TQR1_U15M » -> 15 ; U20/U21 -> 20/21 ; seniors -> 99 (« Seniors D1 »,
 * PRM/PRF, PNM/PNF, DM2..., RM2/RF2, AMIRM, NAT3A...). Libellé non reconnu ->
 * null (aucun contrôle de catégorie). Fichier sans dépendance serveur.
 */
export function divisionAgeCategory(label: string | null | undefined): number | null {
  if (!label) return null;
  const l = label.trim().toUpperCase();
  const u = l.match(/U(\d{1,2})(?!\d)/);
  if (u) return Number(u[1]);
  if (/SENIOR|^(PR|PN|DM|DF|RM|RF|AMI|NAT|HN|NM|NF)/.test(l)) return 99;
  return null;
}
