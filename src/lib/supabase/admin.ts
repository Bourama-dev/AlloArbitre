import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Client Supabase "admin" (clé service_role) pour tout l'accès aux données
 * applicatives (matchs, arbitres, désignations...) depuis le serveur.
 * Contourne volontairement les RLS - l'autorisation (qui peut faire quoi)
 * est vérifiée par notre propre code (getCurrentUser() + rôle), exactement
 * comme du temps de Prisma (connexion directe superuser).
 *
 * Ne JAMAIS importer ce module depuis du code exécuté côté client.
 */
export const supabaseAdmin = createSupabaseClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
