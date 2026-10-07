"use client";

import { useMemo, useState, useTransition } from "react";
import { resendCode, saveCell } from "../actions";
import { eur } from "@/lib/format";
import type { StudentRow } from "@/lib/coach";

type Field = "coaching_price" | "coaching_paid" | "stage" | "notes" | "goal_amount";

function EditCell({ userId, field, value, type = "text", options, num, w }: { userId: string; field: Field; value: string | number; type?: string; options?: readonly string[]; num?: boolean; w?: string }) {
  const [v, setV] = useState(String(value ?? ""));
  const [saved, setSaved] = useState(String(value ?? ""));
  const [flash, setFlash] = useState(0);
  const [, start] = useTransition();

  const commit = (next: string) => {
    if (next === saved) return;
    start(async () => {
      const r = await saveCell(userId, field, next);
      if (r.ok) { setSaved(next); setFlash((f) => f + 1); } else setV(saved);
    });
  };

  return (
    <td className={`${num ? "num" : ""}${w ? " " + w : ""}${flash ? " saved" : ""}`} key={flash}>
      {options ? (
        <select value={v} aria-label={field} onChange={(e) => { setV(e.target.value); commit(e.target.value); }}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={v} aria-label={field} onChange={(e) => setV(e.target.value)} onBlur={() => commit(v)}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setV(saved); (e.target as HTMLInputElement).blur(); } }} />
      )}
    </td>
  );
}

const fmtDate = (d: string | null) => (d ? new Date(d.length > 10 ? d : d + "T12:00:00").toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit" }) : "—");

type Col = { key: string; label: string; get: (r: StudentRow) => string | number };
const COLS: Col[] = [
  { key: "name", label: "Élève", get: (r) => r.name.toLowerCase() },
  { key: "email", label: "E-mail", get: (r) => r.email || "" },
  { key: "stage", label: "Étape", get: (r) => r.stage },
  { key: "price", label: "Prix coaching", get: (r) => r.price },
  { key: "paid", label: "Payé", get: (r) => r.paid },
  { key: "due", label: "Paiement", get: (r) => r.price - r.paid },
  { key: "goal", label: "Objectif", get: (r) => r.goal },
  { key: "approved", label: "Encaissé validé", get: (r) => r.approved },
  { key: "pct", label: "% objectif", get: (r) => r.approved / Math.max(1, r.goal) },
  { key: "month", label: "Ce mois", get: (r) => r.month },
  { key: "pending", label: "En attente", get: (r) => r.pending },
  { key: "msgs7", label: "Msg 7 j", get: (r) => r.msgs7 },
  { key: "clients", label: "Clients", get: (r) => r.clients },
  { key: "last", label: "Dernière activité", get: (r) => r.lastActivity || "" },
  { key: "call", label: "Prochain appel", get: (r) => r.nextCall || "z" },
  { key: "visible", label: "Classement", get: (r) => (r.visible ? 1 : 0) },
  { key: "blocker", label: "Point faible", get: (r) => r.blocker || "" },
  { key: "notes", label: "Notes coach", get: (r) => r.notes },
];

export function StudentSheet({ rows, stages }: { rows: StudentRow[]; stages: readonly string[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "approved", dir: -1 });
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const list = useMemo(() => {
    const col = COLS.find((c) => c.key === sort.key)!;
    return rows
      .filter((r) => (r.name + " " + (r.email || "") + " " + (r.pseudo || "")).toLowerCase().includes(q.toLowerCase()))
      .filter((r) => !onlyUnpaid || r.price - r.paid > 0)
      .sort((a, b) => { const x = col.get(a), y = col.get(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
  }, [rows, q, sort, onlyUnpaid]);

  const sum = (f: (r: StudentRow) => number) => list.reduce((s, r) => s + f(r), 0);

  const exportCsv = () => {
    const head = ["Élève", "E-mail", "Étape", "Prix coaching", "Payé", "Reste à payer", "Objectif", "Encaissé validé", "Ce mois", "En attente", "Messages 7 j", "Clients", "Dernière activité", "Prochain appel", "Classement", "Point faible", "Notes"];
    const lines = list.map((r) => [r.name, r.email || "", r.stage, r.price, r.paid, Math.max(0, r.price - r.paid), r.goal, r.approved, r.month, r.pending, r.msgs7, r.clients, r.lastActivity || "", r.nextCall || "", r.visible ? "Visible" : "Anonyme", r.blocker || "", r.notes]);
    const csv = [head, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `batcav-eleves-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const header = (c: Col, extra = "") => (
    <th key={c.key} className={extra} aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? ((-s.dir) as 1 | -1) : -1 }))}>
        {c.label}{sort.key === c.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="sheet-tools">
        <label className="sr-only" htmlFor="sheet-q">Rechercher</label>
        <input id="sheet-q" placeholder="Rechercher un élève…" value={q} onChange={(e) => setQ(e.target.value)} />
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--c-muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={onlyUnpaid} onChange={(e) => setOnlyUnpaid(e.target.checked)} style={{ accentColor: "#E8B64C" }} />
          Paiement pas encore soldé
        </label>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--c-muted)" }}>{list.length} élève{list.length > 1 ? "s" : ""} · clique un titre pour trier · les cellules claires se modifient</span>
        <button type="button" className="c-btn" onClick={exportCsv}>Exporter (Excel / CSV)</button>
      </div>
      {sent && <p className="c-notice ok" role="status">Code renvoyé à {sent}.</p>}

      <div className="sheet-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th className="rownum">#</th>
              {COLS.map((c, i) => header(c, i === 0 ? "sticky-col" : ""))}
              <th><span style={{ display: "block", padding: "10px" }}>Accès</span></th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => {
              const rest = r.price - r.paid;
              const pct = Math.min(100, Math.round((r.approved / Math.max(1, r.goal)) * 100));
              return (
                <tr key={r.id}>
                  <td className="rownum">{i + 1}</td>
                  <td className="sticky-col"><div className="cell">{r.name}{r.pseudo && <span className="c-sub">· {r.pseudo}</span>}{!r.onboarded && <span className="c-pill mute">jamais connecté</span>}</div></td>
                  <td><div className="cell c-sub">{r.email || "—"}</div></td>
                  <EditCell userId={r.id} field="stage" value={r.stage} options={stages} w="w-stage" />
                  <EditCell userId={r.id} field="coaching_price" value={r.price} type="number" num w="w-num" />
                  <EditCell userId={r.id} field="coaching_paid" value={r.paid} type="number" num w="w-num" />
                  <td><div className="cell">{r.price === 0 ? <span className="c-pill mute">—</span> : rest <= 0 ? <span className="c-pill ok">Soldé</span> : <span className={`c-pill ${r.paid > 0 ? "warn" : "bad"}`}>Reste {eur(rest)}</span>}</div></td>
                  <EditCell userId={r.id} field="goal_amount" value={r.goal} type="number" num w="w-num" />
                  <td className="num"><div className="cell">{eur(r.approved)}</div></td>
                  <td><div className="cell"><span className="meter"><i style={{ width: `${pct}%` }} /></span><span className="mono">{pct} %</span></div></td>
                  <td className="num"><div className="cell">{eur(r.month)}</div></td>
                  <td className="num"><div className="cell" style={{ color: r.pending ? "var(--c-gold)" : undefined }}>{r.pending ? eur(r.pending) : "—"}</div></td>
                  <td className="num"><div className="cell">{r.msgs7}</div></td>
                  <td className="num"><div className="cell">{r.clients}</div></td>
                  <td><div className="cell">{fmtDate(r.lastActivity)}</div></td>
                  <td><div className="cell">{r.nextCall ? new Date(r.nextCall).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</div></td>
                  <td><div className="cell">{r.visible ? <span className="c-pill ok">Visible</span> : <span className="c-pill mute">Anonyme</span>}</div></td>
                  <td><div className="cell c-sub">{r.blocker || "—"}</div></td>
                  <EditCell userId={r.id} field="notes" value={r.notes} w="w-notes" />
                  <td><div className="cell">{r.email && <button type="button" className="c-btn" onClick={async () => { await resendCode(r.email!); setSent(r.email); }}>Renvoyer le code</button>}</div></td>
                </tr>
              );
            })}
          </tbody>
          {list.length > 0 && (
            <tfoot>
              <tr>
                <td className="rownum">Σ</td>
                <td className="sticky-col"><div className="cell">Total</div></td>
                <td /><td />
                <td className="num"><div className="cell">{eur(sum((r) => r.price))}</div></td>
                <td className="num"><div className="cell">{eur(sum((r) => r.paid))}</div></td>
                <td><div className="cell">Reste {eur(sum((r) => Math.max(0, r.price - r.paid)))}</div></td>
                <td />
                <td className="num"><div className="cell">{eur(sum((r) => r.approved))}</div></td>
                <td />
                <td className="num"><div className="cell">{eur(sum((r) => r.month))}</div></td>
                <td className="num"><div className="cell">{eur(sum((r) => r.pending))}</div></td>
                <td className="num"><div className="cell">{sum((r) => r.msgs7)}</div></td>
                <td className="num"><div className="cell">{sum((r) => r.clients)}</div></td>
                <td colSpan={6} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {rows.length === 0 && <p className="c-empty">Aucun élève pour l&apos;instant. Ajoute ton premier élève ci-dessus.</p>}
    </div>
  );
}
