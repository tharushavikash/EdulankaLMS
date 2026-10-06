"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";

export function AdminTabs() {
  const { t } = useI18n();
  const pathname = usePathname();
  const tabs = [
    { href: "/admin", label: t.admin.courses, exact: false, match: (p: string) => p === "/admin" || p.startsWith("/admin/courses") },
    { href: "/admin/students", label: t.admin.students, exact: true, match: (p: string) => p.startsWith("/admin/students") },
  ];
  return (
    <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
              active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
