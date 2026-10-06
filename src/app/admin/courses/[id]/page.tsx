import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, lessons, modules, users } from "@/db/schema";
import { getDictionary } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/dictionaries";
import { youtubeThumbnail } from "@/lib/youtube";
import {
  deleteCourseAction,
  deleteLessonAction,
  deleteModuleAction,
  moveLessonAction,
  moveModuleAction,
} from "@/app/actions/courses";
import { approveEnrollmentAction, revokeEnrollmentAction } from "@/app/actions/enrollments";
import { CourseForm } from "@/components/admin/CourseForm";
import { ConfirmForm, EditLessonButton, GrantAccessForm, LessonForm, ModuleForm } from "@/components/admin/ContentForms";
import { Badge, Card, LinkButton, PageHeader, btnDanger } from "@/components/ui";

export default async function ManageCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) notFound();
  const { locale, t } = await getDictionary();

  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) notFound();

  const mods = await db.select().from(modules).where(eq(modules.courseId, courseId)).orderBy(asc(modules.position), asc(modules.id));
  const lessonRows = mods.length
    ? await db
        .select()
        .from(lessons)
        .where(inArray(lessons.moduleId, mods.map((m) => m.id)))
        .orderBy(asc(lessons.position), asc(lessons.id))
    : [];

  const enrollRows = await db
    .select({
      id: enrollments.id,
      status: enrollments.status,
      createdAt: enrollments.createdAt,
      name: users.name,
      email: users.email,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(eq(enrollments.courseId, courseId))
    .orderBy(desc(enrollments.createdAt));

  const totalLessons = lessonRows.length;

  const ArrowBtn = ({ dir }: { dir: "up" | "down" }) => (
    <button
      name="direction"
      value={dir}
      title={dir === "up" ? t.admin.moveUp : t.admin.moveDown}
      className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
    >
      {dir === "up" ? "↑" : "↓"}
    </button>
  );

  return (
    <>
      <Link href="/admin" className="mb-4 inline-flex text-sm font-medium text-slate-500 hover:text-indigo-600">← {t.admin.title}</Link>
      <PageHeader
        title={pick(locale, course.title, course.titleSi)}
        subtitle={`${mods.length} ${t.common.modules} · ${totalLessons} ${t.common.lessons} · ${enrollRows.filter((e) => e.status === "approved").length} ${t.common.students}`}
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/courses/${courseId}`} variant="secondary">{t.admin.preview}</LinkButton>
            <ConfirmForm action={deleteCourseAction} hidden={{ courseId }}>
              <button className={btnDanger}>{t.admin.deleteCourse}</button>
            </ConfirmForm>
          </div>
        }
      />

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
          {/* Curriculum builder */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900">{t.admin.modulesTitle}</h2>
            <div className="space-y-4">
              {mods.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">{t.admin.noModules}</p>
              )}
              {mods.map((m, mi) => {
                const mLessons = lessonRows.filter((l) => l.moduleId === m.id);
                return (
                  <Card key={m.id} className="overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-xs font-bold text-white">{mi + 1}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-slate-900">{m.title}</h3>
                        {m.titleSi && <p className="truncate text-xs text-slate-500" lang="si">{m.titleSi}</p>}
                      </div>
                      <form action={moveModuleAction} className="flex">
                        <input type="hidden" name="moduleId" value={m.id} />
                        <input type="hidden" name="courseId" value={courseId} />
                        <ArrowBtn dir="up" />
                        <ArrowBtn dir="down" />
                      </form>
                      <ConfirmForm action={deleteModuleAction} hidden={{ moduleId: m.id, courseId }}>
                        <button className="rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">{t.common.delete}</button>
                      </ConfirmForm>
                    </div>

                    <ul className="divide-y divide-slate-100">
                      {mLessons.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">{t.admin.noLessons}</li>}
                      {mLessons.map((l, li) => (
                        <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={youtubeThumbnail(l.youtubeId, "mq")} alt="" className="h-12 w-20 shrink-0 rounded-md object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {li + 1}. {l.title}
                            </p>
                            {l.titleSi && <p className="truncate text-xs text-slate-500" lang="si">{l.titleSi}</p>}
                            <a href={l.youtubeUrl} target="_blank" rel="noreferrer" className="truncate text-xs text-indigo-500 hover:underline">
                              {l.youtubeUrl}
                            </a>
                          </div>
                          <div className="flex items-center gap-1">
                            <form action={moveLessonAction} className="flex">
                              <input type="hidden" name="lessonId" value={l.id} />
                              <input type="hidden" name="moduleId" value={m.id} />
                              <input type="hidden" name="courseId" value={courseId} />
                              <ArrowBtn dir="up" />
                              <ArrowBtn dir="down" />
                            </form>
                            <Link href={`/courses/${courseId}/lessons/${l.id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                              {t.common.view}
                            </Link>
                            <EditLessonButton
                              courseId={courseId}
                              moduleId={m.id}
                              lesson={{
                                id: l.id,
                                title: l.title,
                                titleSi: l.titleSi,
                                description: l.description,
                                descriptionSi: l.descriptionSi,
                                youtubeUrl: l.youtubeUrl,
                              }}
                            />
                            <ConfirmForm action={deleteLessonAction} hidden={{ lessonId: l.id, courseId }}>
                              <button className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">{t.common.delete}</button>
                            </ConfirmForm>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-slate-100 p-3">
                      <LessonForm courseId={courseId} moduleId={m.id} />
                    </div>
                  </Card>
                );
              })}
              <ModuleForm courseId={courseId} />
            </div>
          </section>

          {/* Course details */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900">{t.admin.courseDetails}</h2>
            <Card className="p-6">
              <CourseForm course={course} />
            </Card>
          </section>
        </div>

        {/* Student access */}
        <aside>
          <h2 className="mb-4 text-xl font-bold text-slate-900">{t.admin.enrollmentsTitle}</h2>
          <Card className="p-5">
            <GrantAccessForm courseId={courseId} />
          </Card>
          <Card className="mt-4 divide-y divide-slate-100">
            {enrollRows.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">{t.admin.noEnrollments}</p>
            ) : (
              enrollRows.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    {e.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{e.name}</p>
                    <p className="truncate text-xs text-slate-500">{e.email}</p>
                    <div className="mt-1">
                      {e.status === "approved" ? <Badge tone="emerald">{t.courses.enrolled}</Badge> : <Badge tone="amber">{t.courses.pending}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {e.status === "pending" && (
                      <form action={approveEnrollmentAction}>
                        <input type="hidden" name="enrollmentId" value={e.id} />
                        <input type="hidden" name="courseId" value={courseId} />
                        <button className="w-full rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700">{t.admin.approve}</button>
                      </form>
                    )}
                    <ConfirmForm action={revokeEnrollmentAction} hidden={{ enrollmentId: e.id, courseId }}>
                      <button className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600">
                        {e.status === "pending" ? t.admin.reject : t.admin.revoke}
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
              ))
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
