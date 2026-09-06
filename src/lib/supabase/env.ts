// Défense contre une valeur mal collée dans les settings Vercel (ex: guillemets
// inclus par erreur en copiant depuis un .env) - évite un crash total du site
// pour une simple erreur de saisie.
function sanitize(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
