import Link from "next/link";
import { PageShell, Card, Button, StatChip } from "@/components/ui";
import { getActiveItemBank } from "@/lib/examService";
import { prisma } from "@/lib/prisma";

// Reads live DB state (active item bank can change at any time via the
// admin dashboard) — must never be frozen into a static build-time page.
export const dynamic = "force-dynamic";

export default async function Home() {
  const bank = await getActiveItemBank();
  const questionCount = bank ? await prisma.question.count({ where: { itemBankId: bank.id } }) : 0;

  return (
    <div className="flex flex-1 flex-col">
      <PageShell className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        <div className="animate-pop-in flex flex-col items-center gap-4">
          <span className="rounded-full bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent">
            🎮 اختبار تفاعلي محفِّز
          </span>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            {bank ? bank.title : "منصة الاختبارات التفاعلية"}
          </h1>
          <p className="max-w-lg text-lg leading-8 text-muted">
            أجب عن الأسئلة، واحصل فوراً على الإجابة الصحيحة مع التبرير الكامل، واكسب نقاطاً
            وشارات مع كل إجابة صحيحة — تجربة تعلّم تفاعلية مبنية على مبادئ تعلّم الكبار.
          </p>
        </div>

        {bank && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <StatChip label="عدد الأسئلة" value={questionCount} icon="📝" />
            <StatChip label="التغذية الراجعة" value="فورية" icon="⚡" />
            <StatChip label="النقاط والشارات" value="مُفعّلة" icon="🏆" />
          </div>
        )}

        <Card className="w-full max-w-md p-6 text-right">
          <h2 className="mb-3 text-lg font-extrabold">كيف تسير التجربة؟</h2>
          <ol className="flex flex-col gap-2 text-muted">
            <li>1. سجّل اسمك وبريدك الإلكتروني أو رقمك الوظيفي.</li>
            <li>2. أجب عن الأسئلة واحداً تلو الآخر.</li>
            <li>3. شاهد الإجابة الصحيحة وتبريرها فور كل إجابة.</li>
            <li>4. اكسب نقاطاً وشارات، وتابع تقدّمك حتى النهاية.</li>
          </ol>
        </Card>

        <Link href={bank ? "/register" : "#"}>
          <Button disabled={!bank} className="px-10 py-4 text-lg">
            {bank ? "ابدأ الاختبار الآن 🚀" : "لا يوجد اختبار نشط حالياً"}
          </Button>
        </Link>
      </PageShell>

      <footer className="border-t border-border py-4 text-center text-xs text-muted">
        <Link href="/admin/login" className="hover:text-brand hover:underline">
          دخول المسؤول
        </Link>
      </footer>
    </div>
  );
}
