import { FbiClient, type FbiDump } from "./client";
import { searchDesignations, type FbiDesignationRow } from "./searchDesignations";

/**
 * Espaces / retours à la ligne ou guillemets englobants collés par erreur
 * dans les settings Vercel font échouer le login FBI. On ne retire les
 * guillemets que s'ils entourent toute la valeur (un mot de passe peut
 * légitimement commencer ou finir par un guillemet).
 */
function cleanCredential(value: string | undefined): string {
  const v = (value ?? "").trim();
  return /^(['"])[\s\S]*\1$/.test(v) && v.length >= 2 ? v.slice(1, -1) : v;
}

export function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });
}

/** "DD/MM/YYYY" + "HH:mm" → clé triable "YYYY-MM-DD HH:mm". */
export function fbiSortKey(row: Pick<FbiDesignationRow, "date" | "heure">): string {
  const [dd, mm, yyyy] = row.date.split("/");
  return `${yyyy}-${mm}-${dd} ${row.heure}`;
}

/**
 * Se connecte à FBI avec FBI_USERNAME / FBI_PASSWORD et renvoie les
 * rencontres de la période, triées par date/heure. Appel en direct à chaque
 * fois : rien n'est enregistré côté AlloArbitre.
 */
export async function fetchFbiRencontres(
  periode: { du: Date; au: Date },
  onDump?: (dump: FbiDump) => Promise<void>
): Promise<FbiDesignationRow[]> {
  const identifiant = cleanCredential(process.env.FBI_USERNAME);
  const motDePasse = cleanCredential(process.env.FBI_PASSWORD);
  if (!identifiant || !motDePasse) {
    throw new Error("FBI_USERNAME / FBI_PASSWORD non configurés");
  }

  const client = new FbiClient(onDump);
  await client.login(identifiant, motDePasse);

  const rows = await searchDesignations(client, {
    dateDebut: formatDateFr(periode.du),
    dateFin: formatDateFr(periode.au),
  });

  return rows.sort((a, b) => fbiSortKey(a).localeCompare(fbiSortKey(b)));
}
