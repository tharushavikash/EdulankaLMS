"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createLessonAction, createModuleAction, updateLessonAction, type FormState } from "@/app/actions/courses";
import { grantAccessAction } from "@/app/actions/enrollments";
import { useI18n } from "@/lib/i18n/client";
import { extractYouTubeId, youtubeThumbnail } from "@/lib/youtube";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";
import { FormMessage } from "./CourseForm";

/* ---------- Add module ---------- */
export function ModuleForm({ courseId }: { courseId: number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(createModuleAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${btnPrimary} w-full py-3 sm:w-auto`}>
        + {t.admin.addModule}
      </button>
    );
  }

  return (
    <form ref={ref} action={action} className="animate-fade-up space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
      <input type="hidden" name="courseId" value={courseId} />
      <h3 className="font-semibold text-slate-900">{t.admin.addModule}</h3>
      <FormMessage state={state?.success ? null : state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.admin.moduleTitle} *</label>
          <input name="title" required className={inputClass} autoFocus />
        </div>
        <div>
          <label className={labelClass}>{t.admin.moduleTitleSi} <span className="text-slate-400">({t.common.optional})</span></label>
          <input name="titleSi" className={inputClass} lang="si" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>{pending ? t.common.loading : t.common.add}</button>
        <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>{t.common.cancel}</button>
      </div>
    </form>
  );
}

/* ---------- Add / edit lesson ---------- */
type LessonValues = {
  id: number;
  title: string;
  titleSi: string | null;
  description: string;
  descriptionSi: string | null;
  youtubeUrl: string;
};

export function LessonForm({
  courseId,
  moduleId,
  lesson,
  onClose,
}: {
  courseId: number;
  moduleId: number;
  lesson?: LessonValues;
  onClose?: () => void;
}) {
  const { t } = useI18n();
  const isEdit = Boolean(lesson);
  const [open, setOpen] = useState(isEdit);
  const [url, setUrl] = useState(lesson?.youtubeUrl ?? "");
  const [state, action, pending] = useActionState<FormState, FormData>(isEdit ? updateLessonAction : createLessonAction, null);
  const ref = useRef<HTMLFormElement>(null);
  const ytId = extractYouTubeId(url);

  useEffect(() => {
    if (state?.success) {
      if (!isEdit) {
        ref.current?.reset();
        setUrl("");
        setOpen(false);
      } else {
        onClose?.();
      }
    }
  }, [state, isEdit, onClose]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">
        + {t.admin.addLesson}
      </button>
    );
  }

  return (
    <form ref={ref} action={action} className="animate-fade-up space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      {lesson && <input type="hidden" name="lessonId" value={lesson.id} />}
      <h4 className="font-semibold text-slate-900">{isEdit ? t.common.edit : t.admin.addLesson}</h4>
      <FormMessage state={state?.success ? null : state} />

      <div>
        <label className={labelClass}>{t.admin.youtubeUrl} *</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            name="youtubeUrl"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
            placeholder="https://www.youtube.com/watch?v=…"
            inputMode="url"
          />
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-slate-200 sm:w-32">
            {ytId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={youtubeThumbnail(ytId, "mq")} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-xs text-slate-500">▶</div>
            )}
          </div>
        </div>
        <p className={`mt-1.5 text-xs ${url && !ytId ? "text-rose-600" : "text-slate-500"}`}>
          {url && !ytId ? t.admin.invalidYoutube : t.admin.youtubeHint}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.admin.lessonTitle} *</label>
          <input name="title" required defaultValue={lesson?.title ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t.admin.lessonTitleSi} <span className="text-slate-400">({t.common.optional})</span></label>
          <input name="titleSi" defaultValue={lesson?.titleSi ?? ""} className={inputClass} lang="si" />
        </div>
        <div>
          <label className={labelClass}>{t.admin.lessonDescription}</label>
          <textarea name="description" rows={3} defaultValue={lesson?.description ?? ""} className={`${inputClass} resize-y`} />
        </div>
        <div>
          <label className={labelClass}>{t.admin.lessonDescriptionSi} <span className="text-slate-400">({t.common.optional})</span></label>
          <textarea name="descriptionSi" rows={3} defaultValue={lesson?.descriptionSi ?? ""} className={`${inputClass} resize-y`} lang="si" />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={pending || !ytId} className={btnPrimary}>
          {pending ? t.common.loading : isEdit ? t.common.save : t.common.add}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onClose?.();
          }}
          className={btnSecondary}
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}

/* ---------- Edit lesson toggle (wraps LessonForm) ---------- */
export function EditLessonButton({ courseId, moduleId, lesson }: { courseId: number; moduleId: number; lesson: LessonValues }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
        {t.common.edit}
      </button>
    );
  }
  return (
    <div className="w-full">
      <LessonForm courseId={courseId} moduleId={moduleId} lesson={lesson} onClose={() => setEditing(false)} />
    </div>
  );
}

/* ---------- Grant access ---------- */
export function GrantAccessForm({ courseId }: { courseId: number }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(grantAccessAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="courseId" value={courseId} />
      <label className={labelClass}>{t.admin.grantAccess}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="email" type="email" required placeholder={t.admin.studentEmail} className={inputClass} />
        <button type="submit" disabled={pending} className={`${btnPrimary} shrink-0`}>
          {pending ? t.common.loading : t.admin.grant}
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

/* ---------- Confirm-delete wrapper ---------- */
export function ConfirmForm({
  action,
  children,
  className,
  hidden,
}: {
  action: (fd: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  hidden: Record<string, string | number>;
}) {
  const { t } = useI18n();
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!confirm(t.common.confirmDelete)) e.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {children}
    </form>
  );
}
