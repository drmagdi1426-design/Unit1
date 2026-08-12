import { notFound } from "next/navigation";
import Link from "next/link";
import { getParticipantDetail } from "@/lib/analytics";
import { Card } from "@/components/ui";

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتملة",
  ABANDONED: "متروكة",
};

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const participant = await getParticipantDetail(id);
  if (!participant) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/participants" className="text-sm font-bold text-brand hover:underline">
        ← العودة لقائمة المشاركين
      </Link>

      <Card className="p-6">
        <h1 className="text-2xl font-extrabold">{participant.fullName}</h1>
        <p className="mt-1 text-muted">{participant.identifier}</p>
        {participant.badgesEarned.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {participant.badgesEarned.map((b) => (
              <span
                key={b.id}
                title={b.badge.description}
                className="rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent"
              >
                {b.badge.icon} {b.badge.title}
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-4">
        {participant.attempts.map((attempt) => (
          <Card key={attempt.id} className="p-4 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-extrabold">{attempt.itemBank.title}</p>
                <p className="text-xs text-muted">
                  بدأت: {new Date(attempt.startedAt).toLocaleString("ar-SA")}
                  {attempt.completedAt && ` — انتهت: ${new Date(attempt.completedAt).toLocaleString("ar-SA")}`}
                </p>
              </div>
              <span className="rounded-full bg-border px-3 py-1 text-xs font-bold">
                {STATUS_LABEL[attempt.status]}
              </span>
            </div>

            <div className="mb-3 flex flex-wrap gap-2 text-sm font-bold">
              <span className="rounded-lg bg-brand-soft px-3 py-1 text-brand-strong">
                {attempt.scorePercent !== null ? `${attempt.scorePercent.toFixed(0)}%` : "—"}
              </span>
              <span className="rounded-lg bg-background px-3 py-1">
                {attempt.correctCount}/{attempt.totalQuestions} صحيحة
              </span>
              <span className="rounded-lg bg-background px-3 py-1">
                {attempt.totalPoints}/{attempt.maxPoints} نقطة
              </span>
              {attempt.levelTitle && (
                <span className="rounded-lg bg-background px-3 py-1">{attempt.levelTitle}</span>
              )}
            </div>

            {attempt.answerLogs.length > 0 && (
              <details>
                <summary className="cursor-pointer text-sm font-bold text-brand">
                  عرض تفاصيل الإجابات ({attempt.answerLogs.length})
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-right text-muted">
                        <th className="py-1.5 pr-2 font-bold">السؤال</th>
                        <th className="py-1.5 pr-2 font-bold">الإجابة</th>
                        <th className="py-1.5 pr-2 font-bold">صحيحة؟</th>
                        <th className="py-1.5 pr-2 font-bold">الزمن الفعلي/المقدَّر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempt.answerLogs.map((log) => (
                        <tr key={log.id} className="border-b border-border">
                          <td className="max-w-xs truncate py-1.5 pr-2">{log.question.text}</td>
                          <td className="py-1.5 pr-2">{log.chosenChoice?.label ?? "—"}</td>
                          <td className="py-1.5 pr-2">
                            {log.isCorrect ? (
                              <span className="text-success">✔</span>
                            ) : (
                              <span className="text-danger">✘</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2 tabular-nums">
                            {(log.timeSpentMs / 1000).toFixed(0)}ث / {log.question.estimatedTimeSeconds}ث
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
