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
  "numeroNationalLong",
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
  /** Kilomètres / indemnité envoyés ; 0 km si 2e match du jour dans la même salle. */
  frais: { kilometres: string; indemnites: string; deuxiemeMatchMemeSalle: boolean };
  /** Officiel retiré de FBI pour libérer la position (mode `replace`), "Prénom NOM". */
  remplace?: string;
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

// Données FBI d'une journée (recherche + export), mises en cache par client
// FBI : les deux positions d'un match, puis tous les matchs du même jour d'un
// "Tout pousser", les réutilisent. La session FBI étant désormais partagée
// entre appels (withFbiSession), le cache expire vite (DAY_CACHE_MS) et est
// vidé après chaque écriture/suppression sur FBI, pour ne jamais contrôler
// un conflit sur un état FBI périmé.
type DayData = { rows: FbiDesignationRow[]; exportRows: FbiExportRow[] };
const DAY_CACHE_MS = 60_000;
const dayCache = new WeakMap<FbiClient, Map<string, { at: number; data: Promise<DayData> }>>();

function loadDay(client: FbiClient, dateFr: string): Promise<DayData> {
  let byDate = dayCache.get(client);
  if (!byDate) dayCache.set(client, (byDate = new Map()));
  const cached = byDate.get(dateFr);
  if (cached && Date.now() - cached.at < DAY_CACHE_MS) return cached.data;
  const params = { dateDebut: dateFr, dateFin: dateFr };
  const data = (async () => ({
    rows: await searchDesignations(client, params),
    exportRows: await fetchDesignationsExportRows(client, params),
  }))();
  byDate.set(dateFr, { at: Date.now(), data });
  // Un échec ne doit pas rester en cache.
  data.catch(() => byDate!.delete(dateFr));
  return data;
}

/** À appeler après toute écriture sur FBI : l'état du jour a changé. */
function invalidateDayCache(client: FbiClient) {
  dayCache.delete(client);
}

/** L'arbitre est déjà désigné sur cette rencontre FBI : rien à pousser (pas un conflit). */
export class FbiAlreadyDesignatedError extends Error {}

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
type FbiDayAnalysis = {
  conflict: { equipe1: string; equipe2: string; heure: string } | null;
  /**
   * L'arbitre a déjà, ce jour-là, un match plus tôt dans la même salle :
   * règle CD45, pas de frais kilométriques pour ce 2e match (il est déjà sur
   * place).
   */
  previousMatchSameSalle: boolean;
};

async function analyzeFbiDay(
  client: FbiClient,
  idRencontre: string,
  dateFr: string,
  referee: { nom: string; prenom: string }
): Promise<FbiDayAnalysis> {
  const result: FbiDayAnalysis = { conflict: null, previousMatchSameSalle: false };
  const { rows, exportRows } = await loadDay(client, dateFr);
  const target = rows.find((r) => r.idRencontre === idRencontre);
  const targetStart = target ? parseFbiDateTime(target.date, target.heure) : null;
  if (!target || !targetStart) return result;
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
    if (isConflict && !result.conflict) {
      result.conflict = { equipe1: row.equipe1, equipe2: row.equipe2, heure: row.heure };
    }
    if (sameSalle && rowStart.getTime() < targetStart.getTime()) result.previousMatchSameSalle = true;
  }
  return result;
}

/** Message d'erreur FBI (<ul class="errorMessage"><li>...) en texte, ou null. */
function fbiErrorText(html: string): string | null {
  if (!html.includes("errorMessage")) return null;
  const items = Array.from(html.matchAll(/<li>([\s\S]*?)<\/li>/g), (m) => m[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean);
  return items.length > 0 ? items.join(" / ") : html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export type FbiRemovalResult = {
  idRencontre: string;
  dryRun: boolean;
  retires: { nom: string; prenom: string; numeroNational: string; ordre: string }[];
  /** Arbitres encore présents après suppression (relecture de la fiche) - doit être vide. */
  restants: string[];
  error?: string;
};

/**
 * Retire les officiels de fonction "Arbitre" d'une rencontre FBI - même
 * action que la croix rouge de chaque ligne sur la page FBI
 * (supprimerRepartitionDesignationOfficielRencontre.fbi). Les autres
 * fonctions (chronométreur, observateur...) ne sont jamais touchées.
 * dryRun (par défaut) : liste seulement ce qui serait retiré. Après une
 * suppression réelle, la fiche est relue pour vérifier.
 */
export async function removeArbitresFromFbiRencontre(
  client: FbiClient,
  idRencontre: string,
  dryRun = true
): Promise<FbiRemovalResult> {
  const isArbitre = (r: Record<string, string>) =>
    (r.idFonctionValue === ID_FONCTION_ARBITRE || /^arbitre/i.test(r.idFonction ?? r.fonction ?? "")) &&
    !!(r.numeroNational || r.nom) &&
    !!r.idOfficielRencontre;

  const { rows } = await loadFicheState(client, idRencontre);
  const targets = rows.filter(isArbitre);
  const result: FbiRemovalResult = {
    idRencontre,
    dryRun,
    retires: targets.map((r) => ({ nom: r.nom ?? "", prenom: r.prenom ?? "", numeroNational: r.numeroNational ?? "", ordre: r.ordre ?? "" })),
    restants: [],
  };
  if (dryRun || targets.length === 0) return result;

  for (const r of targets) {
    const res = await client.post(
      `supprimerRepartitionDesignationOfficielRencontre.fbi?idOfficielRencontre=${encodeURIComponent(r.idOfficielRencontre)}&idRencontre=${idRencontre}&idLicence=${encodeURIComponent(r.numeroNational ?? "")}`,
      {}
    );
    // La page FBI considère la suppression réussie quand la réponse est vide.
    if (res.trim() !== "") {
      result.error = `Réponse FBI inattendue pour ${r.prenom} ${r.nom} : ${(fbiErrorText(res) ?? res).slice(0, 200)}`;
      break;
    }
  }

  invalidateDayCache(client);
  const { rows: after } = await loadFicheState(client, idRencontre);
  result.restants = after.filter(isArbitre).map((r) => `${r.prenom} ${r.nom}`);
  return result;
}

/**
 * Supprime les lignes "Observateur" VIDES de la fiche FBI (ligne pré-créée
 * sans officiel, que le CD45 ne veut pas voir sur les matchs qu'il désigne) -
 * même action que la croix rouge de la ligne. Une ligne observateur avec un
 * officiel n'est jamais touchée. Renvoie le nombre de lignes supprimées.
 */
export async function removeEmptyObserverRows(client: FbiClient, idRencontre: string): Promise<number> {
  const { rows } = await loadFicheState(client, idRencontre);
  const empty = rows.filter(
    (r) =>
      /observateur/i.test(r.idFonction ?? r.fonction ?? "") &&
      !r.nom &&
      !r.prenom &&
      !r.numeroNational &&
      !!r.idOfficielRencontre
  );
  let removed = 0;
  for (const r of empty) {
    const res = await client.post(
      `supprimerRepartitionDesignationOfficielRencontre.fbi?idOfficielRencontre=${encodeURIComponent(r.idOfficielRencontre)}&idRencontre=${idRencontre}&idLicence=`,
      {}
    );
    if (res.trim() !== "") {
      throw new Error(`FBI n'a pas supprimé la ligne Observateur vide : ${(fbiErrorText(res) ?? res).slice(0, 200)}`);
    }
    removed++;
  }
  if (removed > 0) invalidateDayCache(client);
  return removed;
}

/**
 * FBI accepterait-il cet officiel sur cette rencontre ? Rejoue uniquement la
 * saisie de la licence (afficherNomPrenomOfficiel.fbi, appelée par la page
 * FBI dès qu'on tape un numéro) : aucune désignation n'est enregistrée. FBI
 * y applique notamment son contrôle de neutralité, bloquant ("L'officiel
 * appartient à la même association sportive ou au même comité ou à la même
 * ligue ou à la même poule") - critère qu'AlloArbitre ne peut pas vérifier
 * seul (il ne connaît ni le club ni la poule de l'arbitre).
 */
export async function checkFbiOfficielEligibility(
  client: FbiClient,
  idRencontre: string,
  dateRencontre: string,
  numeroNational: string
): Promise<{ ok: boolean; message: string }> {
  const lookup = await client.post(
    `afficherNomPrenomOfficiel.fbi?numeroTmpOfficiel=${encodeURIComponent(numeroNational.trim())}&idFonction=${ID_FONCTION_ARBITRE}&nomFonction=${encodeURIComponent(LABEL_ARBITRE)}&dateRencontre=${encodeURIComponent(dateRencontre)}&rencontreId=${idRencontre}`,
    {}
  );
  const refusal = fbiErrorText(lookup);
  // "L'officiel X a déjà été désigné sur ce match" : il est déjà sur FBI à
  // cette rencontre, rien à pousser - ce n'est pas un refus.
  if (refusal && /déjà été désigné sur ce match/i.test(refusal)) return { ok: true, message: "Déjà désigné sur FBI" };
  if (refusal) return { ok: false, message: refusal };
  const [status, nom] = lookup.split(";");
  if (status !== "0" || !nom) return { ok: false, message: `Numéro national non reconnu par FBI (${lookup.slice(0, 120)})` };
  return { ok: true, message: "Accepté par FBI" };
}

/**
 * Désigne un arbitre (par son numéro national FFBB) à une position donnée
 * (1 ou 2, "Ordre" côté FBI) sur une rencontre FBI. Ne touche qu'à la ligne
 * ciblée : FBI attend l'état complet du formulaire à chaque enregistrement,
 * donc les autres lignes sont renvoyées telles quelles, verbatim.
 *
 * FBI pré-crée en général une ligne vide par arbitre requis ; quand la fiche
 * n'en a pas (vu sur des RMU18), la ligne est ajoutée comme avec "AJOUTER".
 * Si la position est déjà occupée par quelqu'un d'autre : remplacé en mode
 * `replace` (après tous les contrôles), sinon on refuse plutôt
 * que d'écraser une désignation existante.
 *
 * `dryRun` (par défaut true) : construit et renvoie le payload exact sans
 * l'envoyer à FBI, pour relecture avant un premier envoi réel.
 */
export async function assignRefereeToFbiRencontre(
  client: FbiClient,
  idRencontre: string,
  params: {
    position: number;
    numeroNational: string;
    dryRun?: boolean;
    /** Nom/prénom attendus : pour reconnaître l'arbitre s'il est déjà sur la fiche FBI (licence chiffrée côté FBI). */
    referee?: { nom: string; prenom: string };
    /**
     * Position occupée sur FBI par un autre officiel : le retirer puis
     * désigner celui-ci (AlloArbitre remplace FBI). Sinon, refus.
     */
    replace?: boolean;
    /**
     * Officiels à ne jamais retirer, même en mode `replace` : les autres
     * arbitres AlloArbitre du match (évite d'en perdre un lors d'une simple
     * inversion A1/A2).
     */
    keep?: { nom: string; prenom: string }[];
  }
): Promise<FbiAssignResult> {
  const dryRun = params.dryRun ?? true;
  const numeroNational = params.numeroNational.trim();
  if (!numeroNational) throw new Error("Numéro national manquant");

  const { ficheFields, rows } = await loadFicheState(client, idRencontre);

  // FBI renvoie dans la fiche une licence CHIFFRÉE (ex. "c98jck...%3D%3D"),
  // jamais comparable au numéro national : on reconnaît l'arbitre à son nom.
  const expected = params.referee ? `${normName(params.referee.nom)}|${normName(params.referee.prenom)}` : null;
  const isExpected = (r: Record<string, string>) =>
    !!expected && `${normName(r.nom ?? "")}|${normName(r.prenom ?? "")}` === expected;

  const alreadyThere = rows.find((r) => (r.nom || r.numeroNational) && isExpected(r));
  if (alreadyThere) {
    throw new FbiAlreadyDesignatedError(
      `Déjà désigné sur FBI${alreadyThere.ordre ? ` (position ${alreadyThere.ordre})` : ""}`
    );
  }

  // Seules les lignes de fonction Arbitre comptent : une fiche peut porter une
  // ligne vide "Observateur Arb" en Ordre 1, qu'il ne faut jamais remplir.
  const isArbitreRow = (r: Record<string, string>) =>
    r.idFonctionValue === ID_FONCTION_ARBITRE || /^arbitre/i.test(r.idFonction ?? r.fonction ?? "");
  const existingRow = rows.find((r) => isArbitreRow(r) && r.ordre === String(params.position));
  const occupant = existingRow && (existingRow.nom || existingRow.numeroNational) ? existingRow : null;
  if (occupant) {
    const occupantKey = `${normName(occupant.nom ?? "")}|${normName(occupant.prenom ?? "")}`;
    const protectedOccupant = (params.keep ?? []).some((k) => `${normName(k.nom)}|${normName(k.prenom)}` === occupantKey);
    if (!params.replace || protectedOccupant) {
      throw new Error(
        `Position ${params.position} déjà occupée sur FBI par ${occupant.prenom} ${occupant.nom}${
          protectedOccupant ? " (aussi désigné sur ce match dans AlloArbitre : positions inversées)" : ""
        } - désignation non modifiée`
      );
    }
  }
  // Pas de ligne libre pour cette position (fiche sans lignes pré-créées, ou
  // occupant à remplacer) : on en ajoute une, comme le bouton "AJOUTER".
  const reusableRow = existingRow && !occupant ? existingRow : undefined;
  const isNewRow = !reusableRow;
  const targetRow: Record<string, string> = reusableRow ?? {
    _index: "new",
    idOfficielRencontre: "",
    nom: "",
    prenom: "",
    fonction: LABEL_ARBITRE,
    idFonction: ID_FONCTION_ARBITRE,
    idFonctionValue: ID_FONCTION_ARBITRE,
    ordre: String(params.position),
    numeroNational: "",
    idPresence: PRESENCE_PREVUE,
    idPresenceValue: PRESENCE_PREVUE,
    blSaisieClub: "0",
    blSaisieClubValue: "0",
  };

  const dateRencontre = ficheFields["repartitionDesignationForm.repartitionDesignationRencontreBean.date"] ?? "";

  // Résout nom/prénom depuis le numéro national (comme FBI le fait quand on
  // saisit la licence à la main). Réponse: "0;NOM;PRENOM;licence;...".
  // Avant le contrôle de conflit, qui compare sur nom + prénom.
  const lookup = await client.post(
    `afficherNomPrenomOfficiel.fbi?numeroTmpOfficiel=${encodeURIComponent(numeroNational)}&idFonction=${ID_FONCTION_ARBITRE}&nomFonction=${encodeURIComponent(LABEL_ARBITRE)}&dateRencontre=${encodeURIComponent(dateRencontre)}&rencontreId=${idRencontre}`,
    {}
  );
  // FBI peut refuser l'officiel (ex. "L'officiel appartient à la même
  // association sportive ou au même comité ou à la même ligue ou à la même
  // poule") : c'est un message d'erreur HTML, pas un numéro inconnu.
  const refusal = fbiErrorText(lookup);
  if (refusal && /déjà été désigné sur ce match/i.test(refusal)) {
    throw new FbiAlreadyDesignatedError("Déjà désigné sur FBI");
  }
  if (refusal) {
    throw new Error(`FBI refuse cet officiel sur cette rencontre : ${refusal}`);
  }
  // Depuis la maintenance FBI de septembre 2026, le champ numeroNational de
  // la fiche attend la licence CHIFFRÉE (élément 9 de cette réponse, ce que
  // la page FBI met dans #numLicenceCrypte) ; le numéro en clair va dans
  // numeroNationalLong. Envoyer le numéro en clair dans numeroNational faisait
  // enregistrer la ligne (km, indemnité) SANS l'officiel.
  const lookupParts = lookup.split(";");
  const [lookupStatus, nom, prenom] = lookupParts;
  const licenceCryptee = (lookupParts[9] ?? "").trim();
  if (lookupStatus !== "0" || !nom) {
    throw new Error(`FBI ne reconnaît pas le numéro national ${numeroNational} (réponse : ${lookup.slice(0, 200)})`);
  }
  if (!licenceCryptee || licenceCryptee === "null") {
    throw new Error(`FBI n'a pas renvoyé la licence chiffrée de ${numeroNational} (réponse : ${lookup.slice(0, 200)})`);
  }

  let previousMatchSameSalle = false;
  if (dateRencontre) {
    const day = await analyzeFbiDay(client, idRencontre, dateRencontre, { nom, prenom });
    if (day.conflict) {
      throw new Error(
        `Conflit d'horaire sur FBI : cet arbitre est déjà désigné à ${day.conflict.heure} sur ${day.conflict.equipe1} - ${day.conflict.equipe2}`
      );
    }
    previousMatchSameSalle = day.previousMatchSameSalle;
  }

  // Calcule kilomètres / indemnité comme le fait le bouton "CALCULER".
  // Réponse: "0;kilometres;indemnites;licence;polyline;distance".
  // 2e match du jour dans la même salle : 0 km (règle CD45). here=true fait
  // recalculer l'itinéraire par FBI (qui ignore alors kilometre=0 : vérifié,
  // indemnité rendue avec le trajet) ; here=false = saisie manuelle des km,
  // comme quand on modifie le champ Kms sur la page FBI.
  const recalc = await client.post(
    `recalculerIndemniteDesignationAjax.fbi?idLicence=${encodeURIComponent(numeroNational)}&idFonction=${ID_FONCTION_ARBITRE}&kilometre=${previousMatchSameSalle ? "0" : ""}&couple=false&idRencontre=${idRencontre}&here=${previousMatchSameSalle ? "false" : "true"}&idOfficielRencontre=${targetRow.idOfficielRencontre}`,
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
    numeroNational: licenceCryptee,
    numeroNationalLong: numeroNational,
    kilometres: previousMatchSameSalle ? "0" : (kilometres ?? ""),
    kilometresCalcules: previousMatchSameSalle ? "0" : (kilometres ?? ""),
    indemnites: indemnites ?? "",
    indemnitesCalculees: indemnites ?? "",
    idPresence: targetRow.idPresenceValue || PRESENCE_PREVUE,
    idPresenceValue: targetRow.idPresenceValue || PRESENCE_PREVUE,
    polyline: polyline ?? "",
    distance: distance ?? "",
  };

  const withNewRow = (current: Record<string, string>[]) =>
    isNewRow
      ? [...current.filter((r) => r !== occupant), updatedRow]
      : current.map((r) => (r._index === targetRow._index ? updatedRow : r));

  // idFonction / idPresence / blSaisieClub sont rendus par des <select> côté
  // FBI : le champ "brut" porte le libellé affiché (ex. "Arbitre",
  // "Présent", "Non club"), le code technique attendu par l'enregistrement
  // (-2, P, 0...) est dans "<champ>Value". Sans ça, FBI reçoit le libellé
  // au lieu du code et la ligne (y compris une ligne déjà validée qu'on ne
  // voulait pas toucher) part corrompue.
  const resolve = (row: Record<string, string>, key: string) => row[`${key}Value`] ?? row[key] ?? "";

  const buildBody = (fields: Record<string, string>, finalRows: Record<string, string>[]) => {
    const body = new URLSearchParams();
    for (const [name, value] of Object.entries(fields)) body.append(name, value);
    finalRows.forEach((row, i) => {
      for (const key of OFFICIEL_FIELD_ORDER) {
        body.append(`repartitionDesignationForm.repartitionDesignationOfficielBeans[${i}].${key}`, resolve(row, key));
      }
    });
    return body;
  };

  let body = buildBody(ficheFields, withNewRow(rows));
  const payload = body.toString();
  const remplace = occupant ? `${occupant.prenom ?? ""} ${occupant.nom ?? ""}`.trim() : undefined;

  if (!dryRun) {
    if (occupant) {
      // Retrait de l'occupant (croix rouge de la ligne sur FBI), seulement
      // maintenant que le nouvel arbitre a passé tous les contrôles FBI.
      const res = await client.post(
        `supprimerRepartitionDesignationOfficielRencontre.fbi?idOfficielRencontre=${encodeURIComponent(occupant.idOfficielRencontre ?? "")}&idRencontre=${idRencontre}&idLicence=${encodeURIComponent(occupant.numeroNational ?? "")}`,
        {}
      );
      invalidateDayCache(client);
      if (res.trim() !== "") {
        throw new Error(`FBI n'a pas retiré ${remplace} : ${(fbiErrorText(res) ?? res).slice(0, 200)}`);
      }
      // L'enregistrement renvoie tout le formulaire : on repart de la fiche
      // relue, sans la ligne supprimée.
      const fresh = await loadFicheState(client, idRencontre);
      body = buildBody(fresh.ficheFields, withNewRow(fresh.rows));
    }
    const saveResponse = await client.post(`enregistrerRepartitionDesignation.fbi?avecHistorisation=true`, Object.fromEntries(body));
    invalidateDayCache(client);
    // La réponse de l'enregistrement contient un bloc d'erreur générique même
    // quand tout s'est bien passé ("Une erreur s'est produite lors du
    // chargement de la page") : seule la relecture de la fiche fait foi.
    // FBI peut aussi accepter l'envoi sans retenir l'officiel (vu après sa
    // maintenance) : on ne doit jamais annoncer "Désigné" à tort.
    const { rows: after } = await loadFicheState(client, idRencontre);
    const saved = after.some(
      (r) => isArbitreRow(r) && `${normName(r.nom ?? "")}|${normName(r.prenom ?? "")}` === `${normName(nom)}|${normName(prenom)}`
    );
    if (!saved) {
      const saveError = fbiErrorText(saveResponse);
      throw new Error(
        `Enregistrement envoyé mais ${prenom} ${nom} n'apparaît pas sur la fiche FBI${saveError ? ` (FBI : ${saveError})` : ""}${
          remplace ? ` - ${remplace} a déjà été retiré, position vide` : ""
        } - à vérifier sur FBI`
      );
    }
  }

  return {
    dryRun,
    idRencontre,
    position: params.position,
    referee: { nom, prenom, numeroNational },
    payload,
    remplace,
    frais: {
      kilometres: updatedRow.kilometres,
      indemnites: updatedRow.indemnites,
      deuxiemeMatchMemeSalle: previousMatchSameSalle,
    },
  };
}
