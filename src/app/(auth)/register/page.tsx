import { RegisterForm } from "@/components/AuthForms";
import { getDictionary } from "@/lib/i18n/server";

export default async function RegisterPage() {
  const { t } = await getDictionary();
  const hint = process.env.ADMIN_INVITE_CODE ? undefined : "TEACH2024";
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t.auth.registerTitle}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.auth.registerSubtitle}</p>
      </div>
      <RegisterForm teacherCodeHint={hint} />
    </>
  );
}
