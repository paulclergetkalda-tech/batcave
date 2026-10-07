"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/session";
import type { FormState } from "@/app/login/actions";

const refresh = () => { revalidatePath("/chiffres"); revalidatePath("/dashboard"); };

export async function declarePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireStudent();
  const amount = Math.round(Number(formData.get("amount")));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return { error: "Montant invalide." };
  const paid_on = String(formData.get("paid_on") || "") || undefined;
  const note = String(formData.get("note") || "").trim().slice(0, 200) || null;
  const { error } = await supabase.from("payments").insert({ user_id: user.id, amount, paid_on, note });
  if (error) return { error: "Impossible d'enregistrer ce paiement." };
  refresh();
  return { ok: `+${amount} € déclarés. Ton coach va valider, puis ça compte dans le classement.` };
}

export async function logActivity(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireStudent();
  const kind = formData.get("kind") === "client" ? "client" : "messages";
  const qty = Math.round(Number(formData.get("qty")) || (kind === "client" ? 1 : 0));
  if (qty <= 0 || qty > 1000) return { error: "Nombre invalide." };
  const note = String(formData.get("note") || "").trim().slice(0, 200) || null;
  const { error } = await supabase.from("activity").insert({ user_id: user.id, kind, qty, note });
  if (error) return { error: "Impossible d'enregistrer." };
  refresh();
  return { ok: kind === "client" ? "Client signé. Ça, c'est la Batcav." : `${qty} messages ajoutés. Les clients viennent de là.` };
}

export async function deletePendingPayment(id: number) {
  const { supabase, user } = await requireStudent();
  await supabase.from("payments").delete().eq("id", id).eq("user_id", user.id).eq("status", "pending");
  refresh();
}

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireStudent();
  const { error } = await supabase
    .from("profiles")
    .update({
      pseudo: String(formData.get("pseudo") || "").trim().slice(0, 30) || null,
      show_in_leaderboard: formData.get("show_in_leaderboard") === "on",
    })
    .eq("id", user.id);
  if (error) return { error: "Erreur d'enregistrement." };
  refresh();
  revalidatePath("/", "layout");
  return { ok: "Réglages enregistrés." };
}
