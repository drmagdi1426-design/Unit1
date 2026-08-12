"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "./actions";
import { Button, Card } from "@/components/ui";

const initialState: RegisterState = { error: null };

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <Card className="animate-pop-in p-6 sm:p-8">
      <form action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-bold text-muted">
            الاسم الكامل
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            autoComplete="name"
            placeholder="مثال: سارة العتيبي"
            className="rounded-xl border border-border bg-background px-4 py-3 text-base outline-none ring-brand/30 focus:ring-2"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="identifier" className="text-sm font-bold text-muted">
            البريد الإلكتروني أو الرقم الوظيفي
          </label>
          <input
            id="identifier"
            name="identifier"
            required
            placeholder="example@company.com"
            className="rounded-xl border border-border bg-background px-4 py-3 text-base outline-none ring-brand/30 focus:ring-2"
          />
          <p className="text-xs text-muted">
            يُستخدم هذا المعرّف لحفظ نتيجتك واستئناف الاختبار إن غادرت الصفحة.
          </p>
        </div>

        {state.error && (
          <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
            {state.error}
          </div>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "جارٍ التحضير..." : "ابدأ الاختبار 🚀"}
        </Button>
      </form>
    </Card>
  );
}
