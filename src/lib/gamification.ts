import { prisma } from "@/lib/prisma";
import { computeLevel } from "@/lib/scoring";
import { BADGE_CATALOG, type BadgeCode } from "@/lib/badges";

/**
 * Records one answer within an in-progress attempt: scores it, logs the
 * time spent, and keeps the attempt's running totals in sync so the
 * gamified UI (points/progress bar) can update after every question
 * without waiting for completion.
 */
export async function recordAnswer(params: {
  attemptId: string;
  questionId: string;
  chosenChoiceId: string | null;
  timeSpentMs: number;
}) {
  const question = await prisma.question.findUniqueOrThrow({
    where: { id: params.questionId },
    include: { choices: true },
  });

  const chosen = params.chosenChoiceId
    ? question.choices.find((c) => c.id === params.chosenChoiceId) ?? null
    : null;
  const isCorrect = !!chosen?.isCorrect;
  const pointsAwarded = isCorrect ? question.pointsValue : 0;

  const log = await prisma.answerLog.upsert({
    where: { attemptId_questionId: { attemptId: params.attemptId, questionId: params.questionId } },
    create: {
      attemptId: params.attemptId,
      questionId: params.questionId,
      chosenChoiceId: chosen?.id ?? null,
      isCorrect,
      timeSpentMs: Math.max(0, Math.round(params.timeSpentMs)),
      pointsAwarded,
    },
    update: {
      chosenChoiceId: chosen?.id ?? null,
      isCorrect,
      timeSpentMs: Math.max(0, Math.round(params.timeSpentMs)),
      pointsAwarded,
    },
  });

  const agg = await prisma.answerLog.aggregate({
    where: { attemptId: params.attemptId },
    _sum: { pointsAwarded: true },
    _count: { _all: true },
  });
  const correctCount = await prisma.answerLog.count({
    where: { attemptId: params.attemptId, isCorrect: true },
  });

  await prisma.attempt.update({
    where: { id: params.attemptId },
    data: {
      totalQuestions: agg._count._all,
      correctCount,
      totalPoints: agg._sum.pointsAwarded ?? 0,
    },
  });

  const correctChoice = question.choices.find((c) => c.isCorrect)!;

  return {
    isCorrect,
    pointsAwarded,
    correctChoice: {
      id: correctChoice.id,
      label: correctChoice.label,
      text: correctChoice.text,
      justification: correctChoice.justification,
    },
    chosenChoice: chosen
      ? { id: chosen.id, label: chosen.label, justification: chosen.justification }
      : null,
    allChoices: question.choices.map((c) => ({
      id: c.id,
      label: c.label,
      text: c.text,
      isCorrect: c.isCorrect,
      justification: c.justification,
    })),
    answerLogId: log.id,
  };
}

/**
 * Finalizes an attempt: computes the final score/level, evaluates and
 * awards badges, and marks the attempt COMPLETED. Idempotent — safe to
 * call again (won't double-award badges) though normally called once.
 */
export async function completeAttempt(attemptId: string) {
  const attempt = await prisma.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      answerLogs: { include: { question: true } },
      itemBank: { include: { questions: true } },
    },
  });

  const maxPoints = attempt.itemBank.questions.reduce((s, q) => s + q.pointsValue, 0);
  const totalQuestions = attempt.itemBank.questions.length;
  const correctCount = attempt.answerLogs.filter((a) => a.isCorrect).length;
  const totalPoints = attempt.answerLogs.reduce((s, a) => s + a.pointsAwarded, 0);
  const scorePercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const { level, title } = computeLevel(scorePercent);

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      totalQuestions,
      correctCount,
      totalPoints,
      maxPoints,
      scorePercent,
      level,
      levelTitle: title,
    },
  });

  const earned = await evaluateBadges(attempt.participantId, attemptId, attempt.answerLogs, totalQuestions, scorePercent);

  return { scorePercent, correctCount, totalQuestions, totalPoints, maxPoints, level, levelTitle: title, earnedBadges: earned };
}

async function evaluateBadges(
  participantId: string,
  attemptId: string,
  answerLogs: { isCorrect: boolean; timeSpentMs: number; question: { bloomLevel: string; estimatedTimeSeconds: number } }[],
  totalQuestions: number,
  scorePercent: number
) {
  const toAward: BadgeCode[] = [];

  if (answerLogs.length >= totalQuestions && totalQuestions > 0) toAward.push("COMPLETION");
  if (scorePercent >= 90) toAward.push("HIGH_ACCURACY");
  if (scorePercent >= 99.999) toAward.push("PERFECT_SCORE");

  const higherOrder = answerLogs.filter((a) => a.question.bloomLevel === "BLOOM4" || a.question.bloomLevel === "BLOOM5");
  if (higherOrder.length > 0 && higherOrder.every((a) => a.isCorrect)) toAward.push("DEEP_ANALYST");

  if (answerLogs.length > 0) {
    const totalActualSec = answerLogs.reduce((s, a) => s + a.timeSpentMs / 1000, 0);
    const totalEstimatedSec = answerLogs.reduce((s, a) => s + a.question.estimatedTimeSeconds, 0);
    const ratio = totalEstimatedSec > 0 ? totalActualSec / totalEstimatedSec : 0;
    if (scorePercent >= 80 && ratio >= 0.5 && ratio <= 1.5) toAward.push("PERFECT_PACE");
  }

  if (toAward.length === 0) return [];

  const badgeRows = await prisma.badge.findMany({ where: { code: { in: toAward } } });
  const awarded: { code: string; title: string; icon: string; description: string }[] = [];

  for (const badge of badgeRows) {
    const result = await prisma.participantBadge.upsert({
      where: { participantId_badgeId_attemptId: { participantId, badgeId: badge.id, attemptId } },
      create: { participantId, badgeId: badge.id, attemptId },
      update: {},
    });
    if (result) {
      awarded.push({ code: badge.code, title: badge.title, icon: badge.icon, description: badge.description });
    }
  }

  return awarded;
}

export async function ensureBadgeCatalogSeeded() {
  for (const b of BADGE_CATALOG) {
    await prisma.badge.upsert({
      where: { code: b.code },
      create: b,
      update: { title: b.title, description: b.description, icon: b.icon },
    });
  }
}
