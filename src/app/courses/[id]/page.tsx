import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, users } from "@/db/schema";
import { getDictionary } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { canWatch, getAccessLevel, getCompletedLessonIds, getCourseContent } from "@/lib/data";
import { requestEnrollmentAction } from "@/app/actions/enrollments";
import { CourseThumb } from "@/components/CourseCard";
import { Badge, Card, EmptyState, LinkButton, ProgressBar, btnPrimary } from "@/components/ui";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) notFound();

  const [{ locale, t }, user] = await Promise.all([getDictionary(), getSessionUser()]);

  const [course] = await db
    .select({
      id: courses.id,
      title: courses.title,
      titleSi: courses.titleSi,
      description: courses.description,
      descriptionSi: courses.descriptionSi,
      thumbnailUrl: courses.thumbnailUrl,
      published: courses.published,
      authorName: users.name,
    })
    .from(courses)
    .innerJoin(users, eq(courses.createdBy, users.id))
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) notFound();
  if (!course.published && user?.role !== "admin") notFound();

  const [content, level] = await Promise.all([getCourseContent(courseId), getAccessLevel(user, courseId)]);
  const allLessons = content.flatMap((m) => m.lessons);
  const completed = user ? await getCompletedLessonIds(user.id, allLessons.map((l) => l.id)) : new Set<number>();
  const watch = canWatch(level);
  const total = allLessons.length;
  const done = allLessons.filter((l) => completed.has(l.id)).length;
  const pct = total ? (done / total) * 100 : 0;
  const firstLesson = allLessons[0];
  const nextLesson = allLessons.find((l) => !completed.has(l.id)) ?? firstLesson;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/courses" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600">
        ← {t.nav.courses}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CourseThumb course={{ ...course, firstYoutubeId: firstLesson?.youtubeId }} className="aspect-[21/9]" />
            <div className="p-6 sm:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="slate">{content.length} {t.common.modules}</Badge>
                <Badge tone="slate">{total} {t.common.lessons}</Badge>
                {level === "enrolled" && <Badge tone="emerald">{t.courses.enrolled}</Badge>}
                {level === "pending" && <Badge tone="amber">{t.courses.pending}</Badge>}
                {!course.published && <Badge tone="rose">{t.common.draft}</Badge>}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {pick(locale, course.title, course.titleSi)}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {t.courses.instructor}: <span className="font-medium text-slate-700">{course.authorName}</span>
              </p>
              <p className="mt-4 whitespace-pre-line text-slate-700">{pick(locale, course.description, course.descriptionSi)}</p>
            </div>
          </Card>

          <h2 className="mb-4 mt-10 text-xl font-bold text-slate-900">{t.courses.curriculum}</h2>
          {content.length === 0 ? (
            <EmptyState title={t.courses.noContent} />
          ) : (
            <div className="space-y-4">
              {content.map((m, mi) => (
                <Card key={m.id} className="overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-xs font-bold text-white">{mi + 1}</span>
                    <h3 className="font-semibold text-slate-900">{pick(locale, m.title, m.titleSi)}</h3>
                    <span className="ml-auto text-xs text-slate-500">{m.lessons.length} {t.common.lessons}</span>
                  </div>
                  {m.lessons.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-slate-500">{t.admin.noLessons}</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {m.lessons.map((l, li) => {
                        const isDone = completed.has(l.id);
                        const inner = (
                          <>
                            <span
                              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                                isDone ? "bg-emerald-500 text-white" : watch ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {isDone ? "✓" : watch ? li + 1 : "🔒"}
                            </span>
                            <span className={`flex-1 text-sm font-medium ${watch ? "text-slate-800" : "text-slate-500"}`}>
                              {pick(locale, l.title, l.titleSi)}
                            </span>
                            {watch ? (
                              <span className="text-xs font-semibold text-indigo-600">▶</span>
                            ) : (
                              <span className="text-xs text-slate-400">{t.courses.locked}</span>
                            )}
                          </>
                        );
                        return (
                          <li key={l.id}>
                            {watch ? (
                              <Link href={`/courses/${courseId}/lessons/${l.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-indigo-50/60">
                                {inner}
                              </Link>
                            ) : (
                              <div className="flex items-center gap-3 px-5 py-3.5">{inner}</div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card className="p-6">
              {watch ? (
                <>
                  {user?.role === "student" && (
                    <div className="mb-5">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{t.courses.progress}</span>
                        <span className="font-semibold text-slate-900">{Math.round(pct)}%</span>
                      </div>
                      <ProgressBar value={pct} size="lg" />
                      <p className="mt-2 text-xs text-slate-500">
                        {done}/{total} {t.common.lessons} {t.courses.complete}
                      </p>
                    </div>
                  )}
                  {nextLesson ? (
                    <LinkButton href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="w-full py-3">
                      {done > 0 && done < total ? t.courses.continue : t.courses.startCourse}
                    </LinkButton>
                  ) : (
                    <p className="text-sm text-slate-500">{t.courses.noContent}</p>
                  )}
                  {user?.role === "admin" && (
                    <LinkButton href={`/admin/courses/${courseId}`} variant="secondary" className="mt-3 w-full">
                      {t.admin.manage}
                    </LinkButton>
                  )}
                </>
              ) : level === "pending" ? (
                <div className="text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-2xl">⏳</span>
                  <p className="mt-3 font-semibold text-slate-900">{t.courses.pending}</p>
                  <p className="mt-1 text-sm text-slate-600">{t.courses.pendingBody}</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo-100 text-2xl">🔒</span>
                  <p className="mt-3 font-semibold text-slate-900">{t.courses.lockedTitle}</p>
                  <p className="mt-1 text-sm text-slate-600">{t.courses.lockedBody}</p>
                  {user ? (
                    <form action={requestEnrollmentAction} className="mt-5 space-y-3 text-left">
                      <input type="hidden" name="courseId" value={courseId} />
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Payment Receipt</label>
                        <input type="file" name="receipt" accept="image/*,.pdf" required className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                      </div>
                      <button className={`${btnPrimary} w-full py-3`}>{t.courses.enroll}</button>
                    </form>
                  ) : (
                  ) : (
                    <div className="mt-5 space-y-2">
                      <LinkButton href="/login" className="w-full py-3">{t.nav.login}</LinkButton>
                      <LinkButton href="/register" variant="secondary" className="w-full">{t.nav.register}</LinkButton>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </aside>
      </div>
    </main>
  );
}
