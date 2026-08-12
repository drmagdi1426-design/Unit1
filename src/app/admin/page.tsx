import { getActiveItemBank } from "@/lib/examService";
import { getOverviewStats } from "@/lib/analytics";
import { Card } from "@/components/ui";
import { HorizontalBars } from "@/components/charts/HorizontalBars";
import { DailyBars } from "@/components/charts/DailyBars";

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}د ${s}ث`;
}

export default async function AdminOverviewPage() {
  const bank = await getActiveItemBank();
  const stats = await getOverviewStats(bank?.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">نظرة عامة</h1>
        <p className="mt-1 text-muted">
          {bank ? `بنك الأسئلة النشط: ${bank.title}` : "لا يوجد بنك أسئلة نشط حالياً."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Kpi label="عدد المشاركين" value={String(stats.participantsCount)} />
        <Kpi label="إجمالي المحاولات" value={String(stats.attemptsTotal)} />
        <Kpi label="المحاولات المكتملة" value={String(stats.completedCount)} />
        <Kpi label="نسبة الإكمال" value={`${stats.completionRate.toFixed(0)}%`} />
        <Kpi label="متوسط النتيجة" value={`${stats.avgScorePercent.toFixed(0)}%`} />
        <Kpi label="نسبة النجاح" value={`${stats.passRate.toFixed(0)}%`} hint="حد النجاح: 60%" />
        <Kpi label="متوسط زمن الإنجاز" value={formatDuration(stats.avgDurationSec)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-extrabold">المحاولات المكتملة (آخر 14 يوماً)</h2>
          <DailyBars data={stats.attemptsByDay} />
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-extrabold">توزيع المستويات المُحقَّقة</h2>
          {stats.completedCount === 0 ? (
            <p className="text-muted">لا توجد بيانات كافية بعد.</p>
          ) : (
            <HorizontalBars
              items={stats.levelDistribution.map((l) => ({
                label: `المستوى ${l.level} — ${l.title}`,
                value: l.count,
              }))}
              formatValue={(v) => String(v)}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
