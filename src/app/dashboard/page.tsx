import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, users } from "@/db/schema";
import { getDictionary } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/dictionaries";
import { requireUser } from "@/lib/auth";
import { getCourseProgressMap, getFirstLessonThumbs, getLessonCountsByCourse } from "@/lib/data";
import { CourseCard, type CourseCardData } from "@/components/CourseCard";
import { Badge, EmptyState, LinkButton, PageHeader, ProgressBar, StatCard } from "@/components/ui";

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");
  const { locale, t } = await getDictionary();

  const rows = await db
    .select({
      enrollmentStatus: enrollments.status,
      id: courses.id,
      title: courses.title,
      titleSi: courses.titleSi,
      description: courses.description,
      descriptionSi: courses.descriptionSi,
      thumbnailUrl: courses.thumbnailUrl,
      published: courses.published,
      authorName: users.name,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(users, eq(courses.createdBy, users.id))
    .where(eq(enrollments.userId, user.id))
    .orderBy(desc(enrollments.createdAt));

  const approved = rows.filter((r) => r.enrollmentStatus === "approved" && r.published);
  const pending = rows.filter((r) => r.enrollmentStatus === "pending");
  const ids = approved.map((r) => r.id);

  const [progress, lessonCounts, thumbs] = await Promise.all([
    getCourseProgressMap(user.id, ids),
    getLessonCountsByCourse(ids),
    getFirstLessonThumbs(ids),
  ]);

  const cards: CourseCardData[] = approved.map((r) => ({
    ...r,
    firstYoutubeId: thumbs.get(r.id),
    lessonCount: lessonCounts.get(r.id) ?? 0,
    status: "enrolled",
    progress: progress.get(r.id),
  }));

  const totalLessons = [...progress.values()].reduce((a, p) => a + p.total, 0);
  const completedLessons = [...progress.values()].reduce((a, p) => a + p.completed, 0);
  const overall = totalLessons ? (completedLessons / totalLessons) * 100 : 0;

  const Icon = ({ d }: { d: string }) => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title={`${t.dashboard.welcome}, ${user.name.split(" ")[0]} 👋`}
        subtitle={t.dashboard.subtitle}
        action={<LinkButton href="/courses" variant="secondary">{t.dashboard.browse}</LinkButton>}
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.dashboard.enrolledCourses} value={approved.length} icon={<Icon d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />} />
        <StatCard label={t.dashboard.completedLessons} value={`${completedLessons}/${totalLessons}`} icon={<Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />} />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{t.dashboard.overall}</p>
            <p className="text-2xl font-bold text-slate-900">{Math.round(overall)}%</p>
          </div>
          <ProgressBar value={overall} size="lg" className="mt-3" />
        </div>
      </div>

      <h2 className="mb-4 text-xl font-bold text-slate-900">{t.dashboard.enrolledCourses}</h2>
      {cards.length === 0 ? (
        <EmptyState
          title={t.dashboard.noCourses}
          action={<LinkButton href="/courses">{t.dashboard.browse}</LinkButton>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <CourseCard key={c.id} course={c} locale={locale} t={t} href={`/courses/${c.id}`} />
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold text-slate-900">{t.dashboard.pendingRequests}</h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <Link href={`/courses/${p.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                    {pick(locale, p.title, p.titleSi)}
                  </Link>
                  <p className="text-xs text-slate-500">{p.authorName}</p>
                </div>
                <Badge tone="amber">{t.courses.pending}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
