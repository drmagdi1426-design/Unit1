import "server-only";
import { prisma } from "@/lib/prisma";

/** The only ItemBank fields/choice fields ever sent to the client BEFORE an answer is submitted. */
export interface SafeChoice {
  id: string;
  label: string;
  text: string;
}
export interface SafeQuestion {
  id: string;
  order: number;
  text: string;
  knowledgePath: string;
  bloomLabel: string;
  difficultyLabel: string;
  estimatedTimeSeconds: number;
  pointsValue: number;
  choices: SafeChoice[];
}

export async function getActiveItemBank() {
  return prisma.itemBank.findFirst({ where: { isActive: true }, orderBy: { importedAt: "desc" } });
}

/** Resumes an in-progress attempt for this participant+bank, or starts a fresh one. */
export async function getOrCreateAttempt(participantId: string, itemBankId: string) {
  const existing = await prisma.attempt.findFirst({
    where: { participantId, itemBankId, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });
  if (existing) return existing;

  const totalQuestions = await prisma.question.count({ where: { itemBankId } });
  return prisma.attempt.create({
    data: { participantId, itemBankId, totalQuestions, status: "IN_PROGRESS" },
  });
}

function toSafeQuestion(q: {
  id: string;
  order: number;
  text: string;
  knowledgePath: string;
  bloomLabel: string;
  difficultyLabel: string;
  estimatedTimeSeconds: number;
  pointsValue: number;
  choices: { id: string; label: string; text: string }[];
}): SafeQuestion {
  return {
    id: q.id,
    order: q.order,
    text: q.text,
    knowledgePath: q.knowledgePath,
    bloomLabel: q.bloomLabel,
    difficultyLabel: q.difficultyLabel,
    estimatedTimeSeconds: q.estimatedTimeSeconds,
    pointsValue: q.pointsValue,
    choices: [...q.choices]
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((c) => ({ id: c.id, label: c.label, text: c.text })),
  };
}

/**
 * Returns the next unanswered question (in blueprint order) for this
 * attempt, with no answer-key fields — never leak isCorrect/justification
 * before the participant submits. Returns null when every question has an
 * AnswerLog, meaning the attempt is ready to be completed.
 */
export async function getNextSafeQuestion(attemptId: string): Promise<{
  question: SafeQuestion | null;
  questionNumber: number;
  totalQuestions: number;
}> {
  const attempt = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } });
  const answered = await prisma.answerLog.findMany({
    where: { attemptId },
    select: { questionId: true },
  });
  const answeredIds = new Set(answered.map((a) => a.questionId));

  const questions = await prisma.question.findMany({
    where: { itemBankId: attempt.itemBankId },
    orderBy: { order: "asc" },
    include: { choices: { select: { id: true, label: true, text: true } } },
  });

  const next = questions.find((q) => !answeredIds.has(q.id));
  return {
    question: next ? toSafeQuestion(next) : null,
    questionNumber: answeredIds.size + 1,
    totalQuestions: questions.length,
  };
}
