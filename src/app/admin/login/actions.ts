"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setAdminCookie } from "@/lib/auth";

export type AdminLoginState = { error: string | null };

export async function adminLoginAction(
  _prev: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!username || !password) {
    return { error: "الرجاء إدخال اسم المستخدم وكلمة المرور." };
  }

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) {
    return { error: "بيانات الدخول غير صحيحة." };
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return { error: "بيانات الدخول غير صحيحة." };
  }

  await setAdminCookie(admin.id);
  redirect(next.startsWith("/admin") ? next : "/admin");
}
