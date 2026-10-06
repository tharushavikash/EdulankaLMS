"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deleteCommentAction, postCommentAction, type CommentState } from "@/app/actions/learning";
import { useI18n } from "@/lib/i18n/client";
import { btnPrimary, btnSecondary, inputClass } from "@/components/ui";

export type QAComment = {
  id: number;
  body: string;
  createdAt: Date | string;
  userId: number;
  userName: string;
  userRole: "admin" | "student";
  replies: Omit<QAComment, "replies">[];
};

type Props = {
  lessonId: number;
  comments: QAComment[];
  currentUser: { id: number; role: "admin" | "student" };
};

function formatDate(d: Date | string, locale: string) {
  return new Date(d).toLocaleString(locale === "si" ? "si-LK" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({ name, role }: { name: string; role: "admin" | "student" }) {
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
        role === "admin" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
      }`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function CommentForm({
  lessonId,
  parentId,
  onDone,
  autoFocus,
}: {
  lessonId: number;
  parentId?: number;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<CommentState, FormData>(postCommentAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onDone?.();
    }
  }, [state, onDone]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="lessonId" value={lessonId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea
        name="body"
        rows={parentId ? 2 : 3}
        required
        autoFocus={autoFocus}
        maxLength={2000}
        placeholder={parentId ? t.qa.replyPlaceholder : t.qa.placeholder}
        className={`${inputClass} resize-y`}
      />
      {state?.error && (
        <p className="text-sm text-rose-600">{state.error === "empty" ? t.qa.empty : t.common.error}</p>
      )}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? t.common.loading : parentId ? t.qa.send : t.qa.post}
        </button>
        {parentId && onDone && (
          <button type="button" onClick={onDone} className={btnSecondary}>
            {t.common.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

function DeleteButton({ commentId }: { commentId: number }) {
  const { t } = useI18n();
  return (
    <form
      action={deleteCommentAction}
      onSubmit={(e) => {
        if (!confirm(t.common.confirmDelete)) e.preventDefault();
      }}
    >
      <input type="hidden" name="commentId" value={commentId} />
      <button className="text-xs font-medium text-slate-400 hover:text-rose-600">{t.common.delete}</button>
    </form>
  );
}

export function QASection({ lessonId, comments, currentUser }: Props) {
  const { t, locale } = useI18n();
  const [replyTo, setReplyTo] = useState<number | null>(null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900">
        <span>💬</span> {t.qa.title}
        <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{comments.length}</span>
      </h2>

      <div className="mt-4">
        <CommentForm lessonId={lessonId} />
      </div>

      <div className="mt-6 space-y-5">
        {comments.length === 0 && <p className="py-6 text-center text-sm text-slate-500">{t.qa.noComments}</p>}
        {comments.map((c) => (
          <article key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex gap-3">
              <Avatar name={c.userName} role={c.userRole} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-slate-900">{c.userName}</span>
                  {c.userRole === "admin" && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">{t.qa.teacherBadge}</span>
                  )}
                  {c.userId === currentUser.id && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t.qa.youBadge}</span>
                  )}
                  <span className="text-xs text-slate-400">{formatDate(c.createdAt, locale)}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-line break-words text-sm text-slate-700">{c.body}</p>
                <div className="mt-2 flex items-center gap-4">
                  {currentUser.role === "admin" && (
                    <button
                      type="button"
                      onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      ↩ {t.qa.reply}
                    </button>
                  )}
                  {c.replies.length > 0 && (
                    <span className="text-xs text-slate-400">
                      {c.replies.length} {t.qa.replies}
                    </span>
                  )}
                  {(currentUser.role === "admin" || c.userId === currentUser.id) && <DeleteButton commentId={c.id} />}
                </div>

                {c.replies.length > 0 && (
                  <div className="mt-3 space-y-3 border-l-2 border-indigo-200 pl-4">
                    {c.replies.map((r) => (
                      <div key={r.id} className="flex gap-3">
                        <Avatar name={r.userName} role={r.userRole} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-sm font-semibold text-slate-900">{r.userName}</span>
                            {r.userRole === "admin" && (
                              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">{t.qa.teacherBadge}</span>
                            )}
                            <span className="text-xs text-slate-400">{formatDate(r.createdAt, locale)}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-line break-words text-sm text-slate-700">{r.body}</p>
                          {currentUser.role === "admin" && (
                            <div className="mt-1">
                              <DeleteButton commentId={r.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {replyTo === c.id && (
                  <div className="mt-3">
                    <CommentForm lessonId={lessonId} parentId={c.id} onDone={() => setReplyTo(null)} autoFocus />
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
