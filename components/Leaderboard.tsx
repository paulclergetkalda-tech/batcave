"use client";

import { useState } from "react";
import { eur } from "@/lib/format";
import type { LeaderRow } from "@/lib/dashboard";

const AVATARS = ["#F2D78A", "#C9D6EA", "#D9B99B"];

export function Leaderboard({ month, all }: { month: LeaderRow[]; all: LeaderRow[] }) {
  const [period, setPeriod] = useState<"month" | "all">("month");
  const rows = period === "month" ? month : all;

  const meIdx = rows.findIndex((r) => r.is_me);
  const me = rows[meIdx];
  const ahead = meIdx > 0 ? rows[meIdx - 1] : null;
  let gapText = "";
  if (me && ahead && ahead.amount > me.amount) gapText = `Tu es ${me.rank}e. Encore ${eur(ahead.amount - me.amount)} pour passer devant ${ahead.name}.`;
  else if (me && me.rank === 1 && me.amount > 0) gapText = "Tu es 1er. Ne lâche rien, ils arrivent.";
  else if (me && me.amount === 0) gapText = "Ton premier paiement validé te fait entrer dans la course.";

  const top = rows.slice(0, 3);
  // ordre visuel du podium : 2e, 1er, 3e
  const podium = [top[1], top[0], top[2]].map((r, k) => ({ r, place: [2, 1, 3][k], h: [92, 128, 70][k] }));

  return (
    <article className="card card-dark" aria-label="Classement">
      <div className="card-head">
        <h2>Classement</h2>
        <div className="seg" role="tablist" aria-label="Période">
          <button role="tab" aria-selected={period === "month"} onClick={() => setPeriod("month")}>Ce mois</button>
          <button role="tab" aria-selected={period === "all"} onClick={() => setPeriod("all")}>Depuis le début</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="empty">Le classement démarre dès le premier paiement validé.</p>
      ) : (
        <>
          <div className="podium">
            {podium.map(({ r, place, h }) =>
              r ? (
                <div className="podium-col" key={place}>
                  <span className="avatar" style={{ background: AVATARS[place - 1] }}>{r.name[0]?.toUpperCase()}</span>
                  <span className="podium-name">{r.is_me ? `${r.name} (toi)` : r.name}</span>
                  <span className="podium-amount">{eur(r.amount)}</span>
                  <div className={`podium-bar${place === 1 ? " first" : ""}`} style={{ height: h }}>{place}</div>
                </div>
              ) : <div key={place} />
            )}
          </div>
          {rows.length > 3 && (
            <ol className="ranks">
              {rows.slice(3, 10).map((r, i) => (
                <li key={i} className={`rank-row${r.is_me ? " me" : ""}`}>
                  <span className="r">{r.rank}</span>
                  <span className="n">{r.is_me ? `Toi · ${r.name}` : r.name}</span>
                  <span className="a">{eur(r.amount)}</span>
                </li>
              ))}
              {me && meIdx >= 10 && (
                <li className="rank-row me">
                  <span className="r">{me.rank}</span><span className="n">Toi · {me.name}</span><span className="a">{eur(me.amount)}</span>
                </li>
              )}
            </ol>
          )}
        </>
      )}
      {gapText && <p className="callout">{gapText}</p>}
    </article>
  );
}
