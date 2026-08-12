import "server-only";
import { prisma } from "@/lib/prisma";
import { LEVELS } from "@/lib/scoring";

const PASS_THRESHOLD = 60;

export async function getOverviewStats(itemBankId?: string) {
  const attemptWhere = itemBankId ? { itemBankId } : {};

  const [participantsCount, attemptsTotal, completedAttempts] = await Promise.all([
    prisma.participant.count(),
    prisma.attempt.count({ where: attemptWhere }),
    prisma.attempt.findMany({
      where: { ...attemptWhere, status: "COMPLETED" },
      select: {
        scorePercent: true,
        startedAt: true,
        completedAt: true,
        level: true,
        levelTitle: true,
      },
    }),
  ]);

  const completedCount = completedAttempts.length;
  const completionRate = attemptsTotal > 0 ? (completedCount / attemptsTotal) * 100 : 0;
  const avgScorePercent =
    completedCount > 0
      ? completedAttempts.reduce((s, a) => s + (a.scorePercent ?? 0), 0) / completedCount
      : 0;
  const durations = completedAttempts
    .filter((a) => a.completedAt)
    .map((a) => (a.completedAt!.getTime() - a.startedAt.getTime()) / 1000);
  const avgDurationSec = durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;
  const passCount = completedAttempts.filter((a) => (a.scorePercent ?? 0) >= PASS_THRESHOLD).length;
  const passRate = completedCount > 0 ? (passCount / completedCount) * 100 : 0;

  const levelDistribution = LEVELS.map((l) => ({
    level: l.level,
    title: l.title,
    count: completedAttempts.filter((a) => a.level === l.level).length,
  }));

  // Completed attempts per day, last 14 days.
  const days: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = completedAttempts.filter(
      (a) => a.completedAt && a.completedAt.toISOString().slice(0, 10) === key
    ).length;
    days.push({ date: key, count });
  }

  return {
    participantsCount,
    attemptsTotal,
    completedCount,
    completionRate,
    avgScorePercent,
    avgDurationSec,
    passRate,
    levelDistribution,
    attemptsByDay: days,
  };
}

export interface QuestionAnalyticsRow {
  id: string;
  order: number;
  externalCode: string;
  text: string;
  knowledgePath: string;
  bloomLabel: string;
  difficultyLabel: string;
  estimatedTimeSeconds: number;
  targetPValue: number | null;
  answeredCount: number;
  correctCount: number;
  actualPValue: number | null;
  avgActualTimeSec: number | null;
  timeVariancePercent: number | null; // (actual - estimated) / estimated * 100
  choiceDistribution: { label: string; text: string; isCorrect: boolean; count: number }[];
}

export async function getQuestionAnalytics(itemBankId: string): Promise<QuestionAnalyticsRow[]> {
  const questions = await prisma.question.findMany({
    where: { itemBankId },
    orderBy: { order: "asc" },
    include: {
      choices: true,
      answerLogs: { select: { isCorrect: true, timeSpentMs: true, chosenChoiceId: true } },
    },
  });

  return questions.map((q) => {
    const answeredCount = q.answerLogs.length;
    const correctCount = q.answerLogs.filter((a) => a.isCorrect).length;
    const actualPValue = answeredCount > 0 ? correctCount / answeredCount : null;
    const avgActualTimeSec =
      answeredCount > 0
        ? q.answerLogs.reduce((s, a) => s + a.timeSpentMs / 1000, 0) / answeredCount
        : null;
    const timeVariancePercent =
      avgActualTimeSec !== null && q.estimatedTimeSeconds > 0
        ? ((avgActualTimeSec - q.estimatedTimeSeconds) / q.estimatedTimeSeconds) * 100
        : null;

    const choiceDistribution = q.choices
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((c) => ({
        label: c.label,
        text: c.text,
        isCorrect: c.isCorrect,
        count: q.answerLogs.filter((a) => a.chosenChoiceId === c.id).length,
      }));

    return {
      id: q.id,
      order: q.order,
      externalCode: q.externalCode,
      text: q.text,
      knowledgePath: q.knowledgePath,
      bloomLabel: q.bloomLabel,
      difficultyLabel: q.difficultyLabel,
      estimatedTimeSeconds: q.estimatedTimeSeconds,
      targetPValue: q.targetPValue,
      answeredCount,
      correctCount,
      actualPValue,
      avgActualTimeSec,
      timeVariancePercent,
      choiceDistribution,
    };
  });
}

export interface GroupBreakdown {
  key: string;
  answeredCount: number;
  correctCount: number;
  accuracyPercent: number;
}

export async function getKnowledgePathBreakdown(itemBankId: string): Promise<GroupBreakdown[]> {
  const rows = await getQuestionAnalytics(itemBankId);
  return groupByAccuracy(rows, (r) => r.knowledgePath);
}

export async function getBloomBreakdown(itemBankId: string): Promise<GroupBreakdown[]> {
  const rows = await getQuestionAnalytics(itemBankId);
  return groupByAccuracy(rows, (r) => r.bloomLabel);
}

function groupByAccuracy(rows: QuestionAnalyticsRow[], keyFn: (r: QuestionAnalyticsRow) => string): GroupBreakdown[] {
  const map = new Map<string, { answered: number; correct: number }>();
  for (const r of rows) {
    const key = keyFn(r);
    const cur = map.get(key) ?? { answered: 0, correct: 0 };
    cur.answered += r.answeredCount;
    cur.correct += r.correctCount;
    map.set(key, cur);
  }
  return [...map.entries()].map(([key, v]) => ({
    key,
    answeredCount: v.answered,
    correctCount: v.correct,
    accuracyPercent: v.answered > 0 ? (v.correct / v.answered) * 100 : 0,
  }));
}

export async function getParticipantsRoster(itemBankId?: string) {
  const participants = await prisma.participant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      attempts: {
        where: itemBankId ? { itemBankId } : undefined,
        orderBy: { startedAt: "desc" },
      },
      badgesEarned: { include: { badge: true } },
    },
  });

  return participants.map((p) => {
    const completed = p.attempts.filter((a) => a.status === "COMPLETED");
    const best = completed.sort((a, b) => (b.scorePercent ?? 0) - (a.scorePercent ?? 0))[0] ?? null;
    return {
      id: p.id,
      fullName: p.fullName,
      identifier: p.identifier,
      createdAt: p.createdAt,
      attemptsCount: p.attempts.length,
      completedCount: completed.length,
      bestScorePercent: best?.scorePercent ?? null,
      badgesCount: p.badgesEarned.length,
      lastAttemptAt: p.attempts[0]?.startedAt ?? null,
    };
  });
}

export async function getParticipantDetail(participantId: string) {
  return prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      attempts: {
        orderBy: { startedAt: "desc" },
        include: {
          itemBank: true,
          answerLogs: {
            orderBy: { question: { order: "asc" } },
            include: { question: true, chosenChoice: true },
          },
          badges: { include: { badge: true } },
        },
      },
      badgesEarned: { include: { badge: true } },
    },
  });
}
