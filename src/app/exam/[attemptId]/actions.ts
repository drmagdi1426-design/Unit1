"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentParticipant } from "@/lib/auth";
import { getNextSafeQuestion } from "@/lib/examService";
import { recordAnswer, completeAttempt } from "@/lib/gamification";

async function assertOwnership(attemptId: string) {
  const participant = await getCurrentParticipant();
  if (!participant) throw new Error("غير مصرّح.");
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.participantId !== participant.id) {
    throw new Error("غير مصرّح بالوصول لهذه المحاولة.");
  }
  return attempt;
}

export async function submitAnswerAction(params: {
  attemptId: string;
  questionId: string;
  chosenChoiceId: string | null;
  timeSpentMs: number;
}) {
  const attempt = await assertOwnership(params.attemptId);
  if (attempt.status !== "IN_PROGRESS") {
    throw new Error("انتهت هذه المحاولة بالفعل.");
  }

  const reveal = await recordAnswer(params);
  const { question: next, questionNumber, totalQuestions } = await getNextSafeQuestion(params.attemptId);

  if (!next) {
    const summary = await completeAttempt(params.attemptId);
    return { reveal, done: true as const, summary };
  }

  const updated = await prisma.attempt.findUniqueOrThrow({ where: { id: params.attemptId } });
  return {
    reveal,
    done: false as const,
    next,
    questionNumber,
    totalQuestions,
    attemptTotals: { totalPoints: updated.totalPoints, correctCount: updated.correctCount },
  };
}
