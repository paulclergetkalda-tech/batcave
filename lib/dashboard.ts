import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfWeekISO, todayISO } from "@/lib/format";
import type { Profile } from "@/lib/session";

export type LeaderRow = { rank: number; name: string; amount: number; is_me: boolean };
export type Win = { name: string; amount: number; paid_on: string };
export type Mission = { id: number; label: string; done: boolean };

export const DEFAULT_MISSIONS = [
  "Envoyer 20 messages de prospection",
  "Avancer sur un site client ou portfolio (crédIA)",
  "Relancer les prospects qui n'ont pas répondu",
  "Noter tes chiffres du jour dans « Mes chiffres »",
];

export async function getMissionsToday(supabase: SupabaseClient, userId: string): Promise<Mission[]> {
  const day = todayISO();
  const { data } = await supabase
    .from("missions").select("id,label,done").eq("user_id", userId).eq("day", day).order("position");
  if (data && data.length) return data as Mission[];

  const rows = DEFAULT_MISSIONS.map((label, i) => ({ user_id: userId, label, day, position: i }));
  const { data: created } = await supabase.from("missions").insert(rows).select("id,label,done").order("position");
  return (created as Mission[]) || [];
}

export async function getDashboardData(supabase: SupabaseClient, profile: Profile) {
  const week = startOfWeekISO();

  const [totals, month, all, wins, myPay, myAct, missions, streakRows] = await Promise.all([
    supabase.rpc("batcav_totals").single<{ total: number; week_total: number; members: number }>(),
    supabase.rpc("leaderboard", { period: "month" }),
    supabase.rpc("leaderboard", { period: "all" }),
    supabase.rpc("recent_wins", { max_rows: 12 }),
    supabase.from("payments").select("amount,status").eq("user_id", profile.id),
    supabase.from("activity").select("kind,qty,day").eq("user_id", profile.id).gte("day", week),
    getMissionsToday(supabase, profile.id),
    supabase.from("activity").select("day").eq("user_id", profile.id).order("day", { ascending: false }).limit(60),
  ]);

  const approved = (myPay.data || []).filter((p) => p.status === "approved").reduce((s, p) => s + p.amount, 0);
  const pending = (myPay.data || []).filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const weekMessages = (myAct.data || []).filter((a) => a.kind === "messages").reduce((s, a) => s + a.qty, 0);
  const weekClients = (myAct.data || []).filter((a) => a.kind === "client").reduce((s, a) => s + a.qty, 0);

  // Série : jours consécutifs (jusqu'à aujourd'hui ou hier) avec au moins une activité notée
  const days = new Set((streakRows.data || []).map((r) => r.day as string));
  let streak = 0;
  const d = new Date();
  if (!days.has(todayISO())) d.setDate(d.getDate() - 1);
  for (;;) {
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (!days.has(iso)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  const toRows = (r: { data: unknown }) =>
    ((r.data as LeaderRow[]) || []).map((x) => ({ ...x, rank: Number(x.rank), amount: Number(x.amount) }));

  return {
    totals: {
      total: Number(totals.data?.total || 0),
      week: Number(totals.data?.week_total || 0),
      members: Number(totals.data?.members || 0),
    },
    leaderboard: { month: toRows(month), all: toRows(all) },
    wins: ((wins.data as Win[]) || []).map((w) => ({ ...w, amount: Number(w.amount) })),
    me: { approved, pending, weekMessages, weekClients, streak },
    missions,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
