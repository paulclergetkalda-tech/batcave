import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client avec la clé service_role : uniquement côté serveur, uniquement pour le coach.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
