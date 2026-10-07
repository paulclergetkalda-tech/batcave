"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/session";

export async function toggleMission(id: number, done: boolean) {
  const { supabase, user } = await requireStudent();
  await supabase.from("missions").update({ done }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
}
