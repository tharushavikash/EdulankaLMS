import "server-only";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { comments, courses, enrollments, lessonProgress, lessons, modules, users } from "@/db/schema";
import type { SessionUser } from "./auth";

export type LessonLite = {
  id: number;
  moduleId: number;
  title: string;
  titleSi: string | null;
  youtubeId: string;
  position: number;
};

export type ModuleWithLessons = {
  id: number;
  title: string;
  titleSi: string | null;
  position: number;
  lessons: LessonLite[];
};

export async function getCourseContent(courseId: number): Promise<ModuleWithLessons[]> {
  const mods = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.position), asc(modules.id));
  if (mods.length === 0) return [];

  const lessonRows = await db
    .select({
      id: lessons.id,
      moduleId: lessons.moduleId,
      title: lessons.title,
      titleSi: lessons.titleSi,
      youtubeId: lessons.youtubeId,
      position: lessons.position,
    })
    .from(lessons)
    .where(
      inArray(
        lessons.moduleId,
        mods.map((m) => m.id),
      ),
    )
    .orderBy(asc(lessons.position), asc(lessons.id));

  return mods.map((m) => ({
    id: m.id,
    title: m.title,
    titleSi: m.titleSi,
    position: m.position,
    lessons: lessonRows.filter((l) => l.moduleId === m.id),
  }));
}

export async function getCompletedLessonIds(userId: number, lessonIds: number[]): Promise<Set<number>> {
  if (lessonIds.length === 0) return new Set();
  const rows = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, lessonIds)));
  return new Set(rows.map((r) => r.lessonId));
}

export type AccessLevel = "admin" | "enrolled" | "pending" | "none";

export async function getAccessLevel(user: SessionUser | null, courseId: number): Promise<AccessLevel> {
  if (!user) return "none";
  if (user.role === "admin") return "admin";
  const rows = await db
    .select({ status: enrollments.status })
    .from(enrollments)
    .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, courseId)))
    .limit(1);
  if (!rows[0]) return "none";
  return rows[0].status === "approved" ? "enrolled" : "pending";
}

export function canWatch(level: AccessLevel) {
  return level === "admin" || level === "enrolled";
}

/** Per-course totals & completion count for a student. */
export async function getCourseProgressMap(userId: number, courseIds: number[]) {
  const map = new Map<number, { total: number; completed: number }>();
  if (courseIds.length === 0) return map;

  const totals = await db
    .select({ courseId: modules.courseId, total: count(lessons.id) })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(inArray(modules.courseId, courseIds))
    .groupBy(modules.courseId);

  const completed = await db
    .select({ courseId: modules.courseId, completed: count(lessonProgress.id) })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(and(eq(lessonProgress.userId, userId), inArray(modules.courseId, courseIds)))
    .groupBy(modules.courseId);

  for (const id of courseIds) map.set(id, { total: 0, completed: 0 });
  for (const t of totals) map.set(t.courseId, { total: Number(t.total), completed: 0 });
  for (const c of completed) {
    const entry = map.get(c.courseId) ?? { total: 0, completed: 0 };
    entry.completed = Number(c.completed);
    map.set(c.courseId, entry);
  }
  return map;
}

export async function getLessonCountsByCourse(courseIds: number[]) {
  const map = new Map<number, number>();
  if (courseIds.length === 0) return map;
  const rows = await db
    .select({ courseId: modules.courseId, total: count(lessons.id) })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(inArray(modules.courseId, courseIds))
    .groupBy(modules.courseId);
  for (const id of courseIds) map.set(id, 0);
  for (const r of rows) map.set(r.courseId, Number(r.total));
  return map;
}

export async function getFirstLessonThumbs(courseIds: number[]) {
  const map = new Map<number, string>();
  if (courseIds.length === 0) return map;
  const rows = await db
    .select({ courseId: modules.courseId, youtubeId: lessons.youtubeId })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(inArray(modules.courseId, courseIds))
    .orderBy(asc(modules.position), asc(modules.id), asc(lessons.position), asc(lessons.id));
  for (const r of rows) if (!map.has(r.courseId)) map.set(r.courseId, r.youtubeId);
  return map;
}

export async function getEnrollmentCounts(courseIds: number[]) {
  const map = new Map<number, number>();
  if (courseIds.length === 0) return map;
  const rows = await db
    .select({ courseId: enrollments.courseId, total: count() })
    .from(enrollments)
    .where(and(inArray(enrollments.courseId, courseIds), eq(enrollments.status, "approved")))
    .groupBy(enrollments.courseId);
  for (const id of courseIds) map.set(id, 0);
  for (const r of rows) map.set(r.courseId, Number(r.total));
  return map;
}

export async function getLessonComments(lessonId: number) {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      userId: users.id,
      userName: users.name,
      userRole: users.role,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.lessonId, lessonId))
    .orderBy(asc(comments.createdAt));

  const top = rows.filter((r) => r.parentId === null);
  return top.map((q) => ({
    ...q,
    replies: rows.filter((r) => r.parentId === q.id),
  }));
}

export async function getPlatformStats() {
  const [c] = await db.select({ n: count() }).from(courses).where(eq(courses.published, true));
  const [l] = await db.select({ n: count() }).from(lessons);
  const [s] = await db.select({ n: count() }).from(users).where(eq(users.role, "student"));
  return { courses: Number(c?.n ?? 0), lessons: Number(l?.n ?? 0), students: Number(s?.n ?? 0) };
}

export async function getRecentQuestionsForAdmin(limit = 8) {
  return db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      userName: users.name,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      courseId: modules.courseId,
      replyCount: sql<number>`(select count(*) from ${comments} c2 where c2.parent_id = ${comments.id})`,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .innerJoin(lessons, eq(comments.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(sql`${comments.parentId} is null`)
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}
