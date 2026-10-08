import type { ForbidParams, QuotaParams, Rule, RuleSeverity } from "@/lib/designation-rules";

type Kind = Rule["kind"];
export type RuleInput = {
  label: string;
  description: string | null;
  severity: RuleSeverity;
  active: boolean;
  params: QuotaParams | { maxConsecutive: number } | ForbidParams;
};

const intIn = (raw: FormDataEntryValue | null, min: number, max: number): number | null => {
  const s = String(raw ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= min && n <= max ? n : NaN;
};

/** Lit et valide le formulaire d'une règle ; renvoie un message d'erreur en français si quelque chose cloche. */
export function parseRuleForm(formData: FormData, kind: Kind): RuleInput | { error: string } {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Donnez un nom à la règle." };
  if (label.length > 140) return { error: "Nom de la règle : 140 caractères maximum." };
  const description = String(formData.get("description") ?? "").trim() || null;
  const severity: RuleSeverity = formData.get("severity") === "bloquant" ? "bloquant" : "avertissement";
  const active = formData.get("active") === "on";
  const base = { label, description, severity, active };

  if (kind === "quota") {
    const period = ["day", "week", "weekend", "rolling3"].find((p) => p === formData.get("period")) as QuotaParams["period"] | undefined;
    const scope = (["classiques", "tqr", "tous"].find((p) => p === formData.get("scope")) ?? "classiques") as QuotaParams["scope"];
    const max = intIn(formData.get("max"), 1, 50);
    if (!period) return { error: "Choisissez la période du quota." };
    if (max == null || Number.isNaN(max)) return { error: "Maximum : un nombre entier entre 1 et 50." };
    return { ...base, params: { period, max, scope } };
  }

  if (kind === "tqr-repos") {
    const maxConsecutive = intIn(formData.get("maxConsecutive"), 1, 10);
    if (maxConsecutive == null || Number.isNaN(maxConsecutive)) return { error: "Nombre de TQR d'affilée : un entier entre 1 et 10." };
    return { ...base, params: { maxConsecutive } };
  }

  const levels = formData.getAll("levels").map(String).filter(Boolean);
  const ageUnder = intIn(formData.get("ageUnder"), 1, 99);
  if (Number.isNaN(ageUnder)) return { error: "Âge : un nombre entier entre 1 et 99, ou vide." };
  if (levels.length === 0 && ageUnder == null) {
    return { error: "Indiquez qui est concerné : au moins un niveau d'arbitre, ou un âge." };
  }
  const scope = (["all", "seniors", "u20plus", "custom"].find((p) => p === formData.get("divisionScope")) ?? "all") as ForbidParams["division"]["scope"];
  const labels = scope === "custom" ? formData.getAll("divisions").map(String).filter(Boolean) : [];
  if (scope === "custom" && labels.length === 0) return { error: "Choisissez au moins une division." };
  return { ...base, params: { referee: { levels, ageUnder }, division: { scope, labels } } };
}
