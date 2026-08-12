"use server";

import { redirect } from "next/navigation";
import { clearAdminCookie } from "@/lib/auth";

export async function adminLogoutAction() {
  await clearAdminCookie();
  redirect("/admin/login");
}
