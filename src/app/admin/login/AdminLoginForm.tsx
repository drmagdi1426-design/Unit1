"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { adminLoginAction, type AdminLoginState } from "./actions";
import { Button, Card } from "@/components/ui";

const initialState: AdminLoginState = { error: null };

export default function AdminLoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);

  return (
    <Card className="w-full max-w-sm p-6 sm:p-8">
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="next" value={next} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-sm font-bold text-muted">
            رمز الدخول
          </label>
          <input
            id="code"
            name="code"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            required
            className="rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl font-extrabold tracking-[0.3em] outline-none ring-brand/30 focus:ring-2"
          />
        </div>
        {state.error && (
          <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
            {state.error}
          </div>
        )}
        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
        </Button>
      </form>
    </Card>
  );
}
