import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { enrollments, lessonProgress, users } from "@/db/schema";
import { getDictionary } from "@/lib/i18n/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function StudentsPage() {
  const { locale, t } = await getDictionary();

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      enrolled: sql<number>`(select count(*) from ${enrollments} e where e.user_id = ${users.id} and e.status = 'approved')`,
      completed: sql<number>`(select count(*) from ${lessonProgress} p where p.user_id = ${users.id})`,
    })
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(desc(users.createdAt));

  const fmt = (d: Date) => new Date(d).toLocaleDateString(locale === "si" ? "si-LK" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <PageHeader title={t.admin.students} subtitle={t.admin.studentsSubtitle} />
      {rows.length === 0 ? (
        <EmptyState title={t.common.none} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t.auth.name}</th>
                  <th className="px-5 py-3 font-semibold">{t.auth.email}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.enrolledIn}</th>
                  <th className="px-5 py-3 font-semibold">{t.dashboard.completedLessons}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.joined}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-slate-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.email}</td>
                    <td className="px-5 py-3 text-slate-700">{Number(s.enrolled)} {t.admin.courses.toLowerCase()}</td>
                    <td className="px-5 py-3 text-slate-700">{Number(s.completed)}</td>
                    <td className="px-5 py-3 text-slate-500">{fmt(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
