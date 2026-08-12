import { getActiveItemBank } from "@/lib/examService";
import {
  getQuestionAnalytics,
  getKnowledgePathBreakdown,
  getBloomBreakdown,
} from "@/lib/analytics";
import { Card } from "@/components/ui";
import { HorizontalBars } from "@/components/charts/HorizontalBars";

function timeStatus(variancePercent: number | null): { label: string; className: string } {
  if (variancePercent === null) return { label: "لا توجد بيانات", className: "bg-border text-muted" };
  const abs = Math.abs(variancePercent);
  if (abs <= 20) return { label: "مطابق للتقدير", className: "bg-success/10 text-success" };
  if (abs <= 50) return { label: "تفاوت متوسط", className: "bg-warning/10 text-warning" };
  return { label: "تفاوت كبير", className: "bg-danger/10 text-danger" };
}

export default async function AdminQuestionsPage() {
  const bank = await getActiveItemBank();
  if (!bank) {
    return <p className="text-muted">لا يوجد بنك أسئلة نشط حالياً.</p>;
  }

  const [rows, byPath, byBloom] = await Promise.all([
    getQuestionAnalytics(bank.id),
    getKnowledgePathBreakdown(bank.id),
    getBloomBreakdown(bank.id),
  ]);

  const answeredRows = rows.filter((r) => r.answeredCount > 0);
  const avgVariance =
    answeredRows.length > 0
      ? answeredRows.reduce((s, r) => s + (r.timeVariancePercent ?? 0), 0) / answeredRows.length
      : null;
  const flaggedSlow = rows.filter((r) => (r.timeVariancePercent ?? 0) > 50).length;
  const flaggedFast = rows.filter((r) => (r.timeVariancePercent ?? 0) < -50).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">تحليل الأسئلة</h1>
        <p className="mt-1 text-muted">أداء كل سؤال، ومقارنة الزمن الفعلي بالزمن المقدَّر في ملف Excel.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-muted">متوسط الانحراف الزمني</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums" dir="ltr">
            {avgVariance === null ? "—" : `${avgVariance > 0 ? "+" : ""}${avgVariance.toFixed(0)}%`}
          </p>
          <p className="mt-1 text-xs text-muted">مقارنةً بالزمن المقدَّر في بنك الأسئلة</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-muted">أسئلة أبطأ من المتوقع بكثير</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-danger">{flaggedSlow}</p>
          <p className="mt-1 text-xs text-muted">تفاوت أكثر من 50% أبطأ — قد تحتاج صياغة أوضح</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-muted">أسئلة أسرع من المتوقع بكثير</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-warning">{flaggedFast}</p>
          <p className="mt-1 text-xs text-muted">تفاوت أكثر من 50% أسرع — قد تكون سهلة جداً أو تُحلّ تخميناً</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-extrabold">الدقة حسب المسار المعرفي</h2>
          <HorizontalBars items={byPath.map((b) => ({ label: b.key, value: b.accuracyPercent, sublabel: `(${b.correctCount}/${b.answeredCount})` }))} />
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-extrabold">الدقة حسب مستوى بلوم</h2>
          <HorizontalBars items={byBloom.map((b) => ({ label: b.key, value: b.accuracyPercent, sublabel: `(${b.correctCount}/${b.answeredCount})` }))} />
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-extrabold">تفاصيل كل سؤال</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="py-2 pr-2 font-bold">#</th>
                <th className="py-2 pr-2 font-bold">السؤال</th>
                <th className="py-2 pr-2 font-bold">عدد الإجابات</th>
                <th className="py-2 pr-2 font-bold">p الفعلي / المستهدف</th>
                <th className="py-2 pr-2 font-bold">الزمن الفعلي / المقدَّر</th>
                <th className="py-2 pr-2 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = timeStatus(r.timeVariancePercent);
                return (
                  <tr key={r.id} className="border-b border-border align-top">
                    <td className="py-3 pr-2 font-bold text-muted">{r.externalCode}</td>
                    <td className="max-w-md py-3 pr-2">
                      <details>
                        <summary className="cursor-pointer font-semibold leading-relaxed">
                          {r.text}
                        </summary>
                        <div className="mt-2 flex flex-col gap-1 rounded-lg bg-background p-3">
                          <p className="mb-1 text-xs font-bold text-muted">
                            {r.knowledgePath} · {r.bloomLabel} · {r.difficultyLabel}
                          </p>
                          {r.choiceDistribution.map((c) => (
                            <div key={c.label} className="flex items-center gap-2 text-xs">
                              <span
                                className={`w-5 shrink-0 rounded-full text-center font-extrabold ${
                                  c.isCorrect ? "bg-success/20 text-success" : "text-muted"
                                }`}
                              >
                                {c.label}
                              </span>
                              <span className="flex-1 truncate">{c.text}</span>
                              <span className="shrink-0 font-bold tabular-nums">{c.count}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                    <td className="py-3 pr-2 tabular-nums">{r.answeredCount}</td>
                    <td className="py-3 pr-2 tabular-nums">
                      {r.actualPValue !== null ? r.actualPValue.toFixed(2) : "—"} /{" "}
                      {r.targetPValue !== null ? r.targetPValue.toFixed(2) : "—"}
                    </td>
                    <td className="py-3 pr-2 tabular-nums">
                      {r.avgActualTimeSec !== null ? `${r.avgActualTimeSec.toFixed(0)}ث` : "—"} /{" "}
                      {r.estimatedTimeSeconds}ث
                      {r.timeVariancePercent !== null && (
                        <span className="mr-1 text-xs text-muted" dir="ltr">
                          ({r.timeVariancePercent > 0 ? "+" : ""}
                          {r.timeVariancePercent.toFixed(0)}%)
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
