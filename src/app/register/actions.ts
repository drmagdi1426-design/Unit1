"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setParticipantCookie } from "@/lib/auth";
import { getActiveItemBank, getOrCreateAttempt } from "@/lib/examService";

const schema = z.object({
  fullName: z.string().trim().min(2, "الاسم الكامل مطلوب (حرفان على الأقل)."),
  identifier: z
    .string()
    .trim()
    .min(3, "البريد الإلكتروني أو الرقم الوظيفي مطلوب.")
    .max(120),
});

export type RegisterState = { error: string | null };

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    identifier: formData.get("identifier"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة." };
  }

  const bank = await getActiveItemBank();
  if (!bank) {
    return { error: "لا يوجد اختبار نشط حالياً. الرجاء التواصل مع مسؤول النظام." };
  }

  const identifier = parsed.data.identifier.toLowerCase();
  const participant = await prisma.participant.upsert({
    where: { identifier },
    create: { identifier, fullName: parsed.data.fullName },
    update: { fullName: parsed.data.fullName },
  });

  await setParticipantCookie(participant.id);
  const attempt = await getOrCreateAttempt(participant.id, bank.id);
  redirect(`/exam/${attempt.id}`);
}
