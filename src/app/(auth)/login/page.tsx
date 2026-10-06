import { LoginForm } from "@/components/AuthForms";
import { getDictionary } from "@/lib/i18n/server";

export default async function LoginPage() {
  const { t } = await getDictionary();
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t.auth.loginTitle}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.auth.loginSubtitle}</p>
      </div>
      <LoginForm demo={{ admin: "teacher@edulanka.lk", student: "student@edulanka.lk", password: "password123" }} />
    </>
  );
}
