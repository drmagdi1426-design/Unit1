import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseItemBankWorkbook, ItemBankImportError } from "@/lib/itemBankImport";
import { createItemBankInDb, setActiveItemBank } from "@/lib/itemBankService";

export async function POST(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const makeActive = formData.get("makeActive") === "on";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "الرجاء إرفاق ملف Excel." }, { status: 400 });
  }
  if (!code || !title) {
    return NextResponse.json({ error: "الرمز والعنوان مطلوبان." }, { status: 400 });
  }

  const existing = await prisma.itemBank.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: `يوجد بالفعل بنك أسئلة برمز "${code}".` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const parsed = await parseItemBankWorkbook(buffer);
    const bank = await createItemBankInDb(
      prisma,
      { code, title, description, sourceFile: file.name },
      parsed
    );
    if (makeActive) {
      await setActiveItemBank(prisma, bank.id);
    }
    return NextResponse.json({ ok: true, bankId: bank.id, questionCount: parsed.questions.length });
  } catch (e) {
    if (e instanceof ItemBankImportError) {
      return NextResponse.json({ error: "فشل التحقق من الملف.", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء الاستيراد." }, { status: 500 });
  }
}
