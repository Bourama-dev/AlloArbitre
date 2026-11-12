import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Lien personnel généré par le répartiteur (voir referee-auth.ts) : valide le jeton à usage
 * unique, ouvre la session (cookies) puis envoie vers l'espace arbitre.
 *
 * Le jeton n'est consommé que par un POST (bouton « Accéder à mon espace »). Un simple GET
 * affiche une page : les aperçus de lien de WhatsApp (générés dès l'envoi, côté expéditeur)
 * et les antivirus ouvrent l'URL et auraient sinon grillé le jeton avant l'arbitre.
 */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (!tokenHash || type !== "magiclink") return NextResponse.redirect(new URL("/espace/connexion?error=lien", url));

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>AlloArbitre · Accéder à mon espace</title>
<style>body{font-family:system-ui,sans-serif;background:#f5f6f8;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.c{background:#fff;border-radius:16px;padding:24px;max-width:360px;width:100%;box-shadow:0 1px 4px rgba(0,0,0,.08)}
h1{font-size:20px;margin:0 0 8px}p{color:#667085;font-size:14px;margin:0 0 20px}
button{width:100%;background:#ea580c;color:#fff;border:0;border-radius:12px;padding:14px;font-size:16px;font-weight:600}</style></head>
<body><form class="c" method="post" action="/auth/confirm">
<h1>AlloArbitre</h1><p>Appuyez sur le bouton pour accéder à votre espace arbitre.</p>
<input type="hidden" name="token_hash" value="${escapeHtml(tokenHash)}"><input type="hidden" name="type" value="magiclink">
<button type="submit">Accéder à mon espace</button></form></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const form = await request.formData();
  const tokenHash = String(form.get("token_hash") ?? "");
  const type = String(form.get("type") ?? "");

  if (tokenHash && type === "magiclink") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL("/espace?motdepasse=1", url), 303);
    console.error("[auth/confirm] verifyOtp :", error.message);
  }
  return NextResponse.redirect(new URL("/espace/connexion?error=lien", url), 303);
}
