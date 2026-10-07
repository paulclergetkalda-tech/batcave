"use client";

import { useActionState, useEffect, useState } from "react";
import { requestCode, verifyCode, type FormState } from "./actions";

export function LoginForm() {
  const [reqState, reqAction, reqPending] = useActionState<FormState, FormData>(requestCode, undefined);
  const [codeState, codeAction, codePending] = useActionState<FormState, FormData>(verifyCode, undefined);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (reqState?.step === "code" && reqState.email) { setEmail(reqState.email); setStep("code"); }
  }, [reqState]);

  if (step === "code") {
    return (
      <form action={codeAction} className="auth-card" aria-label="Entrer le code">
        <span className="pill" style={{ alignSelf: "flex-start" }}><span className="pill-chip">Étape 2/2</span>Vérifie tes e-mails</span>
        <h1>Ton code<br /><span>d&apos;accès.</span></h1>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
          Envoyé à <b style={{ color: "var(--ink)" }}>{email}</b>. Regarde aussi dans tes spams.
        </p>
        <input type="hidden" name="email" value={email} />
        <label className="field">Code reçu par e-mail
          <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,12}" required autoFocus
            placeholder="123456" style={{ fontSize: 26, letterSpacing: "0.3em", fontFamily: "var(--mono)", textAlign: "center", minHeight: 60 }} />
        </label>
        {codeState?.error && <p className="notice err" role="alert">{codeState.error}</p>}
        <button className="btn btn-solid" style={{ minHeight: 50 }} disabled={codePending}>{codePending ? "Vérification…" : "Entrer"}</button>
        <button type="button" className="link-quiet" onClick={() => setStep("email")}>← Changer d&apos;e-mail ou renvoyer un code</button>
      </form>
    );
  }

  return (
    <form action={reqAction} className="auth-card" aria-label="Connexion">
      <span className="pill" style={{ alignSelf: "flex-start" }}><span className="pill-chip">Accès réservé</span>Membres de la Batcav</span>
      <h1>Entre dans<br /><span>la Batcav.</span></h1>
      <label className="field">Ton e-mail
        <input name="email" type="email" autoComplete="email" required placeholder="toi@exemple.fr" defaultValue={reqState?.email || ""} />
      </label>
      {reqState?.error && <p className="notice err" role="alert">{reqState.error}</p>}
      <button className="btn btn-solid" style={{ minHeight: 50 }} disabled={reqPending}>{reqPending ? "Envoi…" : "Recevoir mon code"}</button>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
        Pas de mot de passe : à chaque connexion, tu reçois un code à usage unique par e-mail.
      </p>
    </form>
  );
}
