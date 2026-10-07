import { requireStudent } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { AgentDrawer } from "@/components/AgentDrawer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStudent();
  const name = profile.first_name || "Élève";
  return (
    <div className="shell">
      <Sidebar
        name={name}
        subtitle={profile.show_in_leaderboard ? "Visible au classement" : "Anonyme au classement"}
        crediaUrl={process.env.NEXT_PUBLIC_CREDIA_URL}
      />
      <div className="content">{children}</div>
      <AgentDrawer />
    </div>
  );
}
