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

export type ResendResult = { ok?: string; error?: string; wait?: number };

// Renvoie un code et traduit les erreurs de Supabase en message clair.
// Supabase limite à 1 envoi par minute et par adresse : on renvoie le temps d'attente restant.
export async function resendLoginCode(email: string): Promise<ResendResult> {
  const { error } = await sendLoginCode(email);
  if (!error) return { ok: "Nouveau code envoyé. Regarde aussi dans tes spams et les onglets Promotions / Notifications." };
  const secs = Number(error.message.match(/(\d+)\s*second/i)?.[1]);
  if (/rate|seconds|too many|security purposes/i.test(error.message)) {
    const wait = Number.isFinite(secs) && secs > 0 ? secs : 60;
    return { error: `Un code vient déjà d'être envoyé. Tu pourras en redemander un dans ${wait} s.`, wait };
  }
  if (/not found|signups not allowed|user/i.test(error.message)) {
    return { ok: "Si cet e-mail fait partie de la Batcav, un nouveau code vient d'être envoyé." };
  }
  return { error: "L'e-mail n'a pas pu partir. Réessaie dans une minute." };
}
