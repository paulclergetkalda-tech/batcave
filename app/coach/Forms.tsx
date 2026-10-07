"use client";

import { useActionState } from "react";
import { addAvailability, addResult, addStudent } from "./actions";
import type { FormState } from "@/app/login/actions";

function Notice({ s }: { s: FormState }) {
  if (s?.error) return <p className="c-notice err" role="alert">{s.error}</p>;
  if (s?.ok) return <p className="c-notice ok" role="status">{s.ok}</p>;
  return null;
}

export function AddStudentForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addStudent, undefined);
  return (
    <form action={action} className="c-box" aria-label="Ajouter un élève">
      <h2>Ajouter un élève</h2>
      <div className="c-form">
        <label className="c-field">Prénom<input name="first_name" required maxLength={40} /></label>
        <label className="c-field" style={{ flexBasis: 240 }}>E-mail<input name="email" type="email" required /></label>
        <label className="c-field">Prix accompagnement (€)<input name="price" type="number" min={0} inputMode="numeric" placeholder="0" /></label>
        <button className="c-btn gold" disabled={pending} style={{ minHeight: 40 }}>{pending ? "…" : "Ajouter + envoyer son code"}</button>
      </div>
      <Notice s={state} />
    </form>
  );
}

export function AddResultForm({ students, today }: { students: { id: string; name: string }[]; today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addResult, undefined);
  return (
    <form action={action} className="c-box" aria-label="Ajouter un résultat">
      <h2>Ajouter un résultat d&apos;élève</h2>
      <p className="c-sub" style={{ margin: 0 }}>Compte directement (validé) dans le classement et la cagnotte.</p>
      <div className="c-form">
        <label className="c-field" style={{ flexBasis: 200 }}>Élève
          <select name="user_id" required defaultValue="">
            <option value="" disabled>Choisir…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="c-field">Montant (€)<input name="amount" type="number" min={1} max={100000} required inputMode="numeric" /></label>
        <label className="c-field">Date<input name="paid_on" type="date" defaultValue={today} max={today} /></label>
        <label className="c-field" style={{ flexBasis: 220 }}>Note<input name="note" maxLength={200} placeholder="Ex. : site restaurant, solde" /></label>
        <button className="c-btn gold" disabled={pending} style={{ minHeight: 40 }}>{pending ? "…" : "Ajouter"}</button>
      </div>
      <Notice s={state} />
    </form>
  );
}

export function AvailabilityForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addAvailability, undefined);
  return (
    <form action={action} className="c-box" aria-label="Ajouter des disponibilités">
      <h2>Ouvrir des créneaux</h2>
      <div className="c-form">
        <label className="c-field">Jour<input name="date" type="date" min={today} defaultValue={today} required /></label>
        <label className="c-field">De<input name="from" type="time" defaultValue="18:00" required /></label>
        <label className="c-field">À<input name="to" type="time" defaultValue="20:00" required /></label>
        <label className="c-field">Durée d&apos;un appel
          <select name="duration" defaultValue="45">
            <option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 h</option>
          </select>
        </label>
        <label className="c-field">Répéter
          <select name="weeks" defaultValue="1">
            <option value="1">Une seule fois</option><option value="2">2 semaines</option><option value="4">4 semaines</option><option value="8">8 semaines</option>
          </select>
        </label>
        <button className="c-btn gold" disabled={pending} style={{ minHeight: 40 }}>{pending ? "…" : "Ouvrir"}</button>
      </div>
      <p className="c-sub" style={{ margin: 0 }}>Ex. : de 18 h à 20 h en 45 min = 2 créneaux (18 h 00 et 18 h 45). Heure de Paris.</p>
      <Notice s={state} />
    </form>
  );
}
