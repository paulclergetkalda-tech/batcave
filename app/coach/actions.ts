"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLoginCode } from "@/lib/supabase/mailer";
import { localToUTC } from "@/lib/format";
import { STAGES } from "@/lib/coach";
import type { FormState } from "@/app/login/actions";

const refreshAll = () => { revalidatePath("/coach", "layout"); revalidatePath("/dashboard"); };

// ---------- Élèves ----------
export async function addStudent(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireCoach();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const firstName = String(formData.get("first_name") || "").trim().slice(0, 40);
  const price = Math.max(0, Math.round(Number(formData.get("price")) || 0));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail invalide." };
  if (!firstName) return { error: "Prénom obligatoire." };

  let admin;
  try { admin = createAdminClient(); } catch { return { error: "Ajoute SUPABASE_SERVICE_ROLE_KEY dans .env.local." }; }

  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error || !data.user) return { error: /already|exists|registered/i.test(error?.message || "") ? "Cet e-mail a déjà un compte." : "Création impossible : " + error?.message };

  await admin.from("profiles").update({ first_name: firstName }).eq("id", data.user.id);
  await supabase.from("student_tracking").upsert({ user_id: data.user.id, coaching_price: price });

  const { error: mailErr } = await sendLoginCode(email);
  refreshAll();
  if (mailErr) return { ok: `${firstName} est ajouté, mais l'e-mail n'est pas parti (${mailErr.message}). Il pourra demander son code sur la page de connexion.` };
  return { ok: `${firstName} est ajouté. Il vient de recevoir son code d'accès par e-mail.` };
}

export async function resendCode(email: string) {
  await requireCoach();
  await sendLoginCode(email);
}

const TRACK_FIELDS = ["coaching_price", "coaching_paid", "stage", "notes"] as const;
type TrackField = (typeof TRACK_FIELDS)[number] | "goal_amount";

// Sauvegarde d'une cellule du tableur
export async function saveCell(userId: string, field: TrackField, value: string): Promise<{ ok: boolean }> {
  const { supabase } = await requireCoach();
  if (field === "goal_amount") {
    const n = Math.round(Number(value));
    if (!(n > 0 && n <= 1000000)) return { ok: false };
    const { error } = await supabase.from("profiles").update({ goal_amount: n }).eq("id", userId);
    refreshAll();
    return { ok: !error };
  }
  if (!TRACK_FIELDS.includes(field)) return { ok: false };
  let v: string | number | null = value;
  if (field === "coaching_price" || field === "coaching_paid") {
    v = Math.max(0, Math.round(Number(value) || 0));
  } else if (field === "stage") {
    if (!(STAGES as readonly string[]).includes(value)) return { ok: false };
  } else {
    v = value.slice(0, 1000) || null;
  }
  const { error } = await supabase
    .from("student_tracking")
    .upsert({ user_id: userId, [field]: v, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  revalidatePath("/coach", "layout");
  return { ok: !error };
}

// ---------- Résultats / cagnotte ----------
export async function addResult(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireCoach();
  const userId = String(formData.get("user_id") || "");
  const amount = Math.round(Number(formData.get("amount")));
  if (!userId) return { error: "Choisis un élève." };
  if (!(amount > 0 && amount <= 100000)) return { error: "Montant invalide." };
  const paid_on = String(formData.get("paid_on") || "") || undefined;
  const note = String(formData.get("note") || "").trim().slice(0, 200) || null;
  const { error } = await supabase.from("payments").insert({ user_id: userId, amount, paid_on, note, status: "approved", reviewed_at: new Date().toISOString() });
  if (error) return { error: "Ajout impossible." };
  refreshAll();
  return { ok: `+${amount} € ajoutés au classement et à la cagnotte.` };
}

export async function reviewPayment(id: number, status: "approved" | "rejected") {
  const { supabase } = await requireCoach();
  await supabase.from("payments").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
  refreshAll();
}

export async function deletePayment(id: number) {
  const { supabase } = await requireCoach();
  await supabase.from("payments").delete().eq("id", id);
  refreshAll();
}

// ---------- Disponibilités ----------
export async function addAvailability(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireCoach();
  const date = String(formData.get("date") || "");
  const from = String(formData.get("from") || "");
  const to = String(formData.get("to") || "");
  const duration = Math.round(Number(formData.get("duration")) || 45);
  const weeks = Math.min(12, Math.max(1, Math.round(Number(formData.get("weeks")) || 1)));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to)) return { error: "Date ou heures invalides." };
  if (duration < 10 || duration > 240) return { error: "Durée entre 10 et 240 min." };

  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const start = toMin(from), end = toMin(to);
  if (end - start < duration) return { error: "La plage est plus courte qu'un créneau." };

  const rows: { starts_at: string; duration_min: number }[] = [];
  for (let w = 0; w < weeks; w++) {
    const d = new Date(date + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + 7 * w);
    const day = d.toISOString().slice(0, 10);
    for (let m = start; m + duration <= end; m += duration) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0"), mm = String(m % 60).padStart(2, "0");
      const at = localToUTC(day, `${hh}:${mm}`);
      if (at.getTime() > Date.now()) rows.push({ starts_at: at.toISOString(), duration_min: duration });
    }
  }
  if (!rows.length) return { error: "Aucun créneau dans le futur avec ces réglages." };
  const { error } = await supabase.from("call_slots").insert(rows);
  if (error) return { error: "Ajout impossible." };
  revalidatePath("/coach", "layout"); revalidatePath("/appels");
  return { ok: `${rows.length} créneau${rows.length > 1 ? "x" : ""} ouvert${rows.length > 1 ? "s" : ""}.` };
}

export async function deleteSlot(id: number) {
  const { supabase } = await requireCoach();
  await supabase.from("call_slots").delete().eq("id", id);
  revalidatePath("/coach", "layout"); revalidatePath("/appels");
}

export async function freeSlot(id: number) {
  const { supabase } = await requireCoach();
  await supabase.from("call_slots").update({ booked_by: null, booked_at: null, topic: null }).eq("id", id);
  revalidatePath("/coach", "layout"); revalidatePath("/appels");
}
