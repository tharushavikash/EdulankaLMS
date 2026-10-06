"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { courses, lessons, modules } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { extractYouTubeId } from "@/lib/youtube";

export type FormState = { error?: string; success?: boolean } | null;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const opt = (fd: FormData, key: string) => {
  const v = str(fd, key);
  return v.length ? v : null;
};

function revalidateCourse(courseId: number) {
  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath("/dashboard");
}

/* ---------------- Courses ---------------- */

export async function createCourseAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const title = str(fd, "title");
  if (!title) return { error: "courseRequired" };

  const [created] = await db
    .insert(courses)
    .values({
      title,
      titleSi: opt(fd, "titleSi"),
      description: str(fd, "description"),
      descriptionSi: opt(fd, "descriptionSi"),
      thumbnailUrl: opt(fd, "thumbnailUrl"),
      published: fd.get("published") === "on",
      createdBy: admin.id,
    })
    .returning({ id: courses.id });

  revalidatePath("/admin");
  revalidatePath("/courses");
  redirect(`/admin/courses/${created.id}`);
}

export async function updateCourseAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("courseId"));
  const title = str(fd, "title");
  if (!Number.isFinite(id)) return { error: "error" };
  if (!title) return { error: "courseRequired" };

  await db
    .update(courses)
    .set({
      title,
      titleSi: opt(fd, "titleSi"),
      description: str(fd, "description"),
      descriptionSi: opt(fd, "descriptionSi"),
      thumbnailUrl: opt(fd, "thumbnailUrl"),
      published: fd.get("published") === "on",
    })
    .where(eq(courses.id, id));

  revalidateCourse(id);
  return { success: true };
}

export async function deleteCourseAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("courseId"));
  if (!Number.isFinite(id)) return;
  await db.delete(courses).where(eq(courses.id, id));
  revalidatePath("/admin");
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  redirect("/admin");
}

/* ---------------- Modules ---------------- */

export async function createModuleAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const courseId = Number(fd.get("courseId"));
  const title = str(fd, "title");
  if (!Number.isFinite(courseId)) return { error: "error" };
  if (!title) return { error: "moduleRequired" };

  const [{ maxPos }] = await db
    .select({ maxPos: max(modules.position) })
    .from(modules)
    .where(eq(modules.courseId, courseId));

  await db.insert(modules).values({
    courseId,
    title,
    titleSi: opt(fd, "titleSi"),
    position: (maxPos ?? 0) + 1,
  });

  revalidateCourse(courseId);
  return { success: true };
}

export async function deleteModuleAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("moduleId"));
  const courseId = Number(fd.get("courseId"));
  if (!Number.isFinite(id)) return;
  await db.delete(modules).where(eq(modules.id, id));
  revalidateCourse(courseId);
}

export async function moveModuleAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("moduleId"));
  const courseId = Number(fd.get("courseId"));
  const dir = fd.get("direction") === "up" ? -1 : 1;
  if (!Number.isFinite(id) || !Number.isFinite(courseId)) return;

  const list = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.position), asc(modules.id));
  const idx = list.findIndex((m) => m.id === id);
  const swap = idx + dir;
  if (idx < 0 || swap < 0 || swap >= list.length) return;

  const reordered = [...list];
  [reordered[idx], reordered[swap]] = [reordered[swap], reordered[idx]];
  await Promise.all(
    reordered.map((m, i) => db.update(modules).set({ position: i + 1 }).where(eq(modules.id, m.id))),
  );
  revalidateCourse(courseId);
}

/* ---------------- Lessons ---------------- */

export async function createLessonAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const moduleId = Number(fd.get("moduleId"));
  const courseId = Number(fd.get("courseId"));
  const title = str(fd, "title");
  const youtubeUrl = str(fd, "youtubeUrl");
  if (!Number.isFinite(moduleId)) return { error: "error" };
  if (!title) return { error: "lessonRequired" };
  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) return { error: "invalidYoutube" };

  const [{ maxPos }] = await db
    .select({ maxPos: max(lessons.position) })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId));

  await db.insert(lessons).values({
    moduleId,
    title,
    titleSi: opt(fd, "titleSi"),
    description: str(fd, "description"),
    descriptionSi: opt(fd, "descriptionSi"),
    youtubeUrl,
    youtubeId,
    position: (maxPos ?? 0) + 1,
  });

  revalidateCourse(courseId);
  return { success: true };
}

export async function updateLessonAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("lessonId"));
  const courseId = Number(fd.get("courseId"));
  const title = str(fd, "title");
  const youtubeUrl = str(fd, "youtubeUrl");
  if (!Number.isFinite(id)) return { error: "error" };
  if (!title) return { error: "lessonRequired" };
  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) return { error: "invalidYoutube" };

  await db
    .update(lessons)
    .set({
      title,
      titleSi: opt(fd, "titleSi"),
      description: str(fd, "description"),
      descriptionSi: opt(fd, "descriptionSi"),
      youtubeUrl,
      youtubeId,
    })
    .where(eq(lessons.id, id));

  revalidateCourse(courseId);
  revalidatePath(`/courses/${courseId}/lessons/${id}`);
  return { success: true };
}

export async function deleteLessonAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("lessonId"));
  const courseId = Number(fd.get("courseId"));
  if (!Number.isFinite(id)) return;
  await db.delete(lessons).where(eq(lessons.id, id));
  revalidateCourse(courseId);
}

export async function moveLessonAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("lessonId"));
  const moduleId = Number(fd.get("moduleId"));
  const courseId = Number(fd.get("courseId"));
  const dir = fd.get("direction") === "up" ? -1 : 1;
  if (!Number.isFinite(id) || !Number.isFinite(moduleId)) return;

  const list = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(and(eq(lessons.moduleId, moduleId)))
    .orderBy(asc(lessons.position), asc(lessons.id));
  const idx = list.findIndex((l) => l.id === id);
  const swap = idx + dir;
  if (idx < 0 || swap < 0 || swap >= list.length) return;

  const reordered = [...list];
  [reordered[idx], reordered[swap]] = [reordered[swap], reordered[idx]];
  await Promise.all(
    reordered.map((l, i) => db.update(lessons).set({ position: i + 1 }).where(eq(lessons.id, l.id))),
  );
  revalidateCourse(courseId);
}
