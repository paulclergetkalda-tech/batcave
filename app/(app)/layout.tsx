import { requireStudent } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { AgentDrawer } from "@/components/AgentDrawer";
import { getProgress } from "@/lib/progress";
import { ALL_LESSONS, TOTAL_LESSONS } from "@/lib/formation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireStudent();
  const doneSlugs = new Set((await getProgress(supabase, profile.id)).map((p) => p.lesson_slug));
  const formationDone = ALL_LESSONS.filter((l) => doneSlugs.has(l.slug)).length;
  const name = profile.first_name || "Élève";
  return (
    <div className="shell">
      <Sidebar
        name={name}
        subtitle={profile.show_in_leaderboard ? "Visible au classement" : "Anonyme au classement"}
        crediaUrl={process.env.NEXT_PUBLIC_CREDIA_URL}
        formation={{ done: formationDone, total: TOTAL_LESSONS }}
      />
      <div className="content">{children}</div>
      <AgentDrawer />
    </div>
  );
}
