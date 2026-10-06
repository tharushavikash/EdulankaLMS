import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { CourseForm } from "@/components/admin/CourseForm";
import { Card, PageHeader } from "@/components/ui";

export default async function NewCoursePage() {
  const { t } = await getDictionary();
  return (
    <>
      <Link href="/admin" className="mb-4 inline-flex text-sm font-medium text-slate-500 hover:text-indigo-600">← {t.admin.title}</Link>
      <PageHeader title={t.admin.newCourse} subtitle={t.admin.courseDetails} />
      <Card className="max-w-3xl p-6 sm:p-8">
        <CourseForm />
      </Card>
    </>
  );
}
