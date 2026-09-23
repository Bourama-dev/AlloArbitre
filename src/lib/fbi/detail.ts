import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

/**
 * Fiche détail d'une rencontre FBI : fragment HTML renvoyé par
 * afficherRepartitionDesignationAjax.fbi?idRencontre=<id> (le même que FBI
 * affiche sous le tableau quand on clique une rencontre). C'est un
 * formulaire d'édition des désignations : les valeurs utiles (arbitres,
 * rôles...) peuvent être dans du texte, des <input> ou des <select>.
 *
 * Format pas encore validé sur une vraie fiche : on en extrait donc une vue
 * générique (sections -> lignes -> cellules de texte) plutôt que des champs
 * nommés. Jamais de HTML FBI injecté tel quel dans la page.
 */
export type FbiDetailSection = { title: string | null; rows: string[][] };

function clean(s: string): string {
  return s.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

/** Texte visible d'une cellule + valeurs saisies (inputs visibles, options sélectionnées). */
function cellValue($: cheerio.CheerioAPI, el: AnyNode): string {
  const $el = $(el);
  const parts: string[] = [];

  const clone = $el.clone();
  clone.find("script, style, select, option, input, button, textarea").remove();
  const text = clean(clone.text());
  if (text) parts.push(text);

  $el.find("input").each((_, input) => {
    const $i = $(input);
    const type = ($i.attr("type") ?? "text").toLowerCase();
    if (type === "hidden" || type === "button" || type === "submit") return;
    if (type === "checkbox" || type === "radio") {
      if ($i.is("[checked]")) parts.push("☑");
      return;
    }
    const v = clean($i.attr("value") ?? "");
    if (v) parts.push(v);
  });
  $el.find("textarea").each((_, t) => {
    const v = clean($(t).text());
    if (v) parts.push(v);
  });
  $el.find("select").each((_, s) => {
    const selected = $(s).find("option[selected]").first();
    const v = clean(selected.text());
    if (v) parts.push(v);
  });

  return parts.join(" ");
}

export function parseFbiDetail(html: string): FbiDetailSection[] {
  const $ = cheerio.load(html);
  $("script, style").remove();
  const sections: FbiDetailSection[] = [];

  // Tables les plus internes seulement (évite de dupliquer le contenu des tables imbriquées).
  $("table")
    .filter((_, t) => $(t).find("table").length === 0)
    .each((_, table) => {
      const $t = $(table);
      const title =
        clean($t.find("caption").first().text()) ||
        clean($t.closest("fieldset").find("legend").first().text()) ||
        clean($t.prevAll("h1,h2,h3,h4,h5,legend,.titreCadre,.card-header").first().text()) ||
        null;

      const rows: string[][] = [];
      $t.find("tr").each((__, tr) => {
        const cells = $(tr)
          .children("th,td")
          .map((___, c) => cellValue($, c))
          .get();
        if (cells.some((c) => c !== "")) rows.push(cells);
      });
      if (rows.length > 0) sections.push({ title, rows });
    });

  // Fiche sans tableau : on garde au moins le texte brut, ligne par ligne.
  if (sections.length === 0) {
    const lines = $.root()
      .text()
      .split(/\n+/)
      .map(clean)
      .filter(Boolean);
    if (lines.length > 0) sections.push({ title: null, rows: lines.map((l) => [l]) });
  }

  return sections;
}
