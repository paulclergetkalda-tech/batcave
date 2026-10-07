"use client";

import { useOptimistic, useTransition } from "react";
import { toggleMission } from "@/app/(app)/dashboard/actions";
import type { Mission } from "@/lib/dashboard";

export function Missions({ missions }: { missions: Mission[] }) {
  const [, startTransition] = useTransition();
  const [items, setItem] = useOptimistic(missions, (state, upd: { id: number; done: boolean }) =>
    state.map((m) => (m.id === upd.id ? { ...m, done: upd.done } : m))
  );
  const doneCount = items.filter((m) => m.done).length;

  return (
    <article className="card card-sage" aria-label="Missions du jour">
      <div className="card-head">
        <h2>Missions du jour</h2>
        <span className="mono small">{doneCount}/{items.length}</span>
      </div>
      <ul className="missions">
        {items.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              className="mission"
              aria-pressed={m.done}
              onClick={() => startTransition(async () => { setItem({ id: m.id, done: !m.done }); await toggleMission(m.id, !m.done); })}
            >
              <span className="dot" />{m.label}
            </button>
          </li>
        ))}
      </ul>
      {items.length > 0 && doneCount === items.length && <p className="small" style={{ margin: 0, fontWeight: 600 }}>Tout est fait. Respect. Demain on remet ça.</p>}
    </article>
  );
}
