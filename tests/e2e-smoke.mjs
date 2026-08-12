// A quick end-to-end smoke test against a running instance of the app.
//
// Usage:
//   npm run build && npm run start &
//   ADMIN_ACCESS_CODE=2026 BASE_URL=http://localhost:3000 node tests/e2e-smoke.mjs
//
// Walks the full flow once: register -> answer every question -> results ->
// leaderboard -> admin login -> overview/questions/participants pages ->
// CSV export. Exits non-zero on any failure. Requires `npm i -D playwright`
// and the bundled Chromium (PLAYWRIGHT_BROWSERS_PATH), or set
// PLAYWRIGHT_EXECUTABLE_PATH to point at a Chromium binary.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE;

if (!ADMIN_ACCESS_CODE) {
  console.error("Set ADMIN_ACCESS_CODE env var (same value as your .env).");
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || "/opt/pw-browsers/chromium",
  });
  const page = await browser.newPage();

  await page.goto(BASE + "/");
  await page.waitForSelector("text=ابدأ الاختبار");
  console.log("✔ Home page loaded");

  await page.click("text=ابدأ الاختبار");
  await page.waitForURL("**/register");
  await page.fill("#fullName", "اختبار تلقائي");
  await page.fill("#identifier", `smoke-${Date.now()}@example.com`);
  await page.click("text=ابدأ الاختبار");
  await page.waitForURL("**/exam/**", { timeout: 15000 });
  console.log("✔ Registered:", page.url());

  let count = 0;
  while (true) {
    await page.waitForSelector("h2.text-xl");
    const choices = await page.$$("button:has(span.h-7)");
    if (choices.length === 0) throw new Error("No choice buttons found");
    await choices[0].click();
    await page.click("text=تأكيد الإجابة");
    await page.waitForSelector("text=/إجابة صحيحة|إجابة غير دقيقة/");
    count++;
    const nextBtn = await page.$("text=/السؤال التالي|عرض النتيجة النهائية/");
    const btnText = await nextBtn.textContent();
    await nextBtn.click();
    if (btnText.includes("النتيجة")) break;
    if (count > 200) throw new Error("Loop guard tripped — unexpectedly many questions");
  }
  console.log(`✔ Answered ${count} questions`);

  await page.waitForURL("**/results", { timeout: 15000 });
  await page.waitForSelector("text=أحسنت");
  console.log("✔ Results page loaded");

  await page.click("text=لوحة المتصدرين");
  await page.waitForURL("**/leaderboard");
  console.log("✔ Leaderboard loaded");

  await page.goto(BASE + "/admin/login");
  await page.fill("#code", ADMIN_ACCESS_CODE);
  await page.click("text=تسجيل الدخول");
  await page.waitForURL(BASE + "/admin", { timeout: 15000 });
  await page.waitForSelector("text=نظرة عامة");
  console.log("✔ Admin overview loaded");

  await page.goto(BASE + "/admin/questions");
  await page.waitForSelector("text=تحليل الأسئلة");
  console.log("✔ Admin question analytics loaded");

  await page.goto(BASE + "/admin/participants");
  await page.waitForSelector("text=المشاركون");
  console.log("✔ Admin participants loaded");

  const cookies = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const resp = await page.request.get(BASE + "/api/admin/export?type=summary", {
    headers: { cookie: cookies },
  });
  if (resp.status() !== 200) throw new Error(`CSV export failed: ${resp.status()}`);
  console.log("✔ CSV export OK");

  await browser.close();
  console.log("\nALL SMOKE CHECKS PASSED");
}

main().catch((e) => {
  console.error("SMOKE TEST FAILED:", e);
  process.exit(1);
});
