"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setActiveItemBank } from "@/lib/itemBankService";

export async function activateItemBankAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await setActiveItemBank(prisma, id);
  revalidatePath("/admin/item-banks");
  revalidatePath("/admin");
}
