"use client";

import { useActionState } from "react";
import { createCourseAction, updateCourseAction, type FormState } from "@/app/actions/courses";
import { useI18n } from "@/lib/i18n/client";
import { btnPrimary, inputClass, labelClass } from "@/components/ui";

type CourseValues = {
  id?: number;
  title?: string;
  titleSi?: string | null;
  description?: string;
  descriptionSi?: string | null;
  thumbnailUrl?: string | null;
  published?: boolean;
};

export function FormMessage({ state }: { state: FormState }) {
  const { t } = useI18n();
  if (!state) return null;
  if (state.success) {
    return <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{t.common.saved}</div>;
  }
  if (state.error) {
    const admin = t.admin as Record<string, string>;
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
        {admin[state.error] ?? t.common.error}
      </div>
    );
  }
  return null;
}

export function CourseForm({ course }: { course?: CourseValues }) {
  const { t } = useI18n();
  const isEdit = Boolean(course?.id);
  const [state, action, pending] = useActionState<FormState, FormData>(isEdit ? updateCourseAction : createCourseAction, null);

  return (
    <form action={action} className="space-y-5">
      {course?.id && <input type="hidden" name="courseId" value={course.id} />}
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className={labelClass}>{t.admin.courseTitle} *</label>
          <input id="title" name="title" required defaultValue={course?.title ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="titleSi" className={labelClass}>{t.admin.courseTitleSi} <span className="text-slate-400">({t.common.optional})</span></label>
          <input id="titleSi" name="titleSi" defaultValue={course?.titleSi ?? ""} className={inputClass} lang="si" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="description" className={labelClass}>{t.admin.courseDescription}</label>
          <textarea id="description" name="description" rows={4} defaultValue={course?.description ?? ""} className={`${inputClass} resize-y`} />
        </div>
        <div>
          <label htmlFor="descriptionSi" className={labelClass}>{t.admin.courseDescriptionSi} <span className="text-slate-400">({t.common.optional})</span></label>
          <textarea id="descriptionSi" name="descriptionSi" rows={4} defaultValue={course?.descriptionSi ?? ""} className={`${inputClass} resize-y`} lang="si" />
        </div>
      </div>
      <div>
        <label htmlFor="thumbnailUrl" className={labelClass}>{t.admin.thumbnailUrl} <span className="text-slate-400">({t.common.optional})</span></label>
        <input id="thumbnailUrl" name="thumbnailUrl" type="url" defaultValue={course?.thumbnailUrl ?? ""} className={inputClass} placeholder="https://…" />
      </div>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input type="checkbox" name="published" defaultChecked={course?.published ?? true} className="h-4 w-4 accent-indigo-600" />
        <span className="text-sm font-medium text-slate-700">{t.admin.published}</span>
      </label>
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? t.common.loading : isEdit ? t.admin.updateCourse : t.admin.createCourse}
      </button>
    </form>
  );
}
