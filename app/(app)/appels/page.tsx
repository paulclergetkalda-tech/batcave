import { requireStudent } from "@/lib/session";
import { dayKey, fmtDay, fmtTime } from "@/lib/format";
import { BookingForm } from "./BookingForm";
import { cancelBooking } from "./actions";

export const metadata = { title: "Mes appels — Batcav" };
export const dynamic = "force-dynamic";

export default async function AppelsPage() {
  const { supabase, user } = await requireStudent();
  const now = new Date().toISOString();
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString();

  const [{ data: mine }, { data: free }] = await Promise.all([
    supabase.from("call_slots").select("id,starts_at,duration_min,topic").eq("booked_by", user.id).order("starts_at", { ascending: false }).limit(20),
    supabase.from("call_slots").select("id,starts_at,duration_min").is("booked_by", null).gt("starts_at", now).lt("starts_at", in30).order("starts_at"),
  ]);
  const upcoming = (mine || []).filter((c) => c.starts_at > now).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = (mine || []).filter((c) => c.starts_at <= now);
  const next = upcoming[0];

  const days: { key: string; label: string; slots: { id: number; time: string; duration: number }[] }[] = [];
  for (const s of free || []) {
    const k = dayKey(s.starts_at);
    let d = days.find((x) => x.key === k);
    if (!d) { d = { key: k, label: fmtDay(s.starts_at), slots: [] }; days.push(d); }
    d.slots.push({ id: s.id, time: fmtTime(s.starts_at), duration: s.duration_min });
  }
  const canCancel = next && new Date(next.starts_at).getTime() - Date.now() > 2 * 3600000;

  return (
    <main className="page">
      <div className="page-inner">
        <h1>Mes appels.<br /><span>Un appel préparé en vaut trois.</span></h1>

        {next && (
          <section className="card card-sky" aria-label="Prochain appel">
            <span className="mono small">PROCHAIN APPEL 1:1</span>
            <span style={{ fontWeight: 600, fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.05em", lineHeight: 1, textTransform: "capitalize" }}>
              {fmtDay(next.starts_at)}, {fmtTime(next.starts_at)}
            </span>
            <span>{next.duration_min} min{next.topic ? ` · Sujet : ${next.topic}` : ""}</span>
            <p className="small" style={{ margin: 0 }}>Arrive avec : tes chiffres de la semaine à jour, tes meilleures réponses de prospects et ta question n°1.</p>
            {canCancel ? (
              <form action={cancelBooking.bind(null, next.id)}><button className="btn btn-sm">Annuler ce créneau</button></form>
            ) : <span className="small">Annulation possible jusqu&apos;à 2 h avant.</span>}
          </section>
        )}

        {!next && (
          <section className="panel" aria-label="Réserver un appel">
            <h2>Réserver un appel avec ton coach</h2>
            <BookingForm days={days} />
          </section>
        )}

        {past.length > 0 && (
          <section className="panel" aria-label="Appels passés">
            <h2>Appels passés</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {past.map((c) => (
                <li key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                  <span style={{ textTransform: "capitalize" }}>{fmtDay(c.starts_at)} · {fmtTime(c.starts_at)}</span>
                  <span style={{ color: "var(--muted)" }}>{c.topic || "—"}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
