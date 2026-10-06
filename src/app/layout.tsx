import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/client";
import { getDictionary } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "EduLanka LMS",
  description: "A bilingual (English / Sinhala) learning management system powered by YouTube lessons.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [{ locale, t }, user] = await Promise.all([getDictionary(), getSessionUser()]);

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Sinhala:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <I18nProvider initialLocale={locale}>
          <div className="flex min-h-screen flex-col">
            <Navbar user={user} />
            <div className="flex-1">{children}</div>
            <footer className="border-t border-slate-200 bg-white">
              <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left lg:px-8">
                <p>
                  © {new Date().getFullYear()} {t.appName}. {t.footer.rights}
                </p>
                <p>{t.footer.built}</p>
              </div>
            </footer>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
