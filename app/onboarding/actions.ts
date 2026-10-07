"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import type { FormState } from "@/app/login/actions";

const clean = (v: FormDataEntryValue | null, max = 80) => String(v || "").trim().slice(0, max) || null;

export async function completeOnboarding(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireProfile({ allowNotOnboarded: true });

  const firstName = clean(formData.get("first_name"), 40);
  if (!firstName) return { error: "Ton prénom est obligatoire." };

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      pseudo: clean(formData.get("pseudo"), 30),
      situation: clean(formData.get("situation")),
      hours_per_week: clean(formData.get("hours_per_week")),
      target: clean(formData.get("target"), 200),
      blocker: clean(formData.get("blocker"), 200),
      show_in_leaderboard: formData.get("show_in_leaderboard") === "on",
      onboarded: true,
    })
    .eq("id", user.id);
  if (error) return { error: "Erreur d'enregistrement. Réessaie." };

  redirect("/dashboard");
}
