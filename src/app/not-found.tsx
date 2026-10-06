import { getDictionary } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui";

export default async function NotFound() {
  const { t } = await getDictionary();
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl font-black text-indigo-200">404</p>
      <p className="mt-4 text-lg font-semibold text-slate-800">{t.common.none}</p>
      <div className="mt-6">
        <LinkButton href="/">{t.nav.home}</LinkButton>
      </div>
    </main>
  );
}
