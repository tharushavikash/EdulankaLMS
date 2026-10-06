import Link from "next/link";
import { youtubeThumbnail } from "@/lib/youtube";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { pick } from "@/lib/i18n/dictionaries";
import { Badge, ProgressBar } from "./ui";

export type CourseCardData = {
  id: number;
  title: string;
  titleSi: string | null;
  description: string;
  descriptionSi: string | null;
  thumbnailUrl: string | null;
  firstYoutubeId?: string;
  lessonCount: number;
  authorName?: string;
  status?: "enrolled" | "pending" | "none" | "admin";
  progress?: { total: number; completed: number };
};

export function CourseThumb({
  course,
  className = "",
}: {
  course: Pick<CourseCardData, "thumbnailUrl" | "firstYoutubeId" | "title">;
  className?: string;
}) {
  const src = course.thumbnailUrl || (course.firstYoutubeId ? youtubeThumbnail(course.firstYoutubeId) : null);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={course.title} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="grid h-full w-full place-items-center text-white/80">
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function CourseCard({
  course,
  locale,
  t,
  href,
}: {
  course: CourseCardData;
  locale: Locale;
  t: Dictionary;
  href: string;
}) {
  const pct = course.progress && course.progress.total > 0 ? (course.progress.completed / course.progress.total) * 100 : 0;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
    >
      <CourseThumb course={course} className="aspect-video" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="slate">
            {course.lessonCount} {t.common.lessons}
          </Badge>
          {course.status === "enrolled" && <Badge tone="emerald">{t.courses.enrolled}</Badge>}
          {course.status === "pending" && <Badge tone="amber">{t.courses.pending}</Badge>}
          {course.progress && pct >= 100 && <Badge tone="emerald">✓ {t.courses.completed}</Badge>}
        </div>
        <h3 className="text-lg font-semibold leading-snug text-slate-900 group-hover:text-indigo-700">
          {pick(locale, course.title, course.titleSi)}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
          {pick(locale, course.description, course.descriptionSi)}
        </p>
        {course.authorName && (
          <p className="mt-3 text-xs text-slate-500">
            {t.courses.instructor}: <span className="font-medium text-slate-700">{course.authorName}</span>
          </p>
        )}
        {course.progress && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>{t.courses.progress}</span>
              <span className="font-semibold text-slate-700">
                {course.progress.completed}/{course.progress.total} · {Math.round(pct)}%
              </span>
            </div>
            <ProgressBar value={pct} />
          </div>
        )}
      </div>
    </Link>
  );
}
