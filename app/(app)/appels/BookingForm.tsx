"use client";

import { useActionState, useState } from "react";
import { bookSlot } from "./actions";
import type { FormState } from "@/app/login/actions";

type Day = { key: string; label: string; slots: { id: number; time: string; duration: number }[] };

export function BookingForm({ days }: { days: Day[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(bookSlot, undefined);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<number | null>(null);

  if (!days.length) return <p className="small" style={{ margin: 0, color: "var(--muted)" }}>Aucun créneau disponible pour le moment. Ton coach en ajoute régulièrement : repasse bientôt.</p>;
  const day = days[Math.min(dayIdx, days.length - 1)];

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="choices" role="tablist" aria-label="Jours" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
        {days.map((d, i) => (
          <button key={d.key} type="button" role="tab" aria-selected={i === dayIdx} aria-pressed={i === dayIdx} className="choice" style={{ minHeight: 64 }}
            onClick={() => { setDayIdx(i); setSlot(null); }}>
            <b style={{ textTransform: "capitalize" }}>{d.label}</b><small>{d.slots.length} créneau{d.slots.length > 1 ? "x" : ""}</small>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }} role="group" aria-label="Créneaux">
        {day.slots.map((s) => (
          <button key={s.id} type="button" className="choice" aria-pressed={slot === s.id} onClick={() => setSlot(s.id)}
            style={{ minHeight: 52, flex: "0 0 auto", alignItems: "center", fontFamily: "var(--mono)" }}>
            <b>{s.time}</b><small>{s.duration} min</small>
          </button>
        ))}
      </div>
      <input type="hidden" name="slot_id" value={slot ?? ""} />
      <label className="field">De quoi tu veux parler ? (facultatif)
        <textarea name="topic" maxLength={300} placeholder="Ex. : un prospect m'a dit « trop cher », je réponds quoi ?" />
      </label>
      {state?.error && <p className="notice err" role="alert">{state.error}</p>}
      {state?.ok && <p className="notice ok" role="status">{state.ok}</p>}
      <button className="btn btn-solid" disabled={!slot || pending} style={{ alignSelf: "flex-start" }}>{pending ? "…" : "Réserver ce créneau"}</button>
    </form>
  );
}
