import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { parseItemBankWorkbook } from "../src/lib/itemBankImport";
import { createItemBankInDb } from "../src/lib/itemBankService";
import { ensureBadgeCatalogSeeded } from "../src/lib/gamification";

async function main() {
  // 1. Admin access code — not stored in the DB, just a sanity check that
  // it's configured (see ADMIN_ACCESS_CODE in src/lib/auth.ts / .env).
  if (!process.env.ADMIN_ACCESS_CODE) {
    throw new Error("ADMIN_ACCESS_CODE must be set in .env before seeding.");
  }
  console.log("✔ ADMIN_ACCESS_CODE is set.");

  // 2. Badge catalog
  await ensureBadgeCatalogSeeded();
  console.log("✔ Badge catalog seeded.");

  // 3. Unit 1 item bank, from the bundled sample workbook
  const existing = await prisma.itemBank.findUnique({ where: { code: "UNIT-1" } });
  if (existing) {
    console.log('✔ ItemBank "UNIT-1" already exists, skipping import.');
  } else {
    const filePath = path.join(process.cwd(), "data/samples/unit1-item-bank.xlsx");
    const buffer = readFileSync(filePath);
    const parsed = await parseItemBankWorkbook(buffer);
    const bank = await createItemBankInDb(
      prisma,
      {
        code: "UNIT-1",
        title: "الوحدة 1 - هيكل وظيفة الموارد البشرية",
        description: "بنك أسئلة الوحدة الأولى: هيكل وظيفة الموارد البشرية (45 سؤالاً).",
        sourceFile: "unit1-item-bank.xlsx",
      },
      parsed
    );
    console.log(`✔ ItemBank "${bank.code}" imported with ${parsed.questions.length} questions.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
