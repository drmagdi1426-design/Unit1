import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { ParsedItemBank } from "@/lib/itemBankImport";
import { computeQuestionPoints } from "@/lib/scoring";

export interface CreateItemBankInput {
  code: string;
  title: string;
  description?: string | null;
  sourceFile?: string | null;
}

/**
 * Persists a parsed workbook as a new ItemBank with its Questions and
 * Choices. Runs in a single transaction so a partially-imported bank can
 * never exist. Reused by the seed script and the admin "upload a unit" flow.
 */
export async function createItemBankInDb(
  prisma: PrismaClient,
  input: CreateItemBankInput,
  parsed: ParsedItemBank
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const bank = await tx.itemBank.create({
      data: {
        code: input.code,
        title: input.title,
        description: input.description ?? null,
        sourceFile: input.sourceFile ?? null,
        blueprintJson: parsed.blueprintRows ?? undefined,
        qaLogJson: parsed.qaLogRows ?? undefined,
      },
    });

    for (const q of parsed.questions) {
      await tx.question.create({
        data: {
          itemBankId: bank.id,
          externalCode: q.externalCode,
          order: q.order,
          language: q.language,
          knowledgePath: q.knowledgePath,
          frameworkRef: q.frameworkRef,
          bloomLevel: q.bloomLevel,
          bloomLabel: q.bloomLabel,
          difficulty: q.difficulty,
          difficultyLabel: q.difficultyLabel,
          targetPValue: q.targetPValue,
          targetDiscrimination: q.targetDiscrimination,
          estimatedTimeSeconds: q.estimatedTimeSeconds,
          pointsValue: computeQuestionPoints(q.difficulty, q.bloomLevel),
          text: q.text,
          sourceReference: q.sourceReference,
          reviewerNotes: q.reviewerNotes,
          choices: {
            create: q.choices.map((c) => ({
              label: c.label,
              text: c.text,
              isCorrect: c.isCorrect,
              justification: c.justification,
              distractorType: c.distractorType,
            })),
          },
        },
      });
    }

    return bank;
  }, { timeout: 30000 });
}

/** Deactivates every other bank and activates this one — only one bank is "live" for new registrations at a time. */
export async function setActiveItemBank(prisma: PrismaClient, itemBankId: string) {
  await prisma.$transaction([
    prisma.itemBank.updateMany({ data: { isActive: false }, where: {} }),
    prisma.itemBank.update({ where: { id: itemBankId }, data: { isActive: true } }),
  ]);
}
