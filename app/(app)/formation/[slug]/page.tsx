import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/session";
import { getProgress } from "@/lib/progress";
import { FORMATION, findLesson } from "@/lib/formation";
import { LessonActivity } from "./LessonActivity";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${findLesson(slug)?.lesson.title || "Leçon"} — Batcav` };
}

// Transforme un lien YouTube / Vimeo en lien intégrable
function embedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = findLesson(slug);
  if (!found) notFound();
  const { lesson, next, prev } = found;

  const { supabase, profile } = await requireStudent();
  const progress = await getProgress(supabase, profile.id);
  const done = new Set(progress.map((p) => p.lesson_slug));
  const mine = progress.find((p) => p.lesson_slug === slug);
  const mod = FORMATION.find((m) => m.id === lesson.moduleId)!;
  const embed = lesson.video ? embedUrl(lesson.video) : null;

  return (
    <main className="f-page">
      <div className="f-inner f-lesson-layout">
        <div className="f-main">
          <nav className="f-crumbs" aria-label="Fil d'Ariane">
            <Link href="/formation">Formation</Link><span aria-hidden="true">/</span><span>{lesson.moduleLabel} · {lesson.moduleTitle}</span>
          </nav>

          <div className="f-video">
            {embed ? (
              <iframe src={embed} title={lesson.title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
            ) : lesson.video ? (
              <video src={lesson.video} controls playsInline preload="metadata" />
            ) : (
              <div className="f-video-empty">
                <span className="f-play big" aria-hidden="true"><svg width="26" height="28" viewBox="0 0 18 20"><path d="M2 1.5l14 8.5-14 8.5z" fill="currentColor" /></svg></span>
                <b>Vidéo bientôt disponible</b>
                <small>{lesson.minutes} min</small>
              </div>
            )}
          </div>

          <div className="f-title-row">
            <h1>{lesson.title}</h1>
            {done.has(slug) && <span className="f-badge-done">Terminée{mine?.quiz_total ? ` · ${mine.quiz_score}/${mine.quiz_total}` : ""}</span>}
          </div>

          <LessonActivity
            slug={lesson.slug}
            kind={lesson.after}
            resume={lesson.resume || []}
            quiz={lesson.quiz || []}
            alreadyDone={done.has(slug)}
            next={next ? { slug: next.slug, title: next.title } : null}
          />

          <div className="f-pager">
            {prev ? <Link href={`/formation/${prev.slug}`} className="link-quiet f-prev">← {prev.title}</Link> : <span />}
            {next && <Link href={`/formation/${next.slug}`} className="link-quiet f-next">{next.title} →</Link>}
          </div>
        </div>

        <aside className="f-playlist" aria-label={`Leçons du ${lesson.moduleLabel}`}>
          <span className="f-mlabel">{mod.label}</span>
          <h2>{mod.title}</h2>
          <ol className="f-lessons compact">
            {mod.lessons.map((l, i) => (
              <li key={l.slug}>
                <Link href={`/formation/${l.slug}`} className={`f-lesson${done.has(l.slug) ? " is-done" : ""}${l.slug === slug ? " is-current" : ""}`} aria-current={l.slug === slug ? "page" : undefined}>
                  <span className="f-num">{done.has(l.slug) ? "✓" : i + 1}</span>
                  <span className="f-ltitle">{l.title}</span>
                  <span className="f-min">{l.minutes} min</span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/formation" className="link-quiet">Tout le programme →</Link>
        </aside>
      </div>
    </main>
  );
}
