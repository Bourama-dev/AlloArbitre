import * as cheerio from "cheerio";
import ExcelJS from "exceljs";
import { FbiClient } from "./client";

export type FbiDesignationRow = {
  /** Identifiant FBI de la rencontre (afficherDesignation(<id>) dans le tableau), pour la fiche détail. */
  idRencontre: string | null;
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

const PAGE_SIZE = 200;

/**
 * Fonctionnement réel de la page FBI (vérifié via /api/fbi-sync?debug=1) :
 * `controleRecherche` ne renvoie qu'un tableau vide (en-têtes + <tbody>
 * vide) ; les lignes sont chargées ensuite par DataTables en mode
 * "server side" (API legacy : sEcho / iDisplayStart / iDisplayLength) via
 * `executeRecherche&<formulaire sérialisé>`, qui renvoie du JSON :
 *   { iTotalDisplayRecords, aaData: [[col0 masquée, Code, N°, Equipe 1,
 *     Equipe 2, Poule, Salle, Ville, Date, Heure, Rem., État], ...] }
 * Chaque cellule peut contenir du HTML (liens, <div class="etat-C">...).
 */
type DataTablesResponse = {
  iTotalDisplayRecords?: number | string;
  iTotalRecords?: number | string;
  aaData?: unknown[];
};

function cellText(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  return cheerio.load(`<div>${String(cell)}</div>`)("div").first().text().replace(/\s+/g, " ").trim();
}

/** L'état est rendu par une classe CSS (etat-C / etat-I) plus qu'un texte fiable. */
function parseEtat(cell: unknown): string {
  const raw = String(cell ?? "");
  if (/etat-C\b/.test(raw)) return "Complète";
  if (/etat-I\b/.test(raw)) return "Incomplète";
  const text = cellText(cell);
  if (/^compl/i.test(text) || text === "C") return "Complète";
  if (/^incompl/i.test(text) || text === "I") return "Incomplète";
  return text;
}

export function parseDataTablesRows(aaData: unknown[]): FbiDesignationRow[] {
  return aaData.map((row, i) => {
    if (!Array.isArray(row) || row.length < 12) {
      throw new Error(`FBI : ligne ${i} inattendue dans executeRecherche : ${JSON.stringify(row).slice(0, 300)}`);
    }
    const [, code, numero, equipe1, equipe2, poule, salle, ville, date, heure, , etat] = row;
    const idMatch = row.map(String).join(" ").match(/afficherDesignation\((\d+)\)/);
    return {
      idRencontre: idMatch ? idMatch[1] : null,
      code: cellText(code),
      numero: cellText(numero),
      equipe1: cellText(equipe1),
      equipe2: cellText(equipe2),
      poule: cellText(poule),
      salle: cellText(salle),
      ville: cellText(ville),
      date: cellText(date),
      heure: cellText(heure).replace("h", ":"),
      etat: parseEtat(etat),
    };
  });
}

type SearchParams = {
  dateDebut: string; // DD/MM/YYYY
  dateFin: string; // DD/MM/YYYY
  idSaison?: string;
};

function searchForm(params: SearchParams): Record<string, string> {
  const prefix = "rechercherRepartitionDesignationForm.rechercherRepartitionDesignationBean.";
  return {
    [`${prefix}idDivision`]: "",
    [`${prefix}idPoule`]: "",
    [`${prefix}numeroJournee`]: "",
    [`${prefix}dateDebutPeriode`]: params.dateDebut,
    [`${prefix}dateFinPeriode`]: params.dateFin,
    [`${prefix}numeroRencontre`]: "",
    [`${prefix}etat`]: "",
    [`${prefix}idOrganisme`]: "",
    [`${prefix}nomOrganisme`]: "",
    [`${prefix}salleId`]: "",
    [`${prefix}salleLibelle`]: "",
    [`${prefix}villeId`]: "",
    [`${prefix}villeLibelle`]: "",
    [`${prefix}idSaison`]: params.idSaison ?? process.env.FBI_ID_SAISON ?? "1037",
  };
}

export type FbiExportRow = {
  code: string;
  numero: string;
  equipe1: string;
  equipe2: string;
  salle: string;
  ville: string;
  date: string; // DD/MM/YYYY
  heure: string; // HH:mm
  etat: string;
  officiels: { nom: string; prenom: string; fonction: string }[];
};

/**
 * Export "Excel" de la recherche de désignations (bouton de la page FBI,
 * action=executeCsv) : une ligne par rencontre avec ses officiels désignés
 * (vérifié le 24/09 : colonnes Code, N°, Equipe 1, Equipe 2, Poule, Salle,
 * Ville, Date, Heure, Rem., État, puis par officiel Nom / Prénom / Fonction
 * / Distance / Indemn Km). Donne toutes les désignations d'une période en
 * une seule requête, là où il fallait ouvrir la fiche de chaque rencontre.
 * Noms d'équipes et villes complets (non tronqués, contrairement au tableau).
 */
export async function fetchDesignationsExportRows(client: FbiClient, params: SearchParams): Promise<FbiExportRow[]> {
  const [header, ...lines] = await fetchDesignationsExport(client, params);
  if (!header || String(header[0]).trim() !== "Code" || String(header[11] ?? "").trim() !== "Nom") {
    throw new Error(`FBI : format d'export inattendu (en-têtes : ${JSON.stringify(header).slice(0, 200)})`);
  }
  const text = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
  return lines.map((cells) => {
    const officiels: FbiExportRow["officiels"] = [];
    for (let i = 11; i + 2 < cells.length; i += 5) {
      const nom = text(cells[i]);
      const prenom = text(cells[i + 1]);
      if (nom || prenom) officiels.push({ nom, prenom, fonction: text(cells[i + 2]) });
    }
    return {
      code: text(cells[0]),
      numero: text(cells[1]),
      equipe1: text(cells[2]),
      equipe2: text(cells[3]),
      salle: text(cells[5]),
      ville: text(cells[6]),
      date: text(cells[7]),
      heure: text(cells[8]),
      etat: text(cells[10]),
      officiels,
    };
  });
}

/** Export brut (lignes de cellules) : utilisé par fetchDesignationsExportRows et la sonde ?export=. */
export async function fetchDesignationsExport(client: FbiClient, params: SearchParams): Promise<unknown[][]> {
  const form = searchForm(params);
  await client.get("rechercherDesignation.fbi");
  await client.post("rechercherDesignation.fbi?action=controleRecherche", form);
  const buffer = await client.getBuffer(`rechercherDesignation.fbi?action=executeCsv&${new URLSearchParams(form).toString()}`);

  // Malgré son nom (executeCsv), FBI renvoie un classeur .xlsx.
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  const rows: unknown[][] = [];
  sheet?.eachRow({ includeEmpty: false }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(values.map((v) => (v && typeof v === "object" && "text" in v ? (v as { text: unknown }).text : v)));
  });
  return rows;
}

export async function searchDesignations(client: FbiClient, params: SearchParams): Promise<FbiDesignationRow[]> {
  const form = searchForm(params);

  // Charge la page pour obtenir un cookie de session à jour avant l'action ajax.
  await client.get("rechercherDesignation.fbi");

  // Valide les critères côté FBI (renvoie les erreurs de saisie éventuelles
  // et le squelette du tableau, sans les lignes).
  const html = await client.post("rechercherDesignation.fbi?action=controleRecherche", form);
  if (html.includes("<UL><LI>")) {
    const start = html.indexOf("<UL><LI>");
    const end = html.lastIndexOf("</LI></UL>") + "</LI></UL>".length;
    throw new Error(`FBI a renvoyé une erreur de recherche: ${html.slice(start, end)}`);
  }

  const rows: FbiDesignationRow[] = [];
  for (let start = 0, echo = 1; ; start += PAGE_SIZE, echo++) {
    const query = new URLSearchParams({
      ...form,
      sEcho: String(echo),
      iColumns: "12",
      iDisplayStart: String(start),
      iDisplayLength: String(PAGE_SIZE),
      sSearch: "",
      iSortingCols: "0",
    });
    const body = await client.get(`rechercherDesignation.fbi?action=executeRecherche&${query.toString()}`);

    let json: DataTablesResponse;
    try {
      json = JSON.parse(body);
    } catch {
      throw new Error(`FBI : réponse non JSON pour executeRecherche : ${body.slice(0, 300)}`);
    }
    if (!Array.isArray(json.aaData)) {
      throw new Error(`FBI : pas de aaData dans executeRecherche : ${body.slice(0, 300)}`);
    }

    rows.push(...parseDataTablesRows(json.aaData));

    const total = Number(json.iTotalDisplayRecords ?? json.iTotalRecords ?? rows.length);
    if (json.aaData.length === 0 || rows.length >= total || json.aaData.length < PAGE_SIZE) break;
  }

  return rows;
}
