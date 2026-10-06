"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { enrollments, users } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth";
import type { FormState } from "./courses";
import { put } from '@vercel/blob';

function revalidateAll(courseId: number) {
  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath("/dashboard");
}

/** Student requests access to a course. */
export async function requestEnrollmentAction(fd: FormData) {
  const user = await requireUser();
  const courseId = Number(fd.get("courseId"));
  const receipt = fd.get("receipt") as File | null;

  if (!Number.isFinite(courseId) || user.role !== "student") return;

  let receiptUrl = null;
  
  // File එකක් තියෙනවද කියලා බලලා ඒක Vercel Blob එකට upload කරනවා
  if (receipt && receipt.size > 0) {
    const blob = await put(`receipts/user-${user.id}-course-${courseId}-${receipt.name}`, receipt, { 
      access: 'public' 
    });
    receiptUrl = blob.url;
  }

  await db
    .insert(enrollments)
    .values({ userId: user.id, courseId, status: "pending", receiptUrl })
    .onConflictDoNothing();

  revalidateAll(courseId);
}

export async function approveEnrollmentAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("enrollmentId"));
  const courseId = Number(fd.get("courseId"));
  if (!Number.isFinite(id)) return;
  await db.update(enrollments).set({ status: "approved" }).where(eq(enrollments.id, id));
  revalidateAll(courseId);
}

export async function revokeEnrollmentAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("enrollmentId"));
  const courseId = Number(fd.get("courseId"));
  if (!Number.isFinite(id)) return;
  await db.delete(enrollments).where(eq(enrollments.id, id));
  revalidateAll(courseId);
}

/** Admin grants access directly to a student by email. */
export async function grantAccessAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const courseId = Number(fd.get("courseId"));
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!Number.isFinite(courseId) || !email) return { error: "userNotFound" };

  const [student] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), eq(users.role, "student")))
    .limit(1);
  if (!student) return { error: "userNotFound" };

  await db
    .insert(enrollments)
    .values({ userId: student.id, courseId, status: "approved" })
    .onConflictDoUpdate({
      target: [enrollments.userId, enrollments.courseId],
      set: { status: "approved" },
    });

  revalidateAll(courseId);
  return { success: true };
}
