import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { getParticipantsRoster } from "@/lib/analytics";
import { getActiveItemBank } from "@/lib/examService";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "summary";
  const bank = await getActiveItemBank();

  if (type === "answers") {
    if (!bank) return NextResponse.json({ error: "لا يوجد بنك أسئلة نشط" }, { status: 400 });
    const logs = await prisma.answerLog.findMany({
      where: { attempt: { itemBankId: bank.id } },
      include: {
        attempt: { include: { participant: true } },
        question: true,
        chosenChoice: true,
      },
      orderBy: [{ attempt: { participantId: "asc" } }, { question: { order: "asc" } }],
    });
    const csv = toCsv(
      [
        "الاسم",
        "المعرّف",
        "رقم السؤال",
        "نص السؤال",
        "المسار المعرفي",
        "الإجابة المختارة",
        "صحيحة؟",
        "الزمن الفعلي (ثانية)",
        "الزمن المقدَّر (ثانية)",
        "النقاط",
      ],
      logs.map((l) => [
        l.attempt.participant.fullName,
        l.attempt.participant.identifier,
        l.question.externalCode,
        l.question.text,
        l.question.knowledgePath,
        l.chosenChoice?.label ?? "",
        l.isCorrect ? "نعم" : "لا",
        (l.timeSpentMs / 1000).toFixed(1),
        l.question.estimatedTimeSeconds,
        l.pointsAwarded,
      ])
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="answers-${bank.code}.csv"`,
      },
    });
  }

  const roster = await getParticipantsRoster(bank?.id);
  const csv = toCsv(
    ["الاسم", "المعرّف", "عدد المحاولات", "المحاولات المكتملة", "أفضل نتيجة (%)", "عدد الشارات", "تاريخ التسجيل"],
    roster.map((p) => [
      p.fullName,
      p.identifier,
      p.attemptsCount,
      p.completedCount,
      p.bestScorePercent !== null ? p.bestScorePercent.toFixed(1) : "",
      p.badgesCount,
      p.createdAt.toISOString(),
    ])
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="participants-summary.csv"`,
    },
  });
}
