"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export type AuthState = { error?: string } | null;

const TEACHER_CODE = process.env.ADMIN_INVITE_CODE ?? "TEACH2024";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!isEmail(email) || !password) return { error: "invalid" };

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return { error: "invalid" };
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "invalid" };

  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const role = String(formData.get("role") ?? "student") === "admin" ? "admin" : "student";
  const teacherCode = String(formData.get("teacherCode") ?? "").trim();

  if (!name) return { error: "nameRequired" };
  if (!isEmail(email)) return { error: "emailInvalid" };
  if (password.length < 6) return { error: "passwordShort" };
  if (password !== confirm) return { error: "passwordMismatch" };
  if (role === "admin" && teacherCode !== TEACHER_CODE) return { error: "badTeacherCode" };

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return { error: "exists" };

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

  await createSession(created);
  redirect(created.role === "admin" ? "/admin" : "/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
