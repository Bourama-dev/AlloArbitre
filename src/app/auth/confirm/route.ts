import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Lien reçu par e-mail (voir referee-auth.ts) : valide le jeton à usage
 * unique, ouvre la session (cookies) puis envoie vers l'espace arbitre.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (tokenHash && type === "magiclink") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL("/espace", url));
    console.error("[auth/confirm] verifyOtp :", error.message);
  }
  return NextResponse.redirect(new URL("/espace/connexion?error=lien", url));
}
