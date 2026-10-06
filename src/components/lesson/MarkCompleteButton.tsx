"use client";

import { useTransition } from "react";
import { toggleCompleteAction } from "@/app/actions/learning";
import { useI18n } from "@/lib/i18n/client";

export function MarkCompleteButton({ lessonId, completed }: { lessonId: number; completed: boolean }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await toggleCompleteAction(fd);
        });
      }}
    >
      <input type="hidden" name="lessonId" value={lessonId} />
      <button
        type="submit"
        disabled={pending}
        title={completed ? t.lesson.markIncomplete : t.lesson.markComplete}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-60 ${
          completed
            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-white/70"}`}>
          {completed && (
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        {pending ? t.common.loading : completed ? t.lesson.completed : t.lesson.markComplete}
      </button>
    </form>
  );
}
