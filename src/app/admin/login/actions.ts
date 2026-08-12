"use server";

import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "crypto";
import { setAdminCookie } from "@/lib/auth";

export type AdminLoginState = { error: string | null };

// timingSafeEqual throws if the two buffers differ in length, which a plain
// Buffer.from(code) would for any wrong-length guess — hashing first fixes
// both inputs at 32 bytes, so the comparison is always safe to run and
// still constant-time.
function codeMatches(submitted: string, expected: string): boolean {
  const a = createHash("sha256").update(submitted).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function adminLoginAction(
  _prev: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const code = String(formData.get("code") ?? "").trim();
  const next = String(formData.get("next") ?? "/admin");

  const expected = process.env.ADMIN_ACCESS_CODE;
  if (!expected) {
    return { error: "لم يتم إعداد رمز دخول المسؤول على الخادم (ADMIN_ACCESS_CODE)." };
  }
  if (!code) {
    return { error: "الرجاء إدخال رمز الدخول." };
  }
  if (!codeMatches(code, expected)) {
    return { error: "رمز الدخول غير صحيح." };
  }

  await setAdminCookie();
  redirect(next.startsWith("/admin") ? next : "/admin");
}
