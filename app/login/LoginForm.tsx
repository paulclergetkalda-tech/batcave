"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { requestCode, resendCode, verifyCode, type FormState } from "./actions";

const COOLDOWN = 60; // Supabase autorise 1 envoi par minute et par adresse

export function LoginForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [reqState, reqAction, reqPending] = useActionState<FormState, FormData>(requestCode, undefined);
  const [codeState, codeAction, codePending] = useActionState<FormState, FormData>(verifyCode, undefined);
  // Arrivé depuis le bouton de l'e-mail : on va directement à la saisie du code reçu
  const [step, setStep] = useState<"email" | "code">(initialEmail ? "code" : "email");
  const [email, setEmail] = useState(initialEmail);
  const [info, setInfo] = useState(initialEmail ? "Entre le code reçu dans ton e-mail." : "");
  const [emailError, setEmailError] = useState("");

  // Renvoi du code
  const [wait, setWait] = useState(0);
  const [resendMsg, setResendMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [resending, startResend] = useTransition();

  useEffect(() => {
    if (reqState?.step === "code" && reqState.email) {
      setEmail(reqState.email);
      setInfo(reqState.ok || "");
      setResendMsg(null);
      setWait(COOLDOWN);
      setStep("code");
    }
  }, [reqState]);

  // Compte à rebours avant de pouvoir renvoyer
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const resend = () => {
    startResend(async () => {
      const res = await resendCode(email);
      setResendMsg(res);
      setWait(res.wait ?? (res.error ? 0 : COOLDOWN));
    });
  };

  // "J'ai déjà un code" : pas de nouvel envoi (un nouveau code annulerait l'ancien)
  const useExistingCode = () => {
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setEmailError("Entre d'abord ton e-mail."); return; }
    setEmailError("");
    setEmail(v);
    setInfo("Entre le dernier code que tu as reçu par e-mail.");
    setResendMsg(null);
    setStep("code");
  };

  if (step === "code") {
    return (
      <form action={codeAction} className="auth-card" aria-label="Entrer le code">
        <span className="pill" style={{ alignSelf: "flex-start" }}><span className="pill-chip">Étape 2/2</span>Ton code d&apos;accès</span>
        <h1>Ton code<br /><span>d&apos;accès.</span></h1>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
          {info || "Entre le code reçu par e-mail."} <br />E-mail : <b style={{ color: "var(--ink)" }}>{email}</b>
        </p>
        <input type="hidden" name="email" value={email} />
        <label className="field">Code reçu par e-mail
          <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,12}" required autoFocus
            placeholder="123456" style={{ fontSize: 26, letterSpacing: "0.3em", fontFamily: "var(--mono)", textAlign: "center", minHeight: 60 }} />
        </label>
        {codeState?.error && <p className="notice err" role="alert">{codeState.error}</p>}
        <button className="btn btn-solid" style={{ minHeight: 50 }} disabled={codePending}>{codePending ? "Vérification…" : "Entrer"}</button>

        <div style={{ display: "grid", gap: 8, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>Pas reçu l&apos;e-mail ? Regarde dans tes spams, sinon :</span>
          <button type="button" className="btn" style={{ minHeight: 46 }} onClick={resend} disabled={resending || wait > 0}>
            {resending ? "Envoi…" : wait > 0 ? `Renvoyer le code (dans ${wait} s)` : "Renvoyer le code"}
          </button>
          {resendMsg?.ok && <p className="notice ok" role="status">{resendMsg.ok} Utilise le code le plus récent : les anciens ne marchent plus.</p>}
          {resendMsg?.error && <p className="notice err" role="alert">{resendMsg.error}</p>}
          <button type="button" className="link-quiet" onClick={() => { setResendMsg(null); setStep("email"); }}>Changer d&apos;adresse e-mail</button>
        </div>
      </form>
    );
  }

  return (
    <form action={reqAction} className="auth-card" aria-label="Connexion">
      <span className="pill" style={{ alignSelf: "flex-start" }}><span className="pill-chip">Accès réservé</span>Membres de la Batcav</span>
      <h1>Entre dans<br /><span>la Batcav.</span></h1>
      <label className="field">Ton e-mail
        <input name="email" type="email" autoComplete="email" required placeholder="toi@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {(reqState?.error || emailError) && <p className="notice err" role="alert">{emailError || reqState?.error}</p>}
      <button className="btn btn-solid" style={{ minHeight: 50 }} disabled={reqPending}>{reqPending ? "Envoi…" : "Recevoir mon code"}</button>
      <button type="button" className="link-quiet" onClick={useExistingCode}>J&apos;ai déjà un code →</button>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
        Pas de mot de passe : tu te connectes avec un code reçu par e-mail. Le code de ton e-mail d&apos;inscription marche aussi (valable 1 h).
      </p>
    </form>
  );
}
