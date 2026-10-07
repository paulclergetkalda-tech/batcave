import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCoachEmail } from "@/lib/coach-email";

export type Profile = {
  id: string;
  first_name: string | null;
  pseudo: string | null;
  role: "student" | "coach";
  goal_amount: number;
  weekly_messages_goal: number;
  show_in_leaderboard: boolean;
  situation: string | null;
  hours_per_week: string | null;
  target: string | null;
  blocker: string | null;
  onboarded: boolean;
};

// Récupère l'utilisateur connecté et son profil, ou redirige.
export async function requireProfile(opts: { allowNotOnboarded?: boolean } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();

  // L'adresse du coach est toujours coach : on corrige la base automatiquement si besoin
  if (isCoachEmail(user.email) && (!profile || profile.role !== "coach" || !profile.onboarded)) {
    const admin = createAdminClient();
    await admin.from("profiles").upsert({ id: user.id, role: "coach", onboarded: true }, { onConflict: "id" });
    ({ data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>());
  }
  if (!profile) redirect("/login");
  if (!profile.onboarded && !opts.allowNotOnboarded) redirect("/onboarding");

  return { supabase, user, profile };
}

export async function requireCoach() {
  const ctx = await requireProfile();
  if (ctx.profile.role !== "coach") redirect("/dashboard");
  return ctx;
}

// Espace élève : le coach est renvoyé vers son propre espace
export async function requireStudent() {
  const ctx = await requireProfile();
  if (ctx.profile.role === "coach") redirect("/coach");
  return ctx;
}
