import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard";
import { agentGreeting, agentReply, buildContext } from "@/lib/agent";

export async function POST(req: Request) {
  const { supabase, profile } = await requireStudent();
  const body = await req.json().catch(() => ({}));
  const message = String(body?.message || "").slice(0, 1000);
  if (!message.trim()) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  const data = await getDashboardData(supabase, profile);
  return NextResponse.json({ reply: agentReply(message, buildContext(profile, data)) });
}

export async function GET() {
  const { supabase, profile } = await requireStudent();
  const data = await getDashboardData(supabase, profile);
  return NextResponse.json({ reply: agentGreeting(buildContext(profile, data)) });
}
