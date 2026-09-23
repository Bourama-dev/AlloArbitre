import * as cheerio from "cheerio";

/**
 * Fiche détail d'une rencontre FBI, en deux fragments HTML (vérifié via
 * /api/fbi-sync?detail=<id>&debug=1) :
 *  1. afficherRepartitionDesignationAjax.fbi?idRencontre=<id> : infos de la
 *     rencontre dans des <input disabled> étiquetés par <label for=...>
 *     (division en clair, catégorie, noms d'équipes complets...) + des
 *     champs cachés que la page renvoie ensuite (formDesignation) ;
 *  2. afficherRepartitionDesignationOfficielAjax.fbi?idRencontre=<id> : le
 *     tableau des officiels désignés, un champ
 *     `repartitionDesignationOfficielBeans[i].<champ>` par valeur.
 * Lecture seule : on n'appelle jamais les actions d'enregistrement,
 * suppression ou envoi de convocation de cette page FBI.
 */
export type FbiRencontreInfo = { label: string; value: string };

export type FbiOfficiel = {
  nom: string;
  prenom: string;
  fonction: string;
  licence: string;
  presence: string;
  ordre: string;
};

export type FbiRencontreDetail = {
  infos: FbiRencontreInfo[];
  officiels: FbiOfficiel[];
};

function clean(s: string | undefined): string {
  return (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

/** Infos de la rencontre (fragment 1) : chaque <input disabled> + son <label for>. */
export function parseRencontreInfos(html: string): FbiRencontreInfo[] {
  const $ = cheerio.load(html);
  const infos: FbiRencontreInfo[] = [];
  const seen = new Set<string>();
  $("input[disabled][id]").each((_, input) => {
    const $i = $(input);
    const id = $i.attr("id")!;
    const label = clean($(`label[for="${id}"]`).first().text());
    const value = clean($i.attr("value"));
    if (!label || !value || seen.has(label)) return;
    seen.add(label);
    infos.push({ label, value });
  });
  return infos;
}

/**
 * Champs que la page FBI envoie avec ses appels ajax (sérialisation de
 * #formDesignation) : champs cachés + valeur par défaut des <select>.
 */
export function formDesignationFields(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const fields: Record<string, string> = {};
  $("input[name]").each((_, input) => {
    const $i = $(input);
    if ($i.is("[disabled]")) return;
    const type = ($i.attr("type") ?? "text").toLowerCase();
    if ((type === "checkbox" || type === "radio") && !$i.is("[checked]")) return;
    fields[$i.attr("name")!] = $i.attr("value") ?? "";
  });
  $("select[name]").each((_, select) => {
    const $s = $(select);
    const opt = $s.find("option[selected]").first().length ? $s.find("option[selected]").first() : $s.find("option").first();
    fields[$s.attr("name")!] = opt.attr("value") ?? "";
  });
  return fields;
}

/** Tableau des officiels (fragment 2), regroupé par index de ligne. */
export function parseOfficiels(html: string): FbiOfficiel[] {
  const $ = cheerio.load(html);
  const byIndex = new Map<number, Record<string, string>>();
  const field = (i: number) => {
    if (!byIndex.has(i)) byIndex.set(i, {});
    return byIndex.get(i)!;
  };

  $("[name*='repartitionDesignationOfficielBeans[']").each((_, el) => {
    const $el = $(el);
    const m = ($el.attr("name") ?? "").match(/repartitionDesignationOfficielBeans\[(\d+)\]\.(\w+)/);
    if (!m) return;
    const i = Number(m[1]);
    const key = m[2];
    if ($el.is("select")) {
      const opt = $el.find("option[selected]").first();
      field(i)[key] = clean(opt.text());
      field(i)[`${key}Value`] = opt.attr("value") ?? "";
    } else if ($el.is("[type=checkbox]")) {
      field(i)[key] = $el.is("[checked]") ? "oui" : "";
    } else {
      field(i)[key] = clean($el.attr("value"));
    }
  });

  // Nom / prénom sont aussi affichés en texte (td#tdNom<i>) : secours si le champ caché est vide.
  for (const [i, f] of byIndex) {
    f.nom ||= clean($(`#tdNom${i}`).text());
    f.prenom ||= clean($(`#tdPrenom${i}`).text());
  }

  return Array.from(byIndex.entries())
    .sort(([a], [b]) => a - b)
    .map(([, f]) => ({
      nom: f.nom ?? "",
      prenom: f.prenom ?? "",
      fonction: f.idFonction || f.fonction || "",
      licence: f.numeroNational ?? "",
      presence: f.idPresence ?? "",
      ordre: f.ordre ?? "",
    }))
    .filter((o) => o.nom || o.prenom || o.licence);
}
