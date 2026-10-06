import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, users } from "@/db/schema";
import { getDictionary } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { approveEnrollmentAction, revokeEnrollmentAction, grantAccessAction } from "@/app/actions/enrollments";
import { Card, LinkButton, Badge, btnPrimary, btnSecondary } from "@/components/ui";

export default async function AdminDashboard() {
  const [{ locale, t }, user] = await Promise.all([getDictionary(), getSessionUser()]);
  if (!user || user.role !== "admin") notFound();

  const [allCourses, pendingEnrollments] = await Promise.all([
    db
      .select({
        id: courses.id,
        title: courses.title,
        titleSi: courses.titleSi,
        published: courses.published,
      })
      .from(courses),
    db
      .select({
        id: enrollments.id,
        courseId: enrollments.courseId,
        courseTitle: courses.title,
        courseTitleSi: courses.titleSi,
        studentName: users.name,
        studentEmail: users.email,
        createdAt: enrollments.createdAt,
        receiptUrl: enrollments.receiptUrl,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(eq(enrollments.status, "pending")),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.admin.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.admin.subtitle}</p>
        </div>
        <LinkButton href="/admin/courses/new">{t.admin.newCourse}</LinkButton>
      </div>

      {/* Pending Approvals */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">Pending Approvals</h2>
        {pendingEnrollments.length === 0 ? (
          <Card className="mt-4 p-6 text-sm text-slate-500">No pending enrollments found.</Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingEnrollments.map((p) => (
              <Card key={p.id} className="flex flex-col justify-between p-6">
                <div>
                  <Badge tone="amber">{t.courses.pending}</Badge>
                  <h3 className="mt-3 font-semibold text-slate-900">{pick(locale, p.courseTitle, p.courseTitleSi)}</h3>
                  <p className="mt-1 text-sm text-slate-600">{p.studentName}</p>
                  <p className="text-xs text-slate-400">{p.studentEmail}</p>
                  {p.receiptUrl && (
                    <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                      View Receipt ↗
                    </a>
                  )}
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <form action={approveEnrollmentAction} className="flex-1">
                    <input type="hidden" name="enrollmentId" value={p.id} />
                    <input type="hidden" name="courseId" value={p.courseId} />
                    <button className={`${btnPrimary} w-full py-2 text-xs`}>{t.admin.approve}</button>
                  </form>
                  <form action={revokeEnrollmentAction} className="flex-1">
                    <input type="hidden" name="enrollmentId" value={p.id} />
                    <input type="hidden" name="courseId" value={p.courseId} />
                    <button className={`${btnSecondary} w-full py-2 text-xs text-rose-600 hover:bg-rose-50`}>{t.admin.reject}</button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* All Courses */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">{t.admin.courses}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allCourses.map((c) => (
            <Card key={c.id} className="flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between">
                  <Badge tone={c.published ? "emerald" : "rose"}>
                    {c.published ? t.common.published : t.common.draft}
                  </Badge>
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{pick(locale, c.title, c.titleSi)}</h3>
              </div>
              <div className="mt-6">
                <LinkButton href={`/admin/courses/${c.id}`} variant="secondary" className="w-full text-xs">
                  {t.admin.manage}
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}