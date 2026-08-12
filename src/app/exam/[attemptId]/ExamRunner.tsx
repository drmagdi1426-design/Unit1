"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAnswerAction } from "./actions";
import { Button, Card, ProgressBar, StatChip } from "@/components/ui";
import type { SafeQuestion } from "@/lib/examService";

type RevealChoice = {
  id: string;
  label: string;
  justification: string;
};

type Reveal = {
  isCorrect: boolean;
  pointsAwarded: number;
  correctChoice: RevealChoice;
  chosenChoice: { id: string; label: string; justification: string } | null;
};

type PendingAdvance =
  | { done: false; question: SafeQuestion; questionNumber: number }
  | { done: true };

export default function ExamRunner({
  attemptId,
  participantName,
  initialQuestion,
  initialQuestionNumber,
  totalQuestions,
  initialTotals,
}: {
  attemptId: string;
  participantName: string;
  initialQuestion: SafeQuestion;
  initialQuestionNumber: number;
  totalQuestions: number;
  initialTotals: { totalPoints: number; correctCount: number };
}) {
  const router = useRouter();
  const [question, setQuestion] = useState(initialQuestion);
  const [questionNumber, setQuestionNumber] = useState(initialQuestionNumber);
  const [totals, setTotals] = useState(initialTotals);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [pendingAdvance, setPendingAdvance] = useState<PendingAdvance | null>(null);
  const [isPending, startTransition] = useTransition();
  const questionStartRef = useRef<number>(0);

  // Records when the current question started being shown. A ref mutation
  // (not setState), and only ever read later when submitting — so it's safe
  // to set from an effect keyed on the question.
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [question.id]);

  function handleSubmit() {
    if (!selectedId || reveal) return;
    const timeSpentMs = Date.now() - questionStartRef.current;
    startTransition(async () => {
      const result = await submitAnswerAction({
        attemptId,
        questionId: question.id,
        chosenChoiceId: selectedId,
        timeSpentMs,
      });
      setReveal(result.reveal);
      if (result.done) {
        setTotals({ totalPoints: result.summary.totalPoints, correctCount: result.summary.correctCount });
        setPendingAdvance({ done: true });
      } else {
        setTotals(result.attemptTotals);
        setPendingAdvance({ done: false, question: result.next, questionNumber: result.questionNumber });
      }
    });
  }

  function handleNext() {
    if (!pendingAdvance) return;
    if (pendingAdvance.done) {
      router.push(`/exam/${attemptId}/results`);
      return;
    }
    setQuestion(pendingAdvance.question);
    setQuestionNumber(pendingAdvance.questionNumber);
    setSelectedId(null);
    setReveal(null);
    setPendingAdvance(null);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="text-sm font-bold text-muted">أهلاً، {participantName} 👋</div>
          <div className="flex gap-2">
            <StatChip label="النقاط" value={totals.totalPoints} icon="⭐" />
            <StatChip label="الإجابات الصحيحة" value={totals.correctCount} icon="✅" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-3xl px-4 pb-3 sm:px-6">
          <div className="mb-1 flex justify-between text-xs font-bold text-muted">
            <span>
              السؤال {questionNumber} من {totalQuestions}
            </span>
            <QuestionTimer key={question.id} startRef={questionStartRef} />

          </div>
          <ProgressBar value={questionNumber - 1} max={totalQuestions} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <Card key={question.id} className="animate-pop-in p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-brand-soft px-3 py-1 text-brand-strong">
              {question.knowledgePath}
            </span>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-accent">
              {question.bloomLabel}
            </span>
            <span className="rounded-full bg-border px-3 py-1 text-muted">
              {question.difficultyLabel}
            </span>
          </div>

          <h2 className="mb-6 text-xl font-extrabold leading-relaxed text-foreground">
            {question.text}
          </h2>

          <div className="flex flex-col gap-3">
            {question.choices.map((choice) => {
              const isSelected = selectedId === choice.id;
              const isCorrectChoice = reveal?.correctChoice.id === choice.id;
              const isWrongChosen = reveal && reveal.chosenChoice?.id === choice.id && !reveal.isCorrect;

              let stateClasses =
                "border-border bg-background hover:border-brand/50 hover:bg-brand-soft/40";
              if (!reveal && isSelected) {
                stateClasses = "border-brand bg-brand-soft ring-2 ring-brand/30";
              }
              if (reveal && isCorrectChoice) {
                stateClasses = "border-success bg-success/10";
              }
              if (reveal && isWrongChosen) {
                stateClasses = "border-danger bg-danger/10";
              }
              if (reveal && !isCorrectChoice && !isWrongChosen) {
                stateClasses = "border-border bg-background opacity-60";
              }

              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={!!reveal || isPending}
                  onClick={() => setSelectedId(choice.id)}
                  className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-right transition-all ${stateClasses}`}
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-sm font-extrabold">
                    {choice.label}
                  </span>
                  <span className="flex-1 text-base leading-relaxed">{choice.text}</span>
                  {reveal && isCorrectChoice && <span className="text-lg">✅</span>}
                  {reveal && isWrongChosen && <span className="text-lg">❌</span>}
                </button>
              );
            })}
          </div>

          {reveal && (
            <div
              className={`animate-pop-in mt-6 rounded-xl p-4 ${
                reveal.isCorrect ? "bg-success/10" : "bg-danger/10"
              }`}
            >
              <p className={`mb-2 font-extrabold ${reveal.isCorrect ? "text-success" : "text-danger"}`}>
                {reveal.isCorrect ? `إجابة صحيحة! +${reveal.pointsAwarded} نقطة 🎉` : "إجابة غير دقيقة"}
              </p>
              {!reveal.isCorrect && reveal.chosenChoice && (
                <p className="mb-2 text-sm leading-relaxed text-foreground">
                  <span className="font-bold">لماذا الخيار {reveal.chosenChoice.label} غير صحيح: </span>
                  {reveal.chosenChoice.justification}
                </p>
              )}
              <p className="text-sm leading-relaxed text-foreground">
                <span className="font-bold">الإجابة الصحيحة ({reveal.correctChoice.label}): </span>
                {reveal.correctChoice.justification}
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {!reveal ? (
              <Button disabled={!selectedId || isPending} onClick={handleSubmit}>
                {isPending ? "جارٍ التحقق..." : "تأكيد الإجابة"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!pendingAdvance}>
                {pendingAdvance?.done ? "عرض النتيجة النهائية 🏁" : "السؤال التالي ←"}
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

/**
 * Self-contained ticking display. Rendered with `key={question.id}` by the
 * parent so it fully remounts (and its own `elapsedSec` state naturally
 * resets to 0) on every new question, instead of the parent reaching in to
 * reset state from an effect.
 */
function QuestionTimer({ startRef }: { startRef: React.RefObject<number> }) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startRef]);

  return <span>⏱️ {elapsedSec}ث</span>;
}
