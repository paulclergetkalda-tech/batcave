import "server-only";
import { createClient } from "@supabase/supabase-js";

// Délai max pour l'envoi d'un code. Vercel coupe une requête au bout d'environ 10 s :
// au-delà, l'élève verrait une fenêtre d'erreur au lieu d'un message clair.
const SEND_TIMEOUT_MS = 8000;

export type OtpSendResult =
  | { kind: "sent" }
  | { kind: "cooldown"; wait: number }   // un code vient d'être envoyé à cette adresse (< 1 min)
  | { kind: "hourly_limit" }             // limite d'e-mails par heure de Supabase atteinte
  | { kind: "unknown_user" }             // adresse qui n'a pas de compte
  | { kind: "timeout" }                  // Supabase / le serveur d'e-mails n'a pas répondu à temps
  | { kind: "smtp" }                     // le serveur d'e-mails (Brevo) a refusé ou planté
  | { kind: "other"; message: string };

// Envoie un code de connexion par e-mail (modèle « Magic Link » de Supabase, avec {{ .Token }}).
// Client sans cookies : n'interfère pas avec la session de la personne connectée.
export async function sendLoginCode(email: string): Promise<OtpSendResult> {
  const timedFetch: typeof fetch = (input, init) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), SEND_TIMEOUT_MS);
    return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t));
  };
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timedFetch },
  });

  let error: { message: string; status?: number; code?: string } | null = null;
  try {
    ({ error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } }));
  } catch (e) {
    error = { message: e instanceof Error ? e.message : String(e) };
  }
  if (!error) return { kind: "sent" };

  // Visible dans Vercel > projet > Logs : c'est là qu'on voit la vraie raison
  console.error("[login] envoi du code échoué :", error.status ?? "", error.code ?? "", error.message);

  const msg = error.message || "";
  const secs = Number(msg.match(/after (\d+) seconds?/i)?.[1]);
  if (Number.isFinite(secs) && secs > 0) return { kind: "cooldown", wait: secs };
  if (/email rate limit|over_email_send_rate_limit/i.test(msg + (error.code ?? ""))) return { kind: "hourly_limit" };
  if (/signups not allowed|user not found|otp_disabled/i.test(msg)) return { kind: "unknown_user" };
  if (/abort|timed? ?out|fetch failed|network/i.test(msg)) return { kind: "timeout" };
  if (/sending|smtp|mail/i.test(msg) || error.status === 500) return { kind: "smtp" };
  return { kind: "other", message: msg };
}

export type ResendResult = { ok?: string; error?: string; wait?: number };

// Traduit le résultat de l'envoi en message clair pour l'élève
export function describeSend(r: OtpSendResult): ResendResult {
  switch (r.kind) {
    case "sent":
    case "unknown_user": // même message : on ne révèle pas qui a un compte
      return { ok: "Si tu fais partie de la Batcav, un code vient de t'être envoyé. Regarde aussi dans tes spams." };
    case "cooldown":
      return { error: `Un code vient déjà d'être envoyé. Tu pourras en redemander un dans ${r.wait} s.`, wait: r.wait };
    case "hourly_limit":
      return { error: "Trop de codes ont été demandés dans l'heure. Réessaie un peu plus tard, ou utilise le dernier code reçu." };
    case "timeout":
      return { error: "Le serveur d'e-mails met trop de temps à répondre. Réessaie dans une minute." };
    case "smtp":
      return { error: "L'e-mail n'a pas pu partir (problème du service d'envoi). Réessaie dans quelques minutes, ou préviens Paul." };
    default:
      return { error: "L'e-mail n'a pas pu partir. Réessaie dans une minute." };
  }
}

export async function resendLoginCode(email: string): Promise<ResendResult> {
  return describeSend(await sendLoginCode(email));
}
