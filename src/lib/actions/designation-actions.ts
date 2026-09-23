"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/current-user";

/** Retire une désignation, depuis n'importe quel tableau de matchs (pas seulement la fiche détail). */
export async function removeDesignation(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const designationId = String(formData.get("designationId") ?? "");
  const matchId = String(formData.get("matchId") ?? "");
  if (!designationId) return;

  const { error } = await supabaseAdmin.from("Designation").delete().eq("id", designationId);
  if (error) throw error;

  revalidatePath("/matchs");
  revalidatePath("/fbi");
  if (matchId) revalidatePath(`/matchs/${matchId}`);
}
