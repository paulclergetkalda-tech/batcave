import { requireStudent } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard";
import { eur, relativeDay } from "@/lib/format";
import { Landscape } from "@/components/Landscape";
import { CollectiveCounter } from "@/components/CollectiveCounter";
import { Leaderboard } from "@/components/Leaderboard";
import { Missions } from "@/components/Missions";

export const metadata = { title: "Tableau de bord — Batcav" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, profile } = await requireStudent();
  const data = await getDashboardData(supabase, profile);
  const pct = (v: number, max: number) => Math.max(2, Math.min(100, Math.round((v / Math.max(1, max)) * 100)));
  const wins = data.wins.length ? [...data.wins, ...data.wins] : [];

  return (
    <main style={{ display: "flex", flexDirection: "column", flex: "1 1 auto" }}>
      <section className="hero" aria-label="Généré par la Batcav">
        <div className="hero-inner">
          <span className="pill">
            <span className="pill-chip"><span className="live-dot" />En direct</span>
            Généré par les {data.totals.members} membres de la Batcav
          </span>
          <CollectiveCounter value={data.totals.total} />
          <p className="hero-sub">
            dont <strong>+{eur(data.totals.week)}</strong> cette semaine. Et toi, tu ajoutes combien aujourd&apos;hui ?
          </p>
        </div>
        {wins.length > 0 && (
          <div className="ticker" aria-label="Dernières victoires">
            <div className="ticker-track">
              {wins.map((w, i) => (
                <span className="ticker-item" key={i} aria-hidden={i >= data.wins.length}>
                  <b>{w.name}</b> a encaissé {eur(w.amount)} <em>· {relativeDay(w.paid_on)}</em>
                </span>
              ))}
            </div>
          </div>
        )}
        <Landscape />
      </section>

      <section className="night">
        <div className="night-inner">
          <div className="col-main">
            <Leaderboard month={data.leaderboard.month} all={data.leaderboard.all} />
          </div>

          <div className="col-side">
            <article className="card card-sky" aria-label="Mes objectifs">
              <div className="card-head"><h2>Mes objectifs</h2><span className="small">Cette semaine</span></div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 38, letterSpacing: "-0.05em", lineHeight: 1 }}>{eur(data.me.approved)}</span>
                  <span className="small">/ {eur(profile.goal_amount)}</span>
                </div>
                <div className="bar"><div style={{ width: `${pct(data.me.approved, profile.goal_amount)}%` }} /></div>
                {data.me.pending > 0 && <p className="small" style={{ margin: "8px 0 0" }}>+ {eur(data.me.pending)} en attente de validation</p>}
              </div>
              <div>
                <div className="goal-row"><span>Messages envoyés</span><span className="mono">{data.me.weekMessages} / {profile.weekly_messages_goal}</span></div>
                <div className="bar thin"><div style={{ width: `${pct(data.me.weekMessages, profile.weekly_messages_goal)}%` }} /></div>
              </div>
              <div>
                <div className="goal-row"><span>Nouveau client</span><span className="mono">{data.me.weekClients} / 1</span></div>
                <div className="bar thin"><div style={{ width: `${pct(data.me.weekClients, 1)}%` }} /></div>
              </div>
              <div>
                <div className="goal-row"><span>Jours de suite</span><span className="mono">{data.me.streak} / 7</span></div>
                <div className="bar thin"><div style={{ width: `${pct(data.me.streak, 7)}%` }} /></div>
              </div>
            </article>

            <Missions missions={data.missions} />
          </div>
        </div>
      </section>
    </main>
  );
}
