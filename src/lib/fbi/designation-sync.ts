import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FbiOfficiel } from "./detail";

/**
 * Reprend dans AlloArbitre les officiels déjà désignés sur FBI (saisis
 * directement sur FBI, avant que le match ne soit géré ici) : sans ça, la
 * colonne "Arbitres" affiche "0/2" alors que FBI a déjà un arbitre en place
 * (visible seulement dans le détail déplié). Ne crée jamais de doublon : une
 * position déjà désignée dans AlloArbitre (quel que soit l'arbitre) n'est
 * jamais touchée.
 */
export async function syncFbiOfficielsToDesignations(
  matchId: string,
  officiels: FbiOfficiel[],
  createdById: string
): Promise<{ created: number }> {
  const candidates = officiels.filter((o) => o.licence && (o.ordre === "1" || o.ordre === "2"));
  if (candidates.length === 0) return { created: 0 };

  const [{ data: existingDesignations, error: desigError }, { data: matchingReferees, error: refError }] =
    await Promise.all([
      supabaseAdmin.from("Designation").select("position").eq("matchId", matchId),
      supabaseAdmin
        .from("Referee")
        .select("id, nationalNumber")
        .in(
          "nationalNumber",
          candidates.map((o) => o.licence)
        ),
    ]);
  if (desigError) throw desigError;
  if (refError) throw refError;

  const occupiedPositions = new Set((existingDesignations ?? []).map((d) => d.position));
  const refereeIdByNational = new Map((matchingReferees ?? []).map((r) => [r.nationalNumber as string, r.id as string]));

  let created = 0;
  for (const o of candidates) {
    const position = Number(o.ordre);
    if (occupiedPositions.has(position)) continue;
    const refereeId = refereeIdByNational.get(o.licence);
    if (!refereeId) continue;

    const { error } = await supabaseAdmin
      .from("Designation")
      .insert({ matchId, refereeId, createdById, position })
      .select("id")
      .single();
    // Conflit (arbitre déjà désigné sur un autre match au même id via la contrainte unique
    // (matchId, refereeId)) : ignoré, ce n'est pas une vraie nouvelle désignation.
    if (error && error.code !== "23505") throw error;
    if (!error) created++;
  }

  return { created };
}
