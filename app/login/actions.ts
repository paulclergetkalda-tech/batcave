"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendLoginCode } from "@/lib/supabase/mailer";
import { isCoachEmail } from "@/lib/coach-email";

export type FormState = { error?: string; ok?: string; step?: "code"; email?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Étape 1 : on envoie le code. Même réponse que le compte existe ou non.
export async function requestCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "E-mail invalide." };
  const { error } = await sendLoginCode(email);
  if (error && /rate|seconds|too many/i.test(error.message)) {
    return { error: "Trop de demandes. Attends une minute puis réessaie.", email };
  }
  return { step: "code", email, ok: "Si tu fais partie de la Batcav, un code vient de t'être envoyé par e-mail." };
}

// Étape 2 : on vérifie le code
export async function verifyCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const token = String(formData.get("code") || "").replace(/\s/g, "");
  if (!/^\d{6,10}$/.test(token)) return { step: "code", email, error: "Le code contient uniquement des chiffres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.user) return { step: "code", email, error: "Code incorrect ou expiré. Redemande un code." };

  if (isCoachEmail(data.user.email)) redirect("/coach");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  redirect(profile?.role === "coach" ? "/coach" : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
