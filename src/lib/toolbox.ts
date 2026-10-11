/**
 * Boîte à outils arbitre : documents officiels et FAQ. Constantes et types
 * partagés entre la page, les actions et le téléchargement.
 */
export type ToolboxDocument = {
  id: string;
  title: string;
  description: string;
  category: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  position: number;
  active: boolean;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  position: number;
  active: boolean;
};

export const TOOLBOX_BUCKET = "toolbox";
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "Image",
  "image/jpeg": "Image",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
};

export const DOCUMENT_CATEGORIES = ["À avoir sur soi", "Réclamations et rapports", "Règlements", "Administratif"];
export const FAQ_CATEGORIES = ["Avant le match", "Pendant le match", "Après le match", "Règlement", "Administratif", "Désignations"];

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

/** Nom de fichier sûr pour le stockage (sans accents ni caractères spéciaux). */
export function safeFileName(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(-80) || "document"
  );
}
