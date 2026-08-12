import Link from "next/link";
import { getActiveItemBank } from "@/lib/examService";
import { getParticipantsRoster } from "@/lib/analytics";
import { Card, Button } from "@/components/ui";

export default async function AdminParticipantsPage() {
  const bank = await getActiveItemBank();
  const roster = await getParticipantsRoster(bank?.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">المشاركون</h1>
          <p className="mt-1 text-muted">جميع من سجّل ودخل الاختبار، مع أدائهم وشاراتهم.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export?type=summary">
            <Button variant="secondary">تصدير ملخص المشاركين (CSV)</Button>
          </a>
          <a href="/api/admin/export?type=answers">
            <Button variant="secondary">تصدير تفاصيل الإجابات (CSV)</Button>
          </a>
        </div>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="py-2 pr-2 font-bold">الاسم</th>
                <th className="py-2 pr-2 font-bold">المعرّف</th>
                <th className="py-2 pr-2 font-bold">المحاولات</th>
                <th className="py-2 pr-2 font-bold">أفضل نتيجة</th>
                <th className="py-2 pr-2 font-bold">الشارات</th>
                <th className="py-2 pr-2 font-bold">آخر نشاط</th>
                <th className="py-2 pr-2 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {roster.map((p) => (
                <tr key={p.id} className="border-b border-border">
                  <td className="py-3 pr-2 font-bold">{p.fullName}</td>
                  <td className="py-3 pr-2 text-muted">{p.identifier}</td>
                  <td className="py-3 pr-2 tabular-nums">
                    {p.completedCount}/{p.attemptsCount}
                  </td>
                  <td className="py-3 pr-2 tabular-nums">
                    {p.bestScorePercent !== null ? `${p.bestScorePercent.toFixed(0)}%` : "—"}
                  </td>
                  <td className="py-3 pr-2 tabular-nums">🏅 {p.badgesCount}</td>
                  <td className="py-3 pr-2 text-xs text-muted">
                    {p.lastAttemptAt ? new Date(p.lastAttemptAt).toLocaleString("ar-SA") : "—"}
                  </td>
                  <td className="py-3 pr-2">
                    <Link href={`/admin/participants/${p.id}`} className="font-bold text-brand hover:underline">
                      عرض التفاصيل ←
                    </Link>
                  </td>
                </tr>
              ))}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    لا يوجد مشاركون بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
