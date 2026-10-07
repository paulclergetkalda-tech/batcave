"use client";

import { useActionState, useState } from "react";
import { completeOnboarding } from "./actions";
import type { FormState } from "@/app/login/actions";

type Q = { key: string; title: string; hint: string; multi: boolean; options: [string, string][] };

const QUESTIONS: Q[] = [
  { key: "situation", title: "Tu fais quoi à côté ?", hint: "Pour caler ton programme sur ton vrai emploi du temps.", multi: false, options: [
    ["Je suis au lycée", "Cours en journée, dispo le soir"], ["Je suis étudiant", "Emploi du temps variable"],
    ["Je travaille", "Job à temps plein ou partiel"], ["Je suis à fond dessus", "Disponible toute la journée"] ] },
  { key: "hours_per_week", title: "Combien d'heures par semaine ?", hint: "Le vrai chiffre, pas celui que tu aimerais.", multi: false, options: [
    ["5 h", "Le minimum pour avancer"], ["10 h", "Environ 1 h 30 par jour"], ["15 h", "Rythme sérieux"], ["20 h et plus", "Mode accéléré"] ] },
  { key: "target", title: "À qui tu veux vendre des sites ?", hint: "Une ou deux cibles. Tu pourras changer avec ton coach.", multi: true, options: [
    ["Restaurants", "Menu, réservation, avis"], ["Artisans", "Plombiers, garages…"], ["Coachs et indépendants", "Sport, bien-être"],
    ["Commerces locaux", "Boutiques, salons"], ["Je ne sais pas encore", "On choisira ensemble"] ] },
  { key: "blocker", title: "Qu'est-ce qui te bloque le plus ?", hint: "Ton agent te poussera surtout là-dessus.", multi: true, options: [
    ["Je repousse tout", "Je sais quoi faire mais je ne le fais pas"], ["Trouver des clients", "Prospecter me fait peur"],
    ["Fixer mes prix", "Je ne sais pas combien demander"], ["La technique", "Faire un beau site"], ["La régularité", "Je commence fort puis je lâche"] ] },
];

export function OnboardingForm({ defaultFirstName }: { defaultFirstName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(completeOnboarding, undefined);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [firstName, setFirstName] = useState(defaultFirstName);
  const total = QUESTIONS.length + 2;

  const q = step >= 1 && step <= QUESTIONS.length ? QUESTIONS[step - 1] : null;
  const canNext = step === 0 ? firstName.trim().length > 0 : q ? (answers[q.key] || []).length > 0 : true;

  const pick = (key: string, label: string, multi: boolean) =>
    setAnswers((a) => {
      const cur = a[key] || [];
      const next = multi ? (cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label]) : [label];
      return { ...a, [key]: next };
    });

  return (
    <form action={action} className="auth-card" style={{ maxWidth: 720 }}>
      <div className="steps" aria-hidden="true"><div style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
      <span className="mono small" style={{ color: "var(--muted)" }}>ÉTAPE {step + 1} / {total}</span>

      {/* Les valeurs restent dans le formulaire même quand l'étape est masquée */}
      {QUESTIONS.map((qq) => <input key={qq.key} type="hidden" name={qq.key} value={(answers[qq.key] || []).join(", ")} />)}

      <div style={{ display: step === 0 ? "flex" : "none", flexDirection: "column", gap: 18 }}>
        <h1>Bienvenue<br /><span>dans la Batcav.</span></h1>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.55 }}>Quelques questions pour régler ton espace et ton agent. Sois honnête : il ne peut t'aider que s'il sait la vérité.</p>
        <label className="field">Ton prénom
          <input name="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={40} />
        </label>
        <label className="field">Pseudo pour le classement (facultatif)
          <input name="pseudo" maxLength={30} placeholder="Laisse vide pour utiliser ton prénom" />
        </label>
      </div>

      {q && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h1 style={{ fontSize: 40 }}>{q.title}</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>{q.hint}</p>
          <div className="choices" role="group" aria-label={q.title}>
            {q.options.map(([label, sub]) => (
              <button type="button" key={label} className="choice" aria-pressed={(answers[q.key] || []).includes(label)} onClick={() => pick(q.key, label, q.multi)}>
                <b>{label}</b><small>{sub}</small>
              </button>
            ))}
          </div>
          <span className="mono small" style={{ color: "var(--muted)" }}>{q.multi ? "PLUSIEURS CHOIX POSSIBLES" : "UN SEUL CHOIX"}</span>
        </div>
      )}

      <div style={{ display: step === total - 1 ? "flex" : "none", flexDirection: "column", gap: 18 }}>
        <h1>Dernière chose.<br /><span>Le classement.</span></h1>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.55 }}>
          Le tableau de bord affiche un classement des membres selon l'argent encaissé. Tu choisis si les autres voient ton nom (ou ton pseudo) et tes montants. Sinon tu apparais en « Membre anonyme ». Tu pourras changer d'avis à tout moment.
        </p>
        <label className="check">
          <input type="checkbox" name="show_in_leaderboard" />
          J'accepte que mon prénom (ou pseudo) et mes montants validés soient visibles par les autres membres.
        </label>
      </div>

      {state?.error && <p className="notice err" role="alert">{state.error}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        {step > 0 ? <button type="button" className="btn" onClick={() => setStep((s) => s - 1)}>← Retour</button> : <span />}
        {step < total - 1 ? (
          <button type="button" className="btn btn-solid" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Suivant →</button>
        ) : (
          <button className="btn btn-solid" disabled={pending}>{pending ? "Enregistrement…" : "Ouvrir mon tableau de bord →"}</button>
        )}
      </div>
    </form>
  );
}
