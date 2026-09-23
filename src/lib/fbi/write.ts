import { FbiClient } from "./client";
import { formDesignationFields, parseOfficielRowsRaw } from "./detail";

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
  const lookup = await client.post(
    `afficherNomPrenomOfficiel.fbi?numeroTmpOfficiel=${encodeURIComponent(numeroNational)}&idFonction=${ID_FONCTION_ARBITRE}&nomFonction=${encodeURIComponent(LABEL_ARBITRE)}&dateRencontre=${encodeURIComponent(dateRencontre)}&rencontreId=${idRencontre}`,
    {}
  );
  const [lookupStatus, nom, prenom] = lookup.split(";");
  if (lookupStatus !== "0" || !nom) {
    throw new Error(`FBI ne reconnaît pas le numéro national ${numeroNational} (réponse : ${lookup})`);
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
    numeroNational,
    kilometres: kilometres ?? "",
    kilometresCalcules: kilometres ?? "",
    indemnites: indemnites ?? "",
    indemnitesCalculees: indemnites ?? "",
    idPresence: targetRow.idPresence || PRESENCE_PREVUE,
    polyline: polyline ?? "",
    distance: distance ?? "",
  };

  const finalRows = rows.map((r) => (r._index === targetRow._index ? updatedRow : r));

  const body = new URLSearchParams();
  for (const [name, value] of Object.entries(ficheFields)) body.append(name, value);
  finalRows.forEach((row, i) => {
    for (const key of OFFICIEL_FIELD_ORDER) {
      body.append(`repartitionDesignationForm.repartitionDesignationOfficielBeans[${i}].${key}`, row[key] ?? "");
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
