import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/env";

const AUTH_ROUTES = ["/login", "/signup"];
// Routes API qui gèrent leur propre autorisation (ex. cron Vercel authentifié
// par CRON_SECRET, sans cookie de session) : pas de redirection vers /login.
const SELF_AUTH_API_ROUTES = ["/api/fbi-sync"];

export default async function proxy(request: NextRequest) {
  const isAuthRoute = AUTH_ROUTES.some((r) => request.nextUrl.pathname.startsWith(r));
  const isSelfAuthApiRoute = SELF_AUTH_API_ROUTES.some((r) => request.nextUrl.pathname.startsWith(r));

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

  if (!isLoggedIn && !isAuthRoute && !isSelfAuthApiRoute) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
