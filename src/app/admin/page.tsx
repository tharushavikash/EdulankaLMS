import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, lessons, users } from "@/db/schema";
import { getDictionary } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/dictionaries";
import { getEnrollmentCounts, getFirstLessonThumbs, getLessonCountsByCourse, getRecentQuestionsForAdmin } from "@/lib/data";
import { approveEnrollmentAction, revokeEnrollmentAction } from "@/app/actions/enrollments";
import { CourseThumb } from "@/components/CourseCard";
import { Badge, Card, EmptyState, LinkButton, PageHeader, StatCard } from "@/components/ui";

export default async function AdminPage() {
  const { locale, t } = await getDictionary();

  const [courseRows, [studentCount], [lessonCount], pending, questions] = await Promise.all([
    db.select().from(courses).orderBy(desc(courses.createdAt)),
    db.select({ n: count() }).from(users).where(eq(users.role, "student")),
    db.select({ n: count() }).from(lessons),
    db
      .select({
        id: enrollments.id,
        courseId: enrollments.courseId,
        courseTitle: courses.title,
        courseTitleSi: courses.titleSi,
        studentName: users.name,
        studentEmail: users.email,
        createdAt: enrollments.createdAt,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(eq(enrollments.status, "pending"))
      .orderBy(desc(enrollments.createdAt)),
    getRecentQuestionsForAdmin(6),
  ]);

  const ids = courseRows.map((c) => c.id);
  const [lessonCounts, enrollCounts, thumbs] = await Promise.all([
    getLessonCountsByCourse(ids),
    getEnrollmentCounts(ids),
    getFirstLessonThumbs(ids),
  ]);

  const Icon = ({ d }: { d: string }) => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );

  return (
    <>
      <PageHeader
        title={t.admin.title}
        subtitle={t.admin.subtitle}
        action={<LinkButton href="/admin/courses/new">+ {t.admin.newCourse}</LinkButton>}
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.admin.courses} value={courseRows.length} icon={<Icon d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />} />
        <StatCard label={t.admin.totalLessons} value={Number(lessonCount?.n ?? 0)} icon={<Icon d="M23 7l-7 5 7 5V7zM1 5h15v14H1z" />} />
        <StatCard label={t.admin.totalStudents} value={Number(studentCount?.n ?? 0)} icon={<Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-slate-900">{t.admin.allCourses}</h2>
          {courseRows.length === 0 ? (
            <EmptyState title={t.admin.noCoursesYet} action={<LinkButton href="/admin/courses/new">+ {t.admin.newCourse}</LinkButton>} />
          ) : (
            <div className="space-y-3">
              {courseRows.map((c) => (
                <Card key={c.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <CourseThumb
                    course={{ title: c.title, thumbnailUrl: c.thumbnailUrl, firstYoutubeId: thumbs.get(c.id) }}
                    className="aspect-video w-full shrink-0 rounded-xl sm:w-40"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-slate-900">{pick(locale, c.title, c.titleSi)}</h3>
                      {c.published ? <Badge tone="emerald">{t.common.published}</Badge> : <Badge tone="amber">{t.common.draft}</Badge>}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">{pick(locale, c.description, c.descriptionSi)}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {lessonCounts.get(c.id) ?? 0} {t.common.lessons} · {enrollCounts.get(c.id) ?? 0} {t.common.students}
                    </p>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <LinkButton href={`/admin/courses/${c.id}`} className="flex-1 px-3 py-2">{t.admin.manage}</LinkButton>
                    <LinkButton href={`/courses/${c.id}`} variant="secondary" className="flex-1 px-3 py-2">{t.common.view}</LinkButton>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-8">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
              {t.admin.pendingEnrollments}
              {pending.length > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{pending.length}</span>}
            </h2>
            <Card className="divide-y divide-slate-100">
              {pending.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">{t.admin.noPending}</p>
              ) : (
                pending.map((p) => (
                  <div key={p.id} className="p-4">
                    <p className="text-sm font-semibold text-slate-900">{p.studentName}</p>
                    <p className="truncate text-xs text-slate-500">{p.studentEmail}</p>
                    <p className="mt-1 text-xs text-indigo-600">{pick(locale, p.courseTitle, p.courseTitleSi)}</p>
                    <div className="mt-3 flex gap-2">
                      <form action={approveEnrollmentAction} className="flex-1">
                        <input type="hidden" name="enrollmentId" value={p.id} />
                        <input type="hidden" name="courseId" value={p.courseId} />
						{p.receiptUrl && (
  <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline">
    View Receipt
  </a>
)}
                        <button className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                          ✓ {t.admin.approve}
                        </button>
                      </form>
                      <form action={revokeEnrollmentAction} className="flex-1">
                        <input type="hidden" name="enrollmentId" value={p.id} />
                        <input type="hidden" name="courseId" value={p.courseId} />
                        <button className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                          {t.admin.reject}
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900">{t.admin.questions}</h2>
            <Card className="divide-y divide-slate-100">
              {questions.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">{t.admin.noQuestions}</p>
              ) : (
                questions.map((q) => (
                  <Link key={q.id} href={`/courses/${q.courseId}/lessons/${q.lessonId}`} className="block p-4 transition hover:bg-slate-50">
                    <p className="line-clamp-2 text-sm text-slate-800">{q.body}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="truncate">
                        {q.userName} · {q.lessonTitle}
                      </span>
                      {Number(q.replyCount) === 0 ? <Badge tone="rose">!</Badge> : <Badge tone="emerald">{q.replyCount}</Badge>}
                    </div>
                  </Link>
                ))
              )}
            </Card>
          </section>
        </aside>
      </div>
    </>
  );
}
