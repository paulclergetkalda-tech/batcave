import { requireCoach } from "@/lib/session";
import { dayKey, fmtDay, fmtTime, todayISO } from "@/lib/format";
import { deleteSlot, freeSlot } from "../actions";
import { AvailabilityForm } from "../Forms";

export const metadata = { title: "Appels — Coach Batcav" };
export const dynamic = "force-dynamic";

export default async function CoachAppels() {
  const { supabase } = await requireCoach();
  const now = new Date().toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const [{ data: slots }, { data: past }, { data: profiles }] = await Promise.all([
    supabase.from("call_slots").select("id,starts_at,duration_min,booked_by,topic").gt("starts_at", now).order("starts_at").limit(300),
    supabase.from("call_slots").select("id,starts_at,duration_min,booked_by,topic").not("booked_by", "is", null).lte("starts_at", now).gte("starts_at", monthAgo).order("starts_at", { ascending: false }),
    supabase.from("profiles").select("id,first_name"),
  ]);
  const nameOf = (id: string | null) => profiles?.find((p) => p.id === id)?.first_name || "Élève";

  const days: { key: string; label: string; items: NonNullable<typeof slots> }[] = [];
  for (const s of slots || []) {
    const k = dayKey(s.starts_at);
    let d = days.find((x) => x.key === k);
    if (!d) { d = { key: k, label: fmtDay(s.starts_at), items: [] }; days.push(d); }
    d.items.push(s);
  }
  const booked = (slots || []).filter((s) => s.booked_by).length;
  const free = (slots || []).length - booked;

  return (
    <main className="c-main">
      <h1 className="c-h1">Appels. <span>{booked} réservé{booked > 1 ? "s" : ""} · {free} créneau{free > 1 ? "x" : ""} libre{free > 1 ? "s" : ""}.</span></h1>
      <AvailabilityForm today={todayISO()} />

      <div className="c-grid2">
        <section className="c-box" aria-label="Agenda à venir" style={{ flexBasis: 560 }}>
          <h2>À venir</h2>
          {!days.length ? <p className="c-empty">Aucun créneau ouvert. Utilise le formulaire au-dessus.</p> : days.map((d) => (
            <div className="agenda-day" key={d.key}>
              <h3>{d.label}</h3>
              {d.items.map((s) => (
                <div key={s.id} className={`slot${s.booked_by ? " booked" : ""}`}>
                  <span className="t">{fmtTime(s.starts_at)}</span>
                  <span className="who">
                    {s.booked_by ? <><b>{nameOf(s.booked_by)}</b><span className="c-sub"> · {s.topic || "pas de sujet précisé"}</span></> : <span className="c-sub">Libre · {s.duration_min} min</span>}
                  </span>
                  {s.booked_by ? (
                    <form action={freeSlot.bind(null, s.id)}><button className="c-btn danger">Annuler la réservation</button></form>
                  ) : (
                    <form action={deleteSlot.bind(null, s.id)}><button className="c-btn danger">Supprimer</button></form>
                  )}
                </div>
              ))}
            </div>
          ))}
        </section>

        <section className="c-box" aria-label="Appels passés">
          <h2>Appels passés (30 j)</h2>
          {!past?.length ? <p className="c-empty">Aucun appel passé.</p> : (
            <ul className="c-list">
              {past.map((c) => (
                <li key={c.id}>
                  <div><b>{nameOf(c.booked_by)}</b><div className="c-sub">{c.topic || "—"}</div></div>
                  <span className="mono c-sub" style={{ textTransform: "capitalize" }}>{fmtDay(c.starts_at)} · {fmtTime(c.starts_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
