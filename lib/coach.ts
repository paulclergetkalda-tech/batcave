import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const STAGES = ["Démarrage", "Portfolio", "Prospection", "1er client", "Objectif atteint", "En pause"] as const;

export type StudentRow = {
  id: string;
  name: string;
  pseudo: string | null;
  email: string | null;
  onboarded: boolean;
  visible: boolean;
  goal: number;
  approved: number;
  pending: number;
  month: number;
  msgs7: number;
  clients: number;
  lastActivity: string | null;
  nextCall: string | null;
  price: number;
  paid: number;
  stage: string;
  notes: string;
  blocker: string | null;
};

// Récupère les e-mails (nécessite la clé service_role) ; sinon on s'en passe
async function emailsById(): Promise<Record<string, string>> {
  try {
    const admin = createAdminClient();
    const out: Record<string, string> = {};
    for (let page = 1; page < 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data.users.length) break;
      data.users.forEach((u) => { if (u.email) out[u.id] = u.email; });
      if (data.users.length < 200) break;
    }
    return out;
  } catch {
    return {};
  }
}

export async function getStudents(supabase: SupabaseClient): Promise<StudentRow[]> {
  const monthStart = new Date(); monthStart.setDate(1);
  const monthISO = monthStart.toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const [{ data: profiles }, { data: payments }, { data: activity }, { data: tracking }, { data: calls }, emails] = await Promise.all([
    supabase.from("profiles").select("id,first_name,pseudo,onboarded,show_in_leaderboard,goal_amount,blocker,created_at").eq("role", "student").order("created_at"),
    supabase.from("payments").select("user_id,amount,status,paid_on"),
    supabase.from("activity").select("user_id,kind,qty,day"),
    supabase.from("student_tracking").select("*"),
    supabase.from("call_slots").select("booked_by,starts_at").not("booked_by", "is", null).gt("starts_at", now).order("starts_at"),
    emailsById(),
  ]);

  return (profiles || []).map((p) => {
    const pay = (payments || []).filter((x) => x.user_id === p.id);
    const act = (activity || []).filter((x) => x.user_id === p.id);
    const tr = (tracking || []).find((t) => t.user_id === p.id);
    const sum = (arr: { amount: number }[]) => arr.reduce((s, x) => s + x.amount, 0);
    const approvedRows = pay.filter((x) => x.status === "approved");
    const days = act.map((a) => a.day as string).sort();
    return {
      id: p.id,
      name: p.first_name || "Sans prénom",
      pseudo: p.pseudo,
      email: emails[p.id] || null,
      onboarded: p.onboarded,
      visible: p.show_in_leaderboard,
      goal: p.goal_amount,
      approved: sum(approvedRows),
      pending: sum(pay.filter((x) => x.status === "pending")),
      month: sum(approvedRows.filter((x) => x.paid_on >= monthISO)),
      msgs7: act.filter((a) => a.kind === "messages" && a.day >= weekAgo).reduce((s, a) => s + a.qty, 0),
      clients: act.filter((a) => a.kind === "client").reduce((s, a) => s + a.qty, 0),
      lastActivity: days.length ? days[days.length - 1] : null,
      nextCall: (calls || []).find((c) => c.booked_by === p.id)?.starts_at || null,
      price: tr?.coaching_price ?? 0,
      paid: tr?.coaching_paid ?? 0,
      stage: tr?.stage ?? "Démarrage",
      notes: tr?.notes ?? "",
      blocker: p.blocker,
    };
  });
}
