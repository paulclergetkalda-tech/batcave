import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCoachEmail } from "@/lib/coach-email";

export const dynamic = "force-dynamic";

// Aiguillage : coach → /coach, élève → /dashboard
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (isCoachEmail(user.email)) redirect("/coach");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  redirect(data?.role === "coach" ? "/coach" : "/dashboard");
}
