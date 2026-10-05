import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/env";

const AUTH_ROUTES = ["/login", "/signup"];
// Routes API qui gèrent leur propre autorisation (ex. cron Vercel authentifié
// par CRON_SECRET, sans cookie de session) : pas de redirection vers /login.
const SELF_AUTH_API_ROUTES = ["/api/fbi-sync"];
// Pages publiques de l'espace arbitre : connexion, activation, lien personnel.
const REFEREE_PUBLIC_ROUTES = ["/espace/connexion", "/espace/activer", "/auth/confirm"];
// Seules routes accessibles à un compte ARBITRE.
const REFEREE_ROUTES = ["/espace", "/auth/"];

export default async function proxy(request: NextRequest) {
  const isAuthRoute = AUTH_ROUTES.some((r) => request.nextUrl.pathname.startsWith(r));
  const isSelfAuthApiRoute = SELF_AUTH_API_ROUTES.some((r) => request.nextUrl.pathname.startsWith(r));
  const path = request.nextUrl.pathname;
  const isRefereePublicRoute = REFEREE_PUBLIC_ROUTES.some((r) => path.startsWith(r));

  let supabaseResponse = NextResponse.next({ request });
  let user = null;

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Ne pas insérer de logique entre createServerClient et getUser() : ça
    // revalide le token à chaque requête et rafraîchit la session si besoin.
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (err) {
    // Une session Supabase indisponible ne doit jamais faire planter tout le
    // site (500 générique illisible) - on retombe sur "non connecté".
    console.error("[proxy] Supabase auth check failed:", err);
  }

  const isLoggedIn = !!user;

  if (!isLoggedIn && path.startsWith("/espace") && !isRefereePublicRoute) {
    return NextResponse.redirect(new URL("/espace/connexion", request.nextUrl));
  }

  // Compte arbitre (rôle fixé côté serveur dans app_metadata) : uniquement
  // son espace, jamais les écrans du staff ni leurs actions serveur.
  if (isLoggedIn && user?.app_metadata?.role === "ARBITRE" && !REFEREE_ROUTES.some((r) => path.startsWith(r))) {
    return NextResponse.redirect(new URL("/espace", request.nextUrl));
  }

  if (!isLoggedIn && !isAuthRoute && !isSelfAuthApiRoute && !isRefereePublicRoute) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return supabaseResponse;
}

export const config = {
  // Fichiers statiques (logo, icône) exclus : sinon un visiteur non connecté
  // est redirigé vers /login au lieu de recevoir l'image.
  matcher: ["/((?!_next/static|_next/image|icon$|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
