"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";
import { useI18n } from "@/lib/i18n/client";
import { btnPrimary, inputClass, labelClass } from "./ui";

function ErrorBox({ code }: { code?: string }) {
  const { t } = useI18n();
  if (!code) return null;
  const errors = t.auth.errors as Record<string, string>;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
      {errors[code] ?? t.common.error}
    </div>
  );
}

export function LoginForm({ demo }: { demo?: { admin: string; student: string; password: string } }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, null);

  return (
    <form action={action} className="space-y-5">
      <ErrorBox code={state?.error} />
      <div>
        <label htmlFor="email" className={labelClass}>{t.auth.email}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>{t.auth.password}</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} placeholder="••••••••" />
      </div>
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full py-3`}>
        {pending ? t.common.loading : t.auth.submitLogin}
      </button>
      <p className="text-center text-sm text-slate-600">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="font-semibold text-indigo-600 hover:underline">{t.nav.register}</Link>
      </p>
      {demo && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="mb-2 font-semibold text-slate-700">{t.auth.demo}</p>
          <ul className="space-y-1 font-mono">
            <li>👩‍🏫 {demo.admin} / {demo.password}</li>
            <li>🎓 {demo.student} / {demo.password}</li>
          </ul>
        </div>
      )}
    </form>
  );
}

export function RegisterForm({ teacherCodeHint }: { teacherCodeHint?: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, null);
  const [role, setRole] = useState<"student" | "admin">("student");

  return (
    <form action={action} className="space-y-5">
      <ErrorBox code={state?.error} />
      <div>
        <label htmlFor="name" className={labelClass}>{t.auth.name}</label>
        <input id="name" name="name" required autoComplete="name" className={inputClass} />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>{t.auth.email}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className={labelClass}>{t.auth.password}</label>
          <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelClass}>{t.auth.confirmPassword}</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
        </div>
      </div>

      <div>
        <p className={labelClass}>{t.auth.role}</p>
        <div className="grid grid-cols-2 gap-3">
          {(["student", "admin"] as const).map((r) => (
            <label
              key={r}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                role === r ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-500/10" : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="accent-indigo-600" />
              <span>{r === "student" ? "🎓 " + t.auth.student : "👩‍🏫 " + t.auth.teacher}</span>
            </label>
          ))}
        </div>
      </div>

      {role === "admin" && (
        <div className="animate-fade-up">
          <label htmlFor="teacherCode" className={labelClass}>{t.auth.teacherCode}</label>
          <input id="teacherCode" name="teacherCode" required className={inputClass} />
          <p className="mt-1.5 text-xs text-slate-500">
            {t.auth.teacherCodeHint}
            {teacherCodeHint && (
              <>
                {" "}· Demo: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">{teacherCodeHint}</code>
              </>
            )}
          </p>
        </div>
      )}

      <button type="submit" disabled={pending} className={`${btnPrimary} w-full py-3`}>
        {pending ? t.common.loading : t.auth.submitRegister}
      </button>
      <p className="text-center text-sm text-slate-600">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:underline">{t.nav.login}</Link>
      </p>
    </form>
  );
}
