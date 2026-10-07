"use client";

import { useEffect, useRef, useState } from "react";
import { BatLogo } from "./BatLogo";

type Msg = { me: boolean; text: string };
const CHIPS = ["Comment passer devant ?", "Je suis perdu", "Motive-moi", "Combien je facture ?"];

export function AgentDrawer() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const loaded = useRef(false);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("batcav:agent", onOpen);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("batcav:agent", onOpen); window.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 300);
    if (loaded.current) return;
    loaded.current = true;
    setTyping(true);
    fetch("/api/agent")
      .then((r) => r.json())
      .then((j) => setMsgs([{ me: false, text: j.reply }]))
      .catch(() => setMsgs([{ me: false, text: "Salut. Dis-moi où tu en es." }]))
      .finally(() => setTyping(false));
  }, [open]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, typing]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || typing) return;
    setDraft("");
    setMsgs((m) => [...m, { me: true, text: q }]);
    setTyping(true);
    try {
      const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q }) });
      const json = await res.json();
      setMsgs((m) => [...m, { me: false, text: json.reply || "Je n'ai pas compris, reformule." }]);
    } catch {
      setMsgs((m) => [...m, { me: false, text: "Connexion perdue. Réessaie dans un instant." }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <>
      {!open && (
        <button type="button" className="agent-fab" onClick={() => setOpen(true)} aria-label="Ouvrir l'agent IA">
          <span className="live-dot" />Ton agent
        </button>
      )}
      <aside className={`drawer${open ? " open" : ""}`} aria-label="Agent IA" aria-hidden={!open} inert={!open}>
        <header className="drawer-head">
          <div className="drawer-id">
            <span className="drawer-badge"><BatLogo size={22} color="#F4F7FB" /></span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Ton agent</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Réglé sur tes objectifs · mode simple</div>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Fermer l'agent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <div className="chat" ref={chatRef} aria-live="polite">
          {msgs.map((m, i) => <p key={i} className={`msg ${m.me ? "me" : "bot"}`}>{m.text}</p>)}
          {typing && <div className="typing" aria-label="L'agent écrit"><span /><span /><span /></div>}
        </div>
        <div className="chips">
          {CHIPS.map((c) => <button key={c} type="button" className="chip" onClick={() => send(c)}>{c}</button>)}
        </div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          <label className="sr-only" htmlFor="agent-input">Ton message</label>
          <input id="agent-input" ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Dis-lui où tu bloques…" maxLength={1000} />
          <button className="send" aria-label="Envoyer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </form>
      </aside>
    </>
  );
}
