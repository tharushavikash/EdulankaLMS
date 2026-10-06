"use client";

import { useI18n } from "@/lib/i18n/client";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, pending, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold ${pending ? "opacity-70" : ""}`}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-2.5 py-1 transition ${compact ? "" : "sm:px-3"} ${
          locale === "en" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("si")}
        className={`rounded-full px-2.5 py-1 transition ${compact ? "" : "sm:px-3"} ${
          locale === "si" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
        }`}
        aria-pressed={locale === "si"}
      >
        සිං
      </button>
    </div>
  );
}
