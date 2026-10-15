"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/session";
import { findLesson } from "@/lib/formation";

// Marque une leçon comme terminée (et garde le score du quiz s'il y en a un)
export async function completeLesson(slug: string, score?: number, total?: number): Promise<{ ok: boolean; error?: string }> {
  const { supabase, profile } = await requireStudent();
  if (!findLesson(slug)) return { ok: false, error: "Leçon introuvable." };
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: profile.id,
      lesson_slug: slug,
      quiz_score: typeof score === "number" ? score : null,
      quiz_total: typeof total === "number" ? total : null,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_slug" }
  );
  if (error) return { ok: false, error: "Impossible d'enregistrer ta progression. Réessaie." };
  revalidatePath("/formation", "layout");
  return { ok: true };
}
