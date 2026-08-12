import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, PageShell, Button } from "@/components/ui";

// Live standings — must reflect the latest completed attempts, not a
// build-time snapshot.
export const dynamic = "force-dynamic";

// Privacy default: only first name + last-initial are shown publicly.
// (Admins see full identities in the secured dashboard.)
function displayName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const attempts = await prisma.attempt.findMany({
    where: { status: "COMPLETED" },
    orderBy: [{ scorePercent: "desc" }, { totalPoints: "desc" }, { completedAt: "asc" }],
    take: 20,
    include: { participant: true, badges: true },
  });

  return (
    <PageShell className="max-w-2xl">
      <div className="mb-6 text-center">
        <div className="mb-2 text-4xl">🏆</div>
        <h1 className="text-2xl font-extrabold">لوحة المتصدرين</h1>
        <p className="mt-1 text-muted">أفضل النتائج بين جميع المشاركين حتى الآن</p>
      </div>

      <Card className="p-4 sm:p-6">
        {attempts.length === 0 ? (
          <p className="py-10 text-center text-muted">لا توجد نتائج بعد — كن أول من يكمل الاختبار!</p>
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {attempts.map((a, i) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <span className="w-8 shrink-0 text-center text-lg font-extrabold">
                  {MEDALS[i] ?? i + 1}
                </span>
                <span className="flex-1 font-bold">{displayName(a.participant.fullName)}</span>
                <span className="text-xs text-muted">{a.badges.length > 0 ? "🏅".repeat(Math.min(a.badges.length, 5)) : ""}</span>
                <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-extrabold text-brand-strong tabular-nums">
                  {(a.scorePercent ?? 0).toFixed(0)}%
                </span>
                <span className="w-16 text-left text-sm font-bold text-muted tabular-nums">
                  {a.totalPoints} نقطة
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <div className="mt-6 flex justify-center">
        <Link href="/">
          <Button variant="ghost">العودة للصفحة الرئيسية</Button>
        </Link>
      </div>
    </PageShell>
  );
}
