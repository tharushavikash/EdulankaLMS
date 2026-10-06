import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, lessons, modules } from "@/db/schema";
import { getDictionary } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { canWatch, getAccessLevel, getCompletedLessonIds, getCourseContent, getLessonComments } from "@/lib/data";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { MarkCompleteButton } from "@/components/lesson/MarkCompleteButton";
import { QASection } from "@/components/lesson/QASection";
import { Card, LinkButton, ProgressBar } from "@/components/ui";

export default async function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId: lessonIdRaw } = await params;
  const courseId = Number(id);
  const lessonId = Number(lessonIdRaw);
  if (!Number.isFinite(courseId) || !Number.isFinite(lessonId)) notFound();

  const [{ locale, t }, user] = await Promise.all([getDictionary(), getSessionUser()]);
  if (!user) redirect(`/login`);

  const [row] = await db
    .select({
      lesson: lessons,
      moduleTitle: modules.title,
      moduleTitleSi: modules.titleSi,
      courseId: modules.courseId,
      courseTitle: courses.title,
      courseTitleSi: courses.titleSi,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!row || row.courseId !== courseId) notFound();

  const level = await getAccessLevel(user, courseId);

  // ---- Access control: video is only rendered for admins / approved students ----
  if (!canWatch(level)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-3xl">🔒</span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">{t.lesson.accessDenied}</h1>
        <p className="mt-2 text-slate-600">{t.lesson.accessDeniedBody}</p>
        <div className="mt-6">
          <LinkButton href={`/courses/${courseId}`}>{t.lesson.goToCourse}</LinkButton>
        </div>
      </main>
    );
  }

  const content = await getCourseContent(courseId);
  const flat = content.flatMap((m) => m.lessons);
  const [completed, comments] = await Promise.all([
    getCompletedLessonIds(user.id, flat.map((l) => l.id)),
    getLessonComments(lessonId),
  ]);

  const idx = flat.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;
  const isDone = completed.has(lessonId);
  const pct = flat.length ? (flat.filter((l) => completed.has(l.id)).length / flat.length) * 100 : 0;
  const lesson = row.lesson;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href={`/courses/${courseId}`} className="font-medium hover:text-indigo-600">
          ← {pick(locale, row.courseTitle, row.courseTitleSi)}
        </Link>
        <span>/</span>
        <span className="truncate">{pick(locale, row.moduleTitle, row.moduleTitleSi)}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Player */}
          <div className="overflow-hidden rounded-2xl shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5">
            <div className="yt-frame">
              <iframe
                src={youtubeEmbedUrl(lesson.youtubeId)}
                title={pick(locale, lesson.title, lesson.titleSi)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>

          {/* Title + Mark complete */}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  {t.common.lesson} {idx + 1} / {flat.length}
                </p>
                <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{pick(locale, lesson.title, lesson.titleSi)}</h1>
              </div>
              {user.role === "student" && <MarkCompleteButton lessonId={lessonId} completed={isDone} />}
            </div>

            {(lesson.description || lesson.descriptionSi) && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <h2 className="mb-2 text-sm font-semibold text-slate-900">{t.lesson.about}</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {pick(locale, lesson.description, lesson.descriptionSi)}
                </p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              {prev ? (
                <Link href={`/courses/${courseId}/lessons/${prev.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-indigo-600">
                  ← {t.lesson.previous}
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <LinkButton href={`/courses/${courseId}/lessons/${next.id}`}>{t.lesson.next} →</LinkButton>
              ) : (
                <LinkButton href={`/courses/${courseId}`} variant="secondary">{t.lesson.backToCourse}</LinkButton>
              )}
            </div>
          </Card>

          {/* Q&A */}
          <QASection lessonId={lessonId} comments={comments} currentUser={{ id: user.id, role: user.role }} />
        </div>

        {/* Sidebar: course content */}
        <aside className="lg:col-span-1">
          <Card className="overflow-hidden lg:sticky lg:top-24">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-bold text-slate-900">{t.lesson.courseContent}</h2>
              {user.role === "student" && (
                <>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{t.courses.progress}</span>
                    <span className="font-semibold text-slate-800">{Math.round(pct)}%</span>
                  </div>
                  <ProgressBar value={pct} className="mt-1.5" />
                </>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {content.map((m, mi) => (
                <div key={m.id}>
                  <div className="sticky top-0 bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {mi + 1}. {pick(locale, m.title, m.titleSi)}
                  </div>
                  <ul>
                    {m.lessons.map((l) => {
                      const active = l.id === lessonId;
                      const done = completed.has(l.id);
                      return (
                        <li key={l.id}>
                          <Link
                            href={`/courses/${courseId}/lessons/${l.id}`}
                            className={`flex items-center gap-3 px-5 py-3 text-sm transition ${
                              active ? "bg-indigo-50 text-indigo-800" : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                                done ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white" : "border border-slate-300 text-transparent"
                              }`}
                            >
                              {done ? "✓" : active ? "▶" : "·"}
                            </span>
                            <span className={`line-clamp-2 ${active ? "font-semibold" : ""}`}>{pick(locale, l.title, l.titleSi)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
