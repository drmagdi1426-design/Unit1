"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteParticipantAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Cascades to the participant's attempts, answer logs, and badges
  // (see onDelete: Cascade on those relations in prisma/schema.prisma).
  await prisma.participant.delete({ where: { id } }).catch(() => {
    // Already deleted (e.g. a double-submit) — nothing left to do.
  });

  revalidatePath("/admin/participants");
  revalidatePath("/admin");
  redirect("/admin/participants");
}
