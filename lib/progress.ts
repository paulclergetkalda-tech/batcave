import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ProgressRow = { lesson_slug: string; quiz_score: number | null; quiz_total: number | null; completed_at: string };

// Leçons terminées par l'élève. Si la table n'existe pas encore (SQL pas lancé), on renvoie une liste vide.
export async function getProgress(supabase: SupabaseClient, userId: string): Promise<ProgressRow[]> {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_slug,quiz_score,quiz_total,completed_at")
    .eq("user_id", userId);
  if (error) return [];
  return (data as ProgressRow[]) || [];
}
