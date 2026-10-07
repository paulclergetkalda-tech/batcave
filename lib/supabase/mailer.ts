import "server-only";
import { createClient } from "@supabase/supabase-js";

// Envoie un code de connexion par e-mail (modèle « Magic Link » de Supabase, avec {{ .Token }}).
// Client sans cookies : n'interfère pas avec la session de la personne connectée.
export async function sendLoginCode(email: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
}
