import { NextResponse } from "next/server";
import { getAnyProfile } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TOOLBOX_BUCKET } from "@/lib/toolbox";

/**
 * Ouvre un document de la boîte à outils : accès réservé aux comptes connectés,
 * puis redirection vers un lien signé de courte durée (le stockage est privé).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getAnyProfile();
  if (!profile) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { data: doc, error } = await supabaseAdmin
    .from("ToolboxDocument")
    .select("storagePath, active")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  if (!doc || (!doc.active && profile.role !== "ADMIN")) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from(TOOLBOX_BUCKET)
    .createSignedUrl(doc.storagePath as string, 120);
  if (signError || !signed?.signedUrl) return NextResponse.json({ error: "Fichier indisponible" }, { status: 404 });
  return NextResponse.redirect(signed.signedUrl);
}
