import Link from "next/link";
import { requireCoach } from "@/lib/session";
import { BatLogo } from "@/components/BatLogo";
import { CoachNav } from "@/components/CoachNav";
import { signOut } from "@/app/login/actions";

export const metadata = { title: "Coach — Batcav" };

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireCoach();
  const [{ count: pending }, { count: upcoming }] = await Promise.all([
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("call_slots").select("id", { count: "exact", head: true }).not("booked_by", "is", null).gt("starts_at", new Date().toISOString()),
  ]);
  return (
    <div className="coach">
      <header className="c-top">
        <Link href="/coach" className="c-brand"><BatLogo size={28} color="#E8B64C" />batcav <span className="c-badge">COACH</span></Link>
        <CoachNav pending={pending || 0} upcoming={upcoming || 0} />
        <div className="c-top-right">
          <span>{profile.first_name || "Coach"}</span>
          <form action={signOut}><button className="c-btn">Déconnexion</button></form>
        </div>
      </header>
      {children}
    </div>
  );
}
