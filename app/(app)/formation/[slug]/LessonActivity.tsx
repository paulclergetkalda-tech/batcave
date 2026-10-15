"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeLesson } from "../actions";
import type { QuizQuestion } from "@/lib/formation";

type Props = {
  slug: string;
  kind: "quiz" | "resume";
  resume: string[];
  quiz: QuizQuestion[];
  alreadyDone: boolean;
  next: { slug: string; title: string } | null;
};

export function LessonActivity({ slug, kind, resume, quiz, alreadyDone, next }: Props) {
  const [saved, setSaved] = useState(alreadyDone);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [picks, setPicks] = useState<(number | null)[]>(quiz.map(() => null));
  const [checked, setChecked] = useState(false);

  const score = quiz.reduce((s, q, i) => s + (picks[i] === q.answer ? 1 : 0), 0);
  const allAnswered = picks.every((p) => p !== null);

  const save = (sc?: number, total?: number) =>
    start(async () => {
      setError("");
      const res = await completeLesson(slug, sc, total);
      if (res.ok) setSaved(true);
      else setError(res.error || "Erreur.");
    });

  const done = (
    <div className="f-done">
      <p><b>Leçon terminée.</b> {next ? "On enchaîne ?" : "Tu as fini le programme."}</p>
      {next ? (
        <Link href={`/formation/${next.slug}`} className="btn btn-solid">Leçon suivante : {next.title} →</Link>
      ) : (
        <Link href="/formation" className="btn btn-solid">Retour au programme</Link>
      )}
    </div>
  );

  if (kind === "resume") {
    return (
      <section className="f-activity" aria-labelledby="act-title">
        <div className="f-act-head"><span className="f-type resume">Résumé</span><h2 id="act-title">À retenir</h2></div>
        <ul className="f-resume-list">{resume.map((r, i) => <li key={i}>{r}</li>)}</ul>
        {error && <p className="notice err" role="alert">{error}</p>}
        {saved ? done : <button type="button" className="btn btn-solid" onClick={() => save()} disabled={pending}>{pending ? "Enregistrement…" : "J'ai compris, leçon terminée"}</button>}
      </section>
    );
  }

  return (
    <section className="f-activity" aria-labelledby="act-title">
      <div className="f-act-head"><span className="f-type quiz">Quiz</span><h2 id="act-title">Mini quiz · {quiz.length} question{quiz.length > 1 ? "s" : ""}</h2></div>
      <ol className="f-quiz">
        {quiz.map((q, qi) => (
          <li key={qi}>
            <p className="f-q">{q.q}</p>
            <div className="f-opts" role="radiogroup" aria-label={q.q}>
              {q.options.map((o, oi) => {
                const picked = picks[qi] === oi;
                const state = checked ? (oi === q.answer ? " right" : picked ? " wrong" : "") : picked ? " picked" : "";
                return (
                  <button key={oi} type="button" role="radio" aria-checked={picked} className={`f-opt${state}`} disabled={checked}
                    onClick={() => setPicks((p) => p.map((v, i) => (i === qi ? oi : v)))}>
                    <span className="f-opt-dot" aria-hidden="true" />{o}
                  </button>
                );
              })}
            </div>
            {checked && q.why && <p className="f-why">{q.why}</p>}
          </li>
        ))}
      </ol>
      {error && <p className="notice err" role="alert">{error}</p>}
      {!checked ? (
        <button type="button" className="btn btn-solid" disabled={!allAnswered} onClick={() => setChecked(true)}>Vérifier mes réponses</button>
      ) : (
        <div className="f-score">
          <p><b>{score} / {quiz.length}</b> {score === quiz.length ? "Parfait." : "Regarde les bonnes réponses en vert."}</p>
          {saved ? done : (
            <div className="actions">
              <button type="button" className="btn btn-solid" onClick={() => save(score, quiz.length)} disabled={pending}>{pending ? "Enregistrement…" : "Valider la leçon"}</button>
              <button type="button" className="btn" onClick={() => { setChecked(false); setPicks(quiz.map(() => null)); }}>Recommencer</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
