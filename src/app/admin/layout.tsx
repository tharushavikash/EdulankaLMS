import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { AdminTabs } from "@/components/admin/AdminTabs";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminTabs />
      {children}
    </main>
  );
}
