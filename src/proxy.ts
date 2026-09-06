import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  // Ne pas insérer de logique entre createServerClient et getUser() : ça
  // revalide le token à chaque requête et rafraîchit la session si besoin.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");

  if (!isLoggedIn && !isAuthRoute) {
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
