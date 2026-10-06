import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/auth";
import { getPlatformStats } from "@/lib/data";

export default async function HomePage() {
  const [{ t }, user, stats] = await Promise.all([getDictionary(), getSessionUser(), getPlatformStats()]);
  const primaryHref = user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/register";

  const features = [
    { title: t.landing.feature1Title, body: t.landing.feature1Body, icon: "▶", color: "from-rose-500 to-orange-500" },
    { title: t.landing.feature2Title, body: t.landing.feature2Body, icon: "🔒", color: "from-indigo-500 to-violet-500" },
    { title: t.landing.feature3Title, body: t.landing.feature3Body, icon: "📈", color: "from-emerald-500 to-teal-500" },
    { title: t.landing.feature4Title, body: t.landing.feature4Body, icon: "💬", color: "from-sky-500 to-cyan-500" },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/40 blur-3xl" />
          <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-fuchsia-600/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              English · සිංහල
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {t.landing.heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg">{t.landing.heroSubtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-50"
              >
                {user ? (user.role === "admin" ? t.nav.admin : t.nav.dashboard) : t.landing.getStarted}
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t.landing.browseCourses}
              </Link>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
              {[
                [stats.courses, t.landing.stats.courses],
                [stats.lessons, t.landing.stats.lessons],
                [stats.students, t.landing.stats.students],
              ].map(([v, l]) => (
                <div key={String(l)}>
                  <dt className="text-2xl font-bold sm:text-3xl">{v}</dt>
                  <dd className="text-xs text-slate-400 sm:text-sm">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-fade-up relative hidden lg:block" style={{ animationDelay: "120ms" }}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur">
              <div className="overflow-hidden rounded-2xl bg-slate-900">
                <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="grid grid-cols-3 gap-4 p-5">
                  <div className="col-span-2 space-y-3">
                    <div className="grid aspect-video place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-indigo-700">
                        <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </span>
                    </div>
                    <div className="h-3 w-3/4 rounded bg-white/20" />
                    <div className="h-2.5 w-1/2 rounded bg-white/10" />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-8 w-32 rounded-lg bg-emerald-500/80" />
                      <div className="h-8 w-20 rounded-lg bg-white/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`flex items-center gap-2 rounded-lg p-2 ${i === 3 ? "bg-indigo-500/20" : "bg-white/5"}`}>
                        <span className={`h-4 w-4 rounded-full ${i < 3 ? "bg-emerald-400" : "border border-white/20"}`} />
                        <span className="h-2 flex-1 rounded bg-white/15" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${f.color} text-lg text-white shadow-md`}>
                {f.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-xl shadow-indigo-500/20 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-200">{t.landing.forTeachers}</p>
            <p className="mt-3 text-lg leading-relaxed sm:text-xl">{t.landing.teachersBody}</p>
            <Link href={user?.role === "admin" ? "/admin" : "/register"} className="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
              {t.nav.admin} →
            </Link>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-xl shadow-emerald-500/20 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-100">{t.landing.forStudents}</p>
            <p className="mt-3 text-lg leading-relaxed sm:text-xl">{t.landing.studentsBody}</p>
            <Link href="/courses" className="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              {t.landing.browseCourses} →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
