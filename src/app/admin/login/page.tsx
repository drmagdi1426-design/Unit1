import { Suspense } from "react";
import { PageShell } from "@/components/ui";
import AdminLoginForm from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <PageShell className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="mb-2 text-4xl">🔐</div>
        <h1 className="text-2xl font-extrabold text-foreground">لوحة تحكم المسؤول</h1>
        <p className="mt-1 text-muted">دخول مخصص لفريق إدارة الاختبار فقط.</p>
      </div>
      <Suspense>
        <AdminLoginForm />
      </Suspense>
    </PageShell>
  );
}
