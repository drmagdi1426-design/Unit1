import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireParticipant } from "@/lib/auth";
import { Card, PageShell, Button, StatChip } from "@/components/ui";
import PrintButton from "./PrintButton";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const participant = await requireParticipant();

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      answerLogs: {
        include: {
          question: { include: { choices: true } },
          chosenChoice: true,
        },
        orderBy: { question: { order: "asc" } },
      },
      badges: { include: { badge: true } },
      itemBank: true,
    },
  });

  if (!attempt || attempt.participantId !== participant.id) notFound();
  if (attempt.status !== "COMPLETED") redirect(`/exam/${attemptId}`);

  const scorePercent = attempt.scorePercent ?? 0;
  const totalActualSec = attempt.answerLogs.reduce((s, a) => s + a.timeSpentMs / 1000, 0);
  const totalEstimatedSec = attempt.answerLogs.reduce((s, a) => s + a.question.estimatedTimeSeconds, 0);
  const celebrate = scorePercent >= 70;

  return (
    <PageShell className="max-w-3xl">
      {celebrate && <Confetti />}
      <Card className="animate-pop-in relative overflow-hidden break-inside-avoid p-6 text-center sm:p-8">
        <div className="mb-2 text-5xl">{scorePercent >= 90 ? "🏆" : scorePercent >= 70 ? "🎉" : "💪"}</div>
        <h1 className="text-2xl font-extrabold text-foreground">
          أحسنت، {participant.fullName}!
        </h1>
        <p className="mt-1 text-muted">لقد أنهيت اختبار «{attempt.itemBank.title}»</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <StatChip label="النسبة المئوية" value={`${scorePercent.toFixed(0)}%`} icon="📊" />
          <StatChip label="الإجابات الصحيحة" value={`${attempt.correctCount}/${attempt.totalQuestions}`} icon="✅" />
          <StatChip label="النقاط" value={`${attempt.totalPoints}/${attempt.maxPoints}`} icon="⭐" />
          <StatChip label="المستوى" value={attempt.levelTitle ?? "—"} icon="🎖️" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-brand-soft p-4 text-right">
            <p className="text-xs font-bold text-muted">إجمالي وقتك الفعلي</p>
            <p className="text-xl font-extrabold text-brand-strong">{formatDuration(totalActualSec)}</p>
          </div>
          <div className="rounded-xl bg-accent-soft p-4 text-right">
            <p className="text-xs font-bold text-muted">الوقت المقدَّر إجمالاً</p>
            <p className="text-xl font-extrabold text-accent">{formatDuration(totalEstimatedSec)}</p>
          </div>
        </div>
      </Card>

      {attempt.badges.length > 0 && (
        <Card className="animate-pop-in mt-6 break-inside-avoid p-6">
          <h2 className="mb-4 text-lg font-extrabold">الشارات المكتسبة 🏅</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attempt.badges.map((b) => (
              <div key={b.id} className="flex flex-col items-center gap-1 rounded-xl bg-background p-4 text-center">
                <span className="text-3xl">{b.badge.icon}</span>
                <span className="text-sm font-extrabold">{b.badge.title}</span>
                <span className="text-xs text-muted">{b.badge.description}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-lg font-extrabold">مراجعة إجاباتك</h2>
        <div className="flex flex-col gap-4">
          {attempt.answerLogs.map((log) => {
            const correct = log.question.choices.find((c) => c.isCorrect)!;
            return (
              <div key={log.id} className="break-inside-avoid rounded-xl border border-border p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-bold leading-relaxed">{log.question.text}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${log.isCorrect ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {log.isCorrect ? "صحيحة" : "غير صحيحة"}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  إجابتك: {log.chosenChoice ? `${log.chosenChoice.label}) ${log.chosenChoice.text}` : "لم تُجب"}
                </p>
                {!log.isCorrect && (
                  <p className="text-sm text-muted">
                    الإجابة الصحيحة: {correct.label}) {correct.text}
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-foreground">{correct.justification}</p>
                <p className="mt-2 text-xs text-muted">
                  ⏱️ استغرقت {Math.round(log.timeSpentMs / 1000)}ث (الزمن المقدَّر: {log.question.estimatedTimeSeconds}ث)
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap justify-center gap-3 pb-8 print:hidden">
        <PrintButton />
        <Link href="/leaderboard">
          <Button variant="secondary">لوحة المتصدرين 🏆</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost">العودة للصفحة الرئيسية</Button>
        </Link>
      </div>
    </PageShell>
  );
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}د ${s}ث`;
}

function Confetti() {
  const pieces = Array.from({ length: 24 });
  const colors = ["#e08a2b", "#0f6e6a", "#e34948", "#eda100", "#4a3aa7"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden print:hidden" aria-hidden>
      {pieces.map((_, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 block h-2 w-2 rounded-sm"
          style={{
            left: `${(i * 97) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animationDuration: `${2.5 + (i % 5) * 0.4}s`,
            animationDelay: `${(i % 6) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
