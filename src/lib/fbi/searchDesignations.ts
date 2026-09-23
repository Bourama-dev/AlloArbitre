import * as cheerio from "cheerio";
import { FbiClient } from "./client";

export type FbiDesignationRow = {
  code: string;
  numero: string;
  equipe1: string;
  equipe2: string;
  poule: string;
  salle: string;
  ville: string;
  date: string; // DD/MM/YYYY
  heure: string; // HH:mm
  etat: "Complète" | "Incomplète" | "Non débutée" | string;
};

/**
 * ATTENTION : ce parseur n'a jamais été validé contre le vrai HTML renvoyé
 * par FBI. On sait (via capture d'écran) que le tableau affiche les colonnes
 * Code / N° / Equipe 1 / Equipe 2 / Poule / Salle / Ville / Date / Heure /
 * Rem. / État, mais le fragment HTML réel (retourné par
 * rechercherDesignation.fbi?action=controleRecherche, injecté dans
 * #getTableauDesignation) n'a pas été fourni — les sélecteurs ci-dessous sont
 * une meilleure estimation à partir d'un tableau <table> standard, à corriger
 * dès qu'on a un vrai exemple de réponse.
 */
export function parseDesignationRows(html: string): FbiDesignationRow[] {
  const $ = cheerio.load(html);
  const rows: FbiDesignationRow[] = [];

  $("table tbody tr").each((_, tr) => {
    const cells = $(tr)
      .find("td")
      .map((__, td) => $(td).text().trim())
      .get();

    if (cells.length < 10) return;

    const [code, numero, equipe1, equipe2, poule, salle, ville, date, heure, , etat] = cells;
    rows.push({ code, numero, equipe1, equipe2, poule, salle, ville, date, heure, etat: etat ?? cells[9] });
  });

  return rows;
}

export async function searchDesignations(
  client: FbiClient,
  params: {
    dateDebut: string; // DD/MM/YYYY
    dateFin: string; // DD/MM/YYYY
    idSaison?: string;
  }
): Promise<FbiDesignationRow[]> {
  // Charge la page pour obtenir un cookie de session à jour avant l'action ajax.
  await client.get("rechercherDesignation.fbi");

  const html = await client.post("rechercherDesignation.fbi?action=controleRecherche", {
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.idDivision": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.idPoule": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.numeroJournee": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.dateDebutPeriode": params.dateDebut,
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.dateFinPeriode": params.dateFin,
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.numeroRencontre": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.etat": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.idOrganisme": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.nomOrganisme": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.salleId": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.salleLibelle": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.villeId": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.villeLibelle": "",
    "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.idSaison": params.idSaison ?? "1037",
  });

  if (html.includes("<UL><LI>")) {
    const start = html.indexOf("<UL><LI>");
    const end = html.lastIndexOf("</LI></UL>") + "</LI></UL>".length;
    throw new Error(`FBI a renvoyé une erreur de recherche: ${html.slice(start, end)}`);
  }

  return parseDesignationRows(html);
}
