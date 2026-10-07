"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/session";
import type { FormState } from "@/app/login/actions";

const MSG: Record<string, string> = {
  deja_reserve: "Tu as déjà un appel à venir. Annule-le d'abord si tu veux changer.",
  indisponible: "Ce créneau vient d'être pris. Choisis-en un autre.",
};

export async function bookSlot(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireStudent();
  const slotId = Number(formData.get("slot_id"));
  if (!slotId) return { error: "Choisis un créneau." };
  const topic = String(formData.get("topic") || "").trim().slice(0, 300) || null;
  const { data, error } = await supabase.rpc("book_slot", { slot_id: slotId, slot_topic: topic });
  if (error) return { error: "Réservation impossible. Réessaie." };
  if (data !== "ok") return { error: MSG[data as string] || "Réservation impossible." };
  revalidatePath("/appels");
  return { ok: "C'est calé. Prépare ton appel." };
}

export async function cancelBooking(slotId: number) {
  const { supabase } = await requireStudent();
  await supabase.rpc("cancel_booking", { slot_id: slotId });
  revalidatePath("/appels");
}
