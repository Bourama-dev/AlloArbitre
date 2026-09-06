import ExcelJS from "exceljs";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ParsedRow = {
  homeTeam: string;
  awayTeam: string;
  date: string; // YYYY-MM-DD
  heure: string; // HH:MM
  venue: string | null;
  competitionLevel: string;
  refereesRequired: number;
};

const HEADER_ALIASES: Record<string, keyof ParsedRow> = {
  "équipe domicile": "homeTeam",
  "equipe domicile": "homeTeam",
  "équipe extérieur": "awayTeam",
  "equipe exterieur": "awayTeam",
  date: "date",
  heure: "heure",
  lieu: "venue",
  niveau: "competitionLevel",
  "nb arbitres": "refereesRequired",
  "nombre d'arbitres": "refereesRequired",
};

function normalizeHeader(raw: string) {
  return raw.trim().toLowerCase();
}

function excelDateToIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const str = String(value ?? "").trim();
  // Accepte déjà "YYYY-MM-DD" ou "JJ/MM/AAAA"
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  throw new Error(`Date illisible: "${str}"`);
}

function excelTimeToHm(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(11, 16);
  }
  const str = String(value ?? "00:00").trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(":");
    return `${h.padStart(2, "0")}:${m}`;
  }
  return "00:00";
}

/** Lit un fichier Excel (.xlsx) de matchs et retourne les lignes normalisées.
 * Colonnes attendues (insensible à la casse) : Équipe domicile, Équipe extérieur,
 * Date, Heure, Lieu, Niveau, et optionnellement Nb arbitres (défaut 2). */
export async function parseMatchesWorkbook(buffer: ArrayBuffer): Promise<ParsedRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Le fichier ne contient aucune feuille.");

  const headerRow = sheet.getRow(1);
  const columnByIndex = new Map<number, keyof ParsedRow>();
  headerRow.eachCell((cell, colNumber) => {
    const key = HEADER_ALIASES[normalizeHeader(String(cell.value ?? ""))];
    if (key) columnByIndex.set(colNumber, key);
  });

  const required: (keyof ParsedRow)[] = ["homeTeam", "awayTeam", "date", "competitionLevel"];
  for (const key of required) {
    if (![...columnByIndex.values()].includes(key)) {
      throw new Error(
        `Colonne manquante dans le fichier : impossible de trouver "${key}". Colonnes attendues : Équipe domicile, Équipe extérieur, Date, Heure, Lieu, Niveau.`
      );
    }
  }

  const rows: ParsedRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const key = columnByIndex.get(colNumber);
      if (key) raw[key] = cell.value;
    });
    if (!raw.homeTeam && !raw.awayTeam) return; // ligne vide

    rows.push({
      homeTeam: String(raw.homeTeam ?? "").trim(),
      awayTeam: String(raw.awayTeam ?? "").trim(),
      date: excelDateToIso(raw.date),
      heure: excelTimeToHm(raw.heure),
      venue: raw.venue ? String(raw.venue).trim() : null,
      competitionLevel: String(raw.competitionLevel ?? "").trim(),
      refereesRequired: Number(raw.refereesRequired) || 2,
    });
  });

  return rows;
}

export type ImportSummary = {
  created: number;
  updated: number;
  competitionLevelsCreated: string[];
  errors: string[];
};

/** Importe des lignes de match : crée les niveaux de compétition manquants,
 * puis pour chaque ligne, met à jour le match existant (même date + équipes +
 * niveau) ou en crée un nouveau. Idempotent : ré-importer le même fichier ne
 * duplique rien. */
export async function importMatches(rows: ParsedRow[]): Promise<ImportSummary> {
  const summary: ImportSummary = { created: 0, updated: 0, competitionLevelsCreated: [], errors: [] };

  const { data: levels, error: levelsError } = await supabaseAdmin
    .from("CompetitionLevel")
    .select("id, label");
  if (levelsError) throw levelsError;

  const levelIdByLabel = new Map((levels ?? []).map((l) => [l.label, l.id as string]));

  for (const label of new Set(rows.map((r) => r.competitionLevel))) {
    if (!label || levelIdByLabel.has(label)) continue;
    const { data, error } = await supabaseAdmin
      .from("CompetitionLevel")
      .insert({ label })
      .select("id")
      .single();
    if (error) throw error;
    levelIdByLabel.set(label, data.id as string);
    summary.competitionLevelsCreated.push(label);
  }

  for (const row of rows) {
    try {
      const competitionLevelId = levelIdByLabel.get(row.competitionLevel);
      if (!competitionLevelId) {
        summary.errors.push(`Niveau introuvable pour "${row.homeTeam} vs ${row.awayTeam}"`);
        continue;
      }

      const date = new Date(`${row.date}T${row.heure}:00`);

      const { data: existing, error: findError } = await supabaseAdmin
        .from("Match")
        .select("id")
        .eq("date", date.toISOString())
        .eq("homeTeam", row.homeTeam)
        .eq("awayTeam", row.awayTeam)
        .eq("competitionLevelId", competitionLevelId)
        .maybeSingle();
      if (findError) throw findError;

      if (existing) {
        const { error } = await supabaseAdmin
          .from("Match")
          .update({
            venue: row.venue,
            refereesRequired: row.refereesRequired,
          })
          .eq("id", existing.id);
        if (error) throw error;
        summary.updated++;
      } else {
        const { error } = await supabaseAdmin.from("Match").insert({
          date: date.toISOString(),
          homeTeam: row.homeTeam,
          awayTeam: row.awayTeam,
          venue: row.venue,
          refereesRequired: row.refereesRequired,
          competitionLevelId,
        });
        if (error) throw error;
        summary.created++;
      }
    } catch (err) {
      summary.errors.push(
        `${row.homeTeam} vs ${row.awayTeam} (${row.date}) : ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return summary;
}
