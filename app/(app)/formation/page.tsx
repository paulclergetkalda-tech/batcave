import Link from "next/link";
import { requireStudent } from "@/lib/session";
import { getProgress } from "@/lib/progress";
import { FORMATION, TOTAL_LESSONS, nextLesson } from "@/lib/formation";

export const metadata = { title: "Formation — Batcav" };
export const dynamic = "force-dynamic";

export default async function FormationPage() {
  const { supabase, profile } = await requireStudent();
  const progress = await getProgress(supabase, profile.id);
  const done = new Set(progress.map((p) => p.lesson_slug));
  const doneCount = FORMATION.flatMap((m) => m.lessons).filter((l) => done.has(l.slug)).length;
  const pct = Math.round((doneCount / TOTAL_LESSONS) * 100);
  const next = nextLesson(done);
  const totalMin = FORMATION.flatMap((m) => m.lessons).reduce((s, l) => s + l.minutes, 0);

  return (
    <main className="f-page">
      <div className="f-inner">
        <header className="f-head">
          <div>
            <span className="f-kicker">Formation Batcav</span>
            <h1>Tout ce qu&apos;il faut pour<br /><span>tes premiers 1 500 €.</span></h1>
            <p className="f-sub">{TOTAL_LESSONS} leçons de 2-3 minutes · {totalMin} min au total · un quiz ou un résumé après chaque vidéo.</p>
          </div>
          <div className="f-progress" aria-label={`Progression : ${doneCount} leçons sur ${TOTAL_LESSONS}`}>
            <div className="f-ring" style={{ ["--p" as string]: pct }}><b>{pct}%</b></div>
            <div><b>{doneCount} / {TOTAL_LESSONS}</b><small>leçons terminées</small></div>
          </div>
        </header>

        {next ? (
          <Link href={`/formation/${next.slug}`} className="f-resume">
            <span className="f-play" aria-hidden="true"><svg width="18" height="20" viewBox="0 0 18 20"><path d="M2 1.5l14 8.5-14 8.5z" fill="currentColor" /></svg></span>
            <span className="f-resume-txt">
              <small>{doneCount === 0 ? "Commencer" : "Reprendre"} · {next.moduleLabel}</small>
              <b>{next.title}</b>
            </span>
            <span className="f-resume-go">{next.minutes} min →</span>
          </Link>
        ) : (
          <div className="f-resume done"><span className="f-resume-txt"><small>Bravo</small><b>Tu as terminé toute la formation. Maintenant, on encaisse.</b></span></div>
        )}

        <div className="f-modules">
          {FORMATION.map((m) => {
            const mDone = m.lessons.filter((l) => done.has(l.slug)).length;
            return (
              <section key={m.id} className="f-module" aria-labelledby={`m-${m.id}`}>
                <div className="f-module-head">
                  <div>
                    <span className="f-mlabel">{m.label}</span>
                    <h2 id={`m-${m.id}`}>{m.title}</h2>
                    <p>{m.pitch}</p>
                  </div>
                  <span className="f-mcount">{mDone}/{m.lessons.length}</span>
                </div>
                <div className="bar thin f-mbar"><div style={{ width: `${(mDone / m.lessons.length) * 100}%` }} /></div>
                <ol className="f-lessons">
                  {m.lessons.map((l, i) => {
                    const isDone = done.has(l.slug);
                    const isNext = next?.slug === l.slug;
                    return (
                      <li key={l.slug}>
                        <Link href={`/formation/${l.slug}`} className={`f-lesson${isDone ? " is-done" : ""}${isNext ? " is-next" : ""}`}>
                          <span className="f-num">{isDone ? "✓" : i + 1}</span>
                          <span className="f-ltitle">{l.title}{!l.video && <em> · vidéo bientôt</em>}</span>
                          <span className={`f-type ${l.after}`}>{l.after === "quiz" ? "Quiz" : "Résumé"}</span>
                          <span className="f-min">{l.minutes} min</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
