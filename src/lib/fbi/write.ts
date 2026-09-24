import { FbiClient } from "./client";
import { formDesignationFields, parseOfficielRowsRaw } from "./detail";
import {
  fetchDesignationsExportRows,
  searchDesignations,
  type FbiDesignationRow,
  type FbiExportRow,
} from "./searchDesignations";
import { parseFbiDateTime } from "./sync";
import { overlaps } from "@/lib/dates";
import { matchDurationMinutes } from "@/lib/import-matches";

// FBI ne donne pas les coordonnées des salles (juste leur nom) : pas de
// calcul de trajet précis possible ici, contrairement à hasSchedulingConflict
// côté AlloArbitre. Un tampon fixe prudent s'applique dès que la salle
// diffère, plutôt que de ne considérer que le chevauchement strict.
const FBI_UNKNOWN_VENUE_BUFFER_MINUTES = 45;

const OFFICIEL_FIELD_ORDER = [
  "idOfficielRencontre",
  "nom",
  "prenom",
  "fonction",
  "idFonction",
  "ordre",
  "numeroNational",
  "kilometres",
  "kilometresCalcules",
  "indemnites",
  "indemnitesCalculees",
  "idPresence",
  "blSaisieClub",
  "polyline",
  "distance",
] as const;

const ID_FONCTION_ARBITRE = "-2";
const LABEL_ARBITRE = "Arbitre";
const PRESENCE_PREVUE = "P";

export type FbiAssignResult = {
  dryRun: boolean;
  idRencontre: string;
  position: number;
  referee: { nom: string; prenom: string; numeroNational: string };
  /** Corps exact (application/x-www-form-urlencoded) qui a été (ou aurait été) envoyé à FBI. */
  payload: string;
};

/**
 * Recharge l'état courant du formulaire de désignation FBI pour une
 * rencontre (mêmes deux appels que la fiche /fbi/[id] en lecture), en gardant
 * cette fois les champs bruts de chaque ligne d'officiel (nécessaires pour
 * les renvoyer inchangés lors de l'enregistrement).
 */
async function loadFicheState(client: FbiClient, idRencontre: string) {
  await client.get("rechercherDesignation.fbi");
  const ficheHtml = await client.post(`afficherRepartitionDesignationAjax.fbi?idRencontre=${idRencontre}`, {});
  const ficheFields = formDesignationFields(ficheHtml);
  const officielsHtml = await client.post(
    `afficherRepartitionDesignationOfficielAjax.fbi?idRencontre=${idRencontre}`,
    ficheFields
  );
  const rows = parseOfficielRowsRaw(officielsHtml);
  return { ficheFields, rows };
}

// Données FBI d'une journée (recherche + export), chargées une seule fois par
// client FBI - donc par appel de la route : les deux positions d'un match,
// puis tous les matchs du même jour d'un "Tout pousser", les réutilisent.
type DayData = { rows: FbiDesignationRow[]; exportRows: FbiExportRow[] };
const dayCache = new WeakMap<FbiClient, Map<string, Promise<DayData>>>();

function loadDay(client: FbiClient, dateFr: string): Promise<DayData> {
  let byDate = dayCache.get(client);
  if (!byDate) dayCache.set(client, (byDate = new Map()));
  let day = byDate.get(dateFr);
  if (!day) {
    const params = { dateDebut: dateFr, dateFin: dateFr };
    day = (async () => ({
      rows: await searchDesignations(client, params),
      exportRows: await fetchDesignationsExportRows(client, params),
    }))();
    byDate.set(dateFr, day);
  }
  return day;
}

function normName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]+/g, " ")
    .trim();
}

/**
 * Cherche si cet arbitre est déjà désigné sur FBI, ce jour-là, sur une autre
 * rencontre incompatible avec l'horaire ciblé - soit un chevauchement direct,
 * soit (salle différente) un écart trop court pour s'y rendre - un conflit
 * qui peut exister côté FBI (désigné directement là-bas) sans qu'aucune
 * désignation AlloArbitre ne le révèle.
 *
 * Toutes les désignations du jour viennent de l'export FBI (une requête)
 * plutôt que de la fiche de chaque rencontre : ouvrir une fiche par rencontre
 * incompatible (des dizaines un dimanche, x2 positions) dépassait la minute
 * de la fonction Vercel. L'export ne donne pas la licence : comparaison sur
 * nom + prénom (ceux renvoyés par FBI pour ce numéro national).
 */
async function findFbiScheduleConflict(
  client: FbiClient,
  idRencontre: string,
  dateFr: string,
  referee: { nom: string; prenom: string }
): Promise<{ equipe1: string; equipe2: string; heure: string } | null> {
  const { rows, exportRows } = await loadDay(client, dateFr);
  const target = rows.find((r) => r.idRencontre === idRencontre);
  const targetStart = target ? parseFbiDateTime(target.date, target.heure) : null;
  if (!target || !targetStart) return null;
  const targetDuration = matchDurationMinutes(target.code);
  const targetEnd = targetStart.getTime() + targetDuration * 60_000;
  const who = `${normName(referee.nom)}|${normName(referee.prenom)}`;

  for (const row of exportRows) {
    if (row.code === target.code && row.numero === target.numero) continue;
    if (!row.officiels.some((o) => `${normName(o.nom)}|${normName(o.prenom)}` === who)) continue;

    const rowStart = parseFbiDateTime(row.date, row.heure);
    if (!rowStart) continue;
    const rowDuration = matchDurationMinutes(row.code);
    const rowEnd = rowStart.getTime() + rowDuration * 60_000;

    // Salle du tableau FBI tronquée ("GYMNASE MARIE-AMELIE L..."), complète
    // dans l'export : même salle si le nom complet commence par le tronqué.
    const targetSalle = target.salle.trim().toLowerCase().replace(/\.{3}$/, "");
    const sameSalle = !!targetSalle && row.salle.trim().toLowerCase().startsWith(targetSalle);
    const isConflict = overlaps(targetStart, targetDuration, rowStart, rowDuration)
      ? true
      : sameSalle
        ? false // même salle, dos à dos : pas de trajet à prévoir
        : Math.max(targetStart.getTime() - rowEnd, rowStart.getTime() - targetEnd) / 60_000 <
          FBI_UNKNOWN_VENUE_BUFFER_MINUTES;
    if (isConflict) return { equipe1: row.equipe1, equipe2: row.equipe2, heure: row.heure };
  }
  return null;
}

/**
 * Désigne un arbitre (par son numéro national FFBB) à une position donnée
 * (1 ou 2, "Ordre" côté FBI) sur une rencontre FBI. Ne touche qu'à la ligne
 * ciblée : FBI attend l'état complet du formulaire à chaque enregistrement,
 * donc les autres lignes sont renvoyées telles quelles, verbatim.
 *
 * La ligne pour cette position doit déjà exister (vide) sur FBI - FBI
 * pré-crée une ligne par arbitre requis dès l'ouverture de la fiche, sans
 * avoir besoin de cliquer "AJOUTER" (vérifié sur une rencontre 1/2 puis 0/2).
 * Si la position est déjà occupée par quelqu'un d'autre, on refuse plutôt
 * que d'écraser une désignation existante.
 *
 * `dryRun` (par défaut true) : construit et renvoie le payload exact sans
 * l'envoyer à FBI, pour relecture avant un premier envoi réel.
 */
export async function assignRefereeToFbiRencontre(
  client: FbiClient,
  idRencontre: string,
  params: { position: number; numeroNational: string; dryRun?: boolean }
): Promise<FbiAssignResult> {
  const dryRun = params.dryRun ?? true;
  const numeroNational = params.numeroNational.trim();
  if (!numeroNational) throw new Error("Numéro national manquant");

  const { ficheFields, rows } = await loadFicheState(client, idRencontre);

  const targetRow = rows.find((r) => r.ordre === String(params.position));
  if (!targetRow) {
    throw new Error(
      `Aucune ligne "Ordre ${params.position}" sur la fiche FBI de la rencontre ${idRencontre} (${rows.length} ligne(s) trouvée(s))`
    );
  }
  if (targetRow.nom || targetRow.numeroNational) {
    throw new Error(
      `Position ${params.position} déjà occupée sur FBI par ${targetRow.prenom} ${targetRow.nom} (licence ${targetRow.numeroNational || "?"}) - désignation non modifiée`
    );
  }

  const dateRencontre = ficheFields["repartitionDesignationForm.repartitionDesignationRencontreBean.date"] ?? "";

  // Résout nom/prénom depuis le numéro national (comme FBI le fait quand on
  // saisit la licence à la main). Réponse: "0;NOM;PRENOM;licence;...".
  // Avant le contrôle de conflit, qui compare sur nom + prénom.
  const lookup = await client.post(
    `afficherNomPrenomOfficiel.fbi?numeroTmpOfficiel=${encodeURIComponent(numeroNational)}&idFonction=${ID_FONCTION_ARBITRE}&nomFonction=${encodeURIComponent(LABEL_ARBITRE)}&dateRencontre=${encodeURIComponent(dateRencontre)}&rencontreId=${idRencontre}`,
    {}
  );
  const [lookupStatus, nom, prenom] = lookup.split(";");
  if (lookupStatus !== "0" || !nom) {
    throw new Error(`FBI ne reconnaît pas le numéro national ${numeroNational} (réponse : ${lookup})`);
  }

  if (dateRencontre) {
    const conflict = await findFbiScheduleConflict(client, idRencontre, dateRencontre, { nom, prenom });
    if (conflict) {
      throw new Error(
        `Conflit d'horaire sur FBI : cet arbitre est déjà désigné à ${conflict.heure} sur ${conflict.equipe1} - ${conflict.equipe2}`
      );
    }
  }

  // Calcule kilomètres / indemnité comme le fait le bouton "CALCULER".
  // Réponse: "0;kilometres;indemnites;licence;polyline;distance".
  const recalc = await client.post(
    `recalculerIndemniteDesignationAjax.fbi?idLicence=${encodeURIComponent(numeroNational)}&idFonction=${ID_FONCTION_ARBITRE}&kilometre=&couple=false&idRencontre=${idRencontre}&here=true&idOfficielRencontre=${targetRow.idOfficielRencontre}`,
    {}
  );
  const [recalcStatus, kilometres, indemnites, , polyline, distance] = recalc.split(";");
  if (recalcStatus !== "0") {
    throw new Error(`Échec du calcul d'indemnité FBI pour ${numeroNational} (réponse : ${recalc})`);
  }

  const updatedRow: Record<string, string> = {
    ...targetRow,
    nom,
    prenom,
    fonction: LABEL_ARBITRE,
    idFonction: ID_FONCTION_ARBITRE,
    idFonctionValue: ID_FONCTION_ARBITRE,
    numeroNational,
    kilometres: kilometres ?? "",
    kilometresCalcules: kilometres ?? "",
    indemnites: indemnites ?? "",
    indemnitesCalculees: indemnites ?? "",
    idPresence: targetRow.idPresenceValue || PRESENCE_PREVUE,
    idPresenceValue: targetRow.idPresenceValue || PRESENCE_PREVUE,
    polyline: polyline ?? "",
    distance: distance ?? "",
  };

  const finalRows = rows.map((r) => (r._index === targetRow._index ? updatedRow : r));

  // idFonction / idPresence / blSaisieClub sont rendus par des <select> côté
  // FBI : le champ "brut" porte le libellé affiché (ex. "Arbitre",
  // "Présent", "Non club"), le code technique attendu par l'enregistrement
  // (-2, P, 0...) est dans "<champ>Value". Sans ça, FBI reçoit le libellé
  // au lieu du code et la ligne (y compris une ligne déjà validée qu'on ne
  // voulait pas toucher) part corrompue.
  const resolve = (row: Record<string, string>, key: string) => row[`${key}Value`] ?? row[key] ?? "";

  const body = new URLSearchParams();
  for (const [name, value] of Object.entries(ficheFields)) body.append(name, value);
  finalRows.forEach((row, i) => {
    for (const key of OFFICIEL_FIELD_ORDER) {
      body.append(`repartitionDesignationForm.repartitionDesignationOfficielBeans[${i}].${key}`, resolve(row, key));
    }
  });

  const payload = body.toString();

  if (!dryRun) {
    await client.post(`enregistrerRepartitionDesignation.fbi?avecHistorisation=true`, Object.fromEntries(body));
  }

  return {
    dryRun,
    idRencontre,
    position: params.position,
    referee: { nom, prenom, numeroNational },
    payload,
  };
}
