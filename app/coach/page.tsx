import Link from "next/link";
import { requireCoach } from "@/lib/session";
import { eur, fmtDay, fmtTime, todayISO } from "@/lib/format";
import { getStudents } from "@/lib/coach";
import { reviewPayment } from "./actions";
import { AddResultForm } from "./Forms";

export const dynamic = "force-dynamic";

export default async function CoachHome() {
  const { supabase, profile } = await requireCoach();
  const now = new Date().toISOString();
  const [students, { data: totals }, { data: pending }, { data: calls }] = await Promise.all([
    getStudents(supabase),
    supabase.rpc("batcav_totals").single<{ total: number; week_total: number; members: number }>(),
    supabase.from("payments").select("id,user_id,amount,note,paid_on").eq("status", "pending").order("created_at"),
    supabase.from("call_slots").select("id,starts_at,duration_min,booked_by,topic").not("booked_by", "is", null).gt("starts_at", now).order("starts_at").limit(6),
  ]);
  const nameOf = (id: string | null) => students.find((s) => s.id === id)?.name || "Élève";
  const month = students.reduce((s, x) => s + x.month, 0);
  const due = students.reduce((s, x) => s + x.price, 0);
  const paid = students.reduce((s, x) => s + x.paid, 0);
  const active = students.filter((s) => s.lastActivity && Date.now() - new Date(s.lastActivity).getTime() < 7 * 86400000).length;
  const asleep = students.filter((s) => s.onboarded && (!s.lastActivity || Date.now() - new Date(s.lastActivity).getTime() > 4 * 86400000));

  return (
    <main className="c-main">
      <div>
        <span className="c-label">{new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" })}</span>
        <h1 className="c-h1" style={{ marginTop: 8 }}>Salut {profile.first_name || "coach"}. <span>Voilà ta Batcav.</span></h1>
      </div>

      <section className="c-kpis" aria-label="Chiffres clés">
        <div className="c-kpi"><span className="c-label">Cagnotte totale</span><b className="gold">{eur(Number(totals?.total || 0))}</b><small>générés par tes élèves (validés)</small></div>
        <div className="c-kpi"><span className="c-label">Ce mois</span><b>{eur(month)}</b><small>+{eur(Number(totals?.week_total || 0))} cette semaine</small></div>
        <div className="c-kpi"><span className="c-label">Élèves actifs (7 j)</span><b>{active}<span style={{ fontSize: 18, color: "var(--c-muted)" }}> / {students.length}</span></b><small>ont noté une activité</small></div>
        <div className="c-kpi"><span className="c-label">Accompagnement encaissé</span><b>{eur(paid)}</b><small>sur {eur(due)} · reste {eur(Math.max(0, due - paid))}</small></div>
      </section>

      <div className="c-grid2">
        <section className="c-box" aria-label="À valider">
          <h2>Paiements à valider {pending && pending.length > 0 && <span className="c-count">{pending.length}</span>}</h2>
          {!pending?.length ? <p className="c-empty">Rien à valider.</p> : (
            <ul className="c-list">
              {pending.map((p) => (
                <li key={p.id}>
                  <div><b>{nameOf(p.user_id)}</b> · <span className="mono">{eur(p.amount)}</span><div className="c-sub">{p.note || "Sans note"} · {new Date(p.paid_on + "T12:00:00").toLocaleDateString("fr-FR")}</div></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <form action={reviewPayment.bind(null, p.id, "approved")}><button className="c-btn gold">Valider</button></form>
                    <form action={reviewPayment.bind(null, p.id, "rejected")}><button className="c-btn danger">Refuser</button></form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="c-box" aria-label="Prochains appels">
          <h2>Prochains appels réservés</h2>
          {!calls?.length ? <p className="c-empty">Aucun appel réservé. <Link href="/coach/appels" style={{ color: "var(--c-gold)" }}>Ouvre des créneaux →</Link></p> : (
            <ul className="c-list">
              {calls.map((c) => (
                <li key={c.id}>
                  <div><b>{nameOf(c.booked_by)}</b><div className="c-sub">{c.topic || "Pas de sujet précisé"}</div></div>
                  <span className="mono" style={{ textTransform: "capitalize" }}>{fmtDay(c.starts_at)} · {fmtTime(c.starts_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="c-grid2">
        <AddResultForm students={students.map((s) => ({ id: s.id, name: s.name }))} today={todayISO()} />
        <section className="c-box" aria-label="À relancer">
          <h2>À relancer</h2>
          <p className="c-sub" style={{ margin: 0 }}>Aucune activité notée depuis plus de 4 jours.</p>
          {!asleep.length ? <p className="c-empty">Tout le monde bosse.</p> : (
            <ul className="c-list">
              {asleep.map((s) => (
                <li key={s.id}>
                  <b>{s.name}</b>
                  <span className="c-sub">{s.lastActivity ? `dernière activité le ${new Date(s.lastActivity + "T12:00:00").toLocaleDateString("fr-FR")}` : "aucune activité"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
