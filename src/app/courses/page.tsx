import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, users } from "@/db/schema";
import { getDictionary } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/auth";
import { getCourseProgressMap, getFirstLessonThumbs, getLessonCountsByCourse } from "@/lib/data";
import { CourseCard, type CourseCardData } from "@/components/CourseCard";
import { EmptyState, PageHeader } from "@/components/ui";

export default async function CoursesPage() {
  const [{ locale, t }, user] = await Promise.all([getDictionary(), getSessionUser()]);

  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
      titleSi: courses.titleSi,
      description: courses.description,
      descriptionSi: courses.descriptionSi,
      thumbnailUrl: courses.thumbnailUrl,
      authorName: users.name,
    })
    .from(courses)
    .innerJoin(users, eq(courses.createdBy, users.id))
    .where(eq(courses.published, true))
    .orderBy(desc(courses.createdAt));

  const ids = rows.map((r) => r.id);
  const [lessonCounts, thumbs] = await Promise.all([getLessonCountsByCourse(ids), getFirstLessonThumbs(ids)]);

  const statusMap = new Map<number, "enrolled" | "pending">();
  let progressMap = new Map<number, { total: number; completed: number }>();
  if (user?.role === "student" && ids.length) {
    const mine = await db
      .select({ courseId: enrollments.courseId, status: enrollments.status })
      .from(enrollments)
      .where(eq(enrollments.userId, user.id));
    for (const e of mine) statusMap.set(e.courseId, e.status === "approved" ? "enrolled" : "pending");
    progressMap = await getCourseProgressMap(
      user.id,
      mine.filter((e) => e.status === "approved").map((e) => e.courseId),
    );
  }

  const cards: CourseCardData[] = rows.map((r) => ({
    ...r,
    firstYoutubeId: thumbs.get(r.id),
    lessonCount: lessonCounts.get(r.id) ?? 0,
    status: user?.role === "admin" ? "admin" : statusMap.get(r.id) ?? "none",
    progress: statusMap.get(r.id) === "enrolled" ? progressMap.get(r.id) : undefined,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={t.courses.catalogTitle} subtitle={t.courses.catalogSubtitle} />
      {cards.length === 0 ? (
        <EmptyState title={t.courses.noCourses} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <CourseCard key={c.id} course={c} locale={locale} t={t} href={`/courses/${c.id}`} />
          ))}
        </div>
      )}
    </main>
  );
}
