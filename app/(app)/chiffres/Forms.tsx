"use client";

import { useActionState, useState } from "react";
import { declarePayment, logActivity, updateSettings, deletePendingPayment } from "./actions";
import type { FormState } from "@/app/login/actions";

function Notice({ s }: { s: FormState }) {
  if (s?.error) return <p className="notice err" role="alert">{s.error}</p>;
  if (s?.ok) return <p className="notice ok" role="status">{s.ok}</p>;
  return null;
}

export function PaymentForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(declarePayment, undefined);
  return (
    <form action={action} className="panel" aria-label="Déclarer un paiement">
      <h2>Déclarer un paiement reçu</h2>
      <label className="field">Montant (€)
        <input name="amount" type="number" min={1} max={100000} inputMode="numeric" required placeholder="Ex. : 350" />
      </label>
      <label className="field">Date du paiement
        <input name="paid_on" type="date" defaultValue={today} max={today} />
      </label>
      <label className="field">Note
        <input name="note" maxLength={200} placeholder="Ex. : acompte site du garage" />
      </label>
      <Notice s={state} />
      <button className="btn btn-solid" disabled={pending}>{pending ? "…" : "Déclarer"}</button>
      <p className="small" style={{ margin: 0, color: "var(--muted)" }}>Ton coach valide chaque paiement avant qu'il compte dans le classement. Garde la preuve (virement, facture).</p>
    </form>
  );
}

export function ActivityForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(logActivity, undefined);
  const [kind, setKind] = useState("messages");
  return (
    <form action={action} className="panel" aria-label="Noter mon activité">
      <h2>Noter mon activité du jour</h2>
      <label className="field">Type
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="messages">Messages de prospection envoyés</option>
          <option value="client">Client signé</option>
        </select>
      </label>
      <label className="field">{kind === "client" ? "Nombre de clients" : "Nombre de messages"}
        <input name="qty" type="number" min={1} max={1000} inputMode="numeric" required defaultValue={kind === "client" ? 1 : undefined} key={kind} placeholder="Ex. : 20" />
      </label>
      <label className="field">Note
        <input name="note" maxLength={200} placeholder={kind === "client" ? "Ex. : restaurant Le Central" : "Ex. : artisans du quartier"} />
      </label>
      <Notice s={state} />
      <button className="btn btn-solid" disabled={pending}>{pending ? "…" : "Ajouter"}</button>
    </form>
  );
}

export function SettingsForm({ pseudo, visible }: { pseudo: string; visible: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateSettings, undefined);
  return (
    <form action={action} className="panel" aria-label="Mes réglages">
      <h2>Classement : ma visibilité</h2>
      <label className="field">Pseudo (facultatif)
        <input name="pseudo" defaultValue={pseudo} maxLength={30} placeholder="Sinon ton prénom est utilisé" />
      </label>
      <label className="check">
        <input type="checkbox" name="show_in_leaderboard" defaultChecked={visible} />
        Les autres membres voient mon nom et mes montants validés. Sinon j'apparais en « Membre anonyme ».
      </label>
      <Notice s={state} />
      <button className="btn" disabled={pending}>{pending ? "…" : "Enregistrer"}</button>
    </form>
  );
}

export function DeletePending({ id }: { id: number }) {
  return (
    <form action={deletePendingPayment.bind(null, id)}>
      <button className="btn btn-sm" aria-label="Supprimer ce paiement en attente">Supprimer</button>
    </form>
  );
}
