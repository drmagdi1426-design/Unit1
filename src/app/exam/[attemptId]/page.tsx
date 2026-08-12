import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireParticipant } from "@/lib/auth";
import { getNextSafeQuestion } from "@/lib/examService";
import { completeAttempt } from "@/lib/gamification";
import ExamRunner from "./ExamRunner";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const participant = await requireParticipant();

  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.participantId !== participant.id) notFound();

  if (attempt.status === "COMPLETED") {
    redirect(`/exam/${attemptId}/results`);
  }

  const { question, questionNumber, totalQuestions } = await getNextSafeQuestion(attemptId);

  if (!question) {
    // All questions answered but attempt not yet finalized (e.g. connection dropped
    // right after the last answer) — finalize now instead of getting stuck.
    await completeAttempt(attemptId);
    redirect(`/exam/${attemptId}/results`);
  }

  return (
    <ExamRunner
      attemptId={attemptId}
      participantName={participant.fullName}
      initialQuestion={question}
      initialQuestionNumber={questionNumber}
      totalQuestions={totalQuestions}
      initialTotals={{ totalPoints: attempt.totalPoints, correctCount: attempt.correctCount }}
    />
  );
}
