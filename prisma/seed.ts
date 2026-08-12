import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { parseItemBankWorkbook } from "../src/lib/itemBankImport";
import { createItemBankInDb } from "../src/lib/itemBankService";
import { ensureBadgeCatalogSeeded } from "../src/lib/gamification";

async function main() {
  // 1. Admin account
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env before seeding.");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { username },
    create: { username, passwordHash },
    update: { passwordHash },
  });
  console.log(`✔ Admin user "${username}" ready.`);

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
