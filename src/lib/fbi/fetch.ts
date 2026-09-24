import { FbiClient, type FbiDump } from "./client";
import { searchDesignations, type FbiDesignationRow } from "./searchDesignations";
import {
  formDesignationFields,
  parseOfficiels,
  parseRencontreInfos,
  type FbiRencontreDetail,
} from "./detail";

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

export async function loggedInClient(onDump?: (dump: FbiDump) => Promise<void>): Promise<FbiClient> {
  const identifiant = cleanCredential(process.env.FBI_USERNAME);
  const motDePasse = cleanCredential(process.env.FBI_PASSWORD);
  if (!identifiant || !motDePasse) {
    throw new Error("FBI_USERNAME / FBI_PASSWORD non configurés");
  }
  const client = new FbiClient(onDump);
  await client.login(identifiant, motDePasse);
  return client;
}

/**
 * Session FBI partagée (par instance de fonction Vercel) : au lieu d'une
 * connexion à chaque action (fiche dépliée, push, import...), la même
 * session est réutilisée tant qu'elle a servi récemment - moins d'appels à
 * FBI, et plus rapide.
 *
 * Une seule opération à la fois par session : les pages FBI gardent un état
 * côté serveur (fiche ouverte, recherche en cours), deux opérations
 * entremêlées pourraient se mélanger - dangereux pour une écriture. Si la
 * session partagée est occupée, l'opération ouvre sa propre session
 * temporaire au lieu d'attendre. Une session inactive depuis plus de SESSION_IDLE_MS, ou trop
 * ancienne, est remplacée par une nouvelle connexion (FBI les fait expirer) ;
 * une erreur "session non connectée" l'invalide aussi.
 *
 * Avec onDump (mode ?debug=1), toujours une session neuve et dédiée.
 */
const SESSION_IDLE_MS = 5 * 60_000;
const SESSION_MAX_AGE_MS = 20 * 60_000;
let shared: { client: FbiClient; createdAt: number; lastUsedAt: number } | null = null;
let busy = false;

export async function withFbiSession<T>(
  fn: (client: FbiClient) => Promise<T>,
  onDump?: (dump: FbiDump) => Promise<void>
): Promise<T> {
  if (onDump) return fn(await loggedInClient(onDump));

  // Session partagée déjà occupée par une autre opération : plutôt que
  // d'attendre son tour (plusieurs clics "Pousser vers FBI" à la suite
  // s'empilaient et dépassaient la minute -> HTTP 504), cette opération
  // prend sa propre session, jetée ensuite.
  if (busy) return fn(await loggedInClient());

  busy = true;
  try {
    const now = Date.now();
    if (!shared || now - shared.lastUsedAt > SESSION_IDLE_MS || now - shared.createdAt > SESSION_MAX_AGE_MS) {
      shared = { client: await loggedInClient(), createdAt: now, lastUsedAt: now };
    }
    const session = shared;
    try {
      return await fn(session.client);
    } catch (error) {
      // Session expirée côté FBI (ou état incertain) : la prochaine opération se reconnecte.
      // Idem après une coupure réseau persistante (connexion peut-être morte).
      if (error instanceof Error && /session non connectée|fetch failed|timeout|aborted/i.test(error.message)) shared = null;
      throw error;
    } finally {
      if (shared === session) session.lastUsedAt = Date.now();
    }
  } finally {
    busy = false;
  }
}

/**
 * Fiche détail d'une rencontre (infos + officiels désignés), en direct :
 * mêmes requêtes que FBI quand on clique une ligne du tableau de recherche.
 */
export async function fetchFbiDesignationDetail(
  idRencontre: string,
  onDump?: (dump: FbiDump) => Promise<void>
): Promise<FbiRencontreDetail> {
  if (!/^\d+$/.test(idRencontre)) throw new Error("Identifiant de rencontre FBI invalide");
  return withFbiSession(async (client) => {
    // La fiche est servie dans le contexte de la page de recherche : on la charge d'abord.
    await client.get("rechercherDesignation.fbi");
    const ficheHtml = await client.post(`afficherRepartitionDesignationAjax.fbi?idRencontre=${idRencontre}`, {});
    const officielsHtml = await client.post(
      `afficherRepartitionDesignationOfficielAjax.fbi?idRencontre=${idRencontre}`,
      formDesignationFields(ficheHtml)
    );
    return { infos: parseRencontreInfos(ficheHtml), officiels: parseOfficiels(officielsHtml) };
  }, onDump);
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
  const rows = await withFbiSession(
    (client) =>
      searchDesignations(client, {
        dateDebut: formatDateFr(periode.du),
        dateFin: formatDateFr(periode.au),
      }),
    onDump
  );

  return rows.sort((a, b) => fbiSortKey(a).localeCompare(fbiSortKey(b)));
}
