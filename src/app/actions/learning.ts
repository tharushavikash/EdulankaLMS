"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { comments, lessonProgress, lessons, modules } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { canWatch, getAccessLevel } from "@/lib/data";

async function lessonCourseId(lessonId: number): Promise<number | null> {
  const [row] = await db
    .select({ courseId: modules.courseId })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(eq(lessons.id, lessonId))
    .limit(1);
  return row?.courseId ?? null;
}

function revalidateLesson(courseId: number, lessonId: number) {
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export async function toggleCompleteAction(fd: FormData) {
  const user = await requireUser();
  const lessonId = Number(fd.get("lessonId"));
  if (!Number.isFinite(lessonId)) return;
  const courseId = await lessonCourseId(lessonId);
  if (courseId === null) return;

  const level = await getAccessLevel(user, courseId);
  if (!canWatch(level)) return;

  const [existing] = await db
    .select({ id: lessonProgress.id })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);

  if (existing) {
    await db.delete(lessonProgress).where(eq(lessonProgress.id, existing.id));
  } else {
    await db.insert(lessonProgress).values({ userId: user.id, lessonId }).onConflictDoNothing();
  }
  revalidateLesson(courseId, lessonId);
}

export type CommentState = { error?: string; success?: boolean } | null;

export async function postCommentAction(_prev: CommentState, fd: FormData): Promise<CommentState> {
  const user = await requireUser();
  const lessonId = Number(fd.get("lessonId"));
  const parentRaw = fd.get("parentId");
  const parentId = parentRaw ? Number(parentRaw) : null;
  const body = String(fd.get("body") ?? "").trim();

  if (!Number.isFinite(lessonId)) return { error: "error" };
  if (!body) return { error: "empty" };

  const courseId = await lessonCourseId(lessonId);
  if (courseId === null) return { error: "error" };
  const level = await getAccessLevel(user, courseId);
  if (!canWatch(level)) return { error: "error" };

  // Only admins may reply; students post top-level questions.
  if (parentId !== null && user.role !== "admin") return { error: "error" };

  await db.insert(comments).values({
    lessonId,
    userId: user.id,
    parentId: parentId !== null && Number.isFinite(parentId) ? parentId : null,
    body: body.slice(0, 2000),
  });

  revalidateLesson(courseId, lessonId);
  return { success: true };
}

export async function deleteCommentAction(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("commentId"));
  if (!Number.isFinite(id)) return;
  const [c] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  if (!c) return;
  if (user.role !== "admin" && c.userId !== user.id) return;

  await db.delete(comments).where(eq(comments.parentId, id));
  await db.delete(comments).where(eq(comments.id, id));
  const courseId = await lessonCourseId(c.lessonId);
  if (courseId !== null) revalidateLesson(courseId, c.lessonId);
}
