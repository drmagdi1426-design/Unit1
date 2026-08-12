import ExcelJS from "exceljs";

/**
 * Parses Excel workbooks that follow the "بنك الأسئلة" (Item Bank) format:
 * a required "Item Bank" sheet with the fixed 26-column layout (A..Z) used
 * by the source item banks, plus optional "Blueprint" and "QA Log" sheets
 * that are kept verbatim (as JSON) for traceability in the admin dashboard.
 *
 * This module is the single source of truth for the format — both the
 * database seed script and the admin "upload a new unit" feature call it.
 */

export const ITEM_BANK_SHEET_NAME = "Item Bank";
export const BLUEPRINT_SHEET_NAME = "Blueprint";
export const QA_LOG_SHEET_NAME = "QA Log";

// Expected header row on the Item Bank sheet, column A through Z, in order.
const EXPECTED_HEADERS = [
  "رقم السؤال",
  "اللغة",
  "المسار المعرفي",
  "المرجع الإطاري",
  "مستوى بلوم",
  "الصعوبة",
  "معامل الصعوبة المستهدف (p)",
  "معامل التمييز المستهدف",
  "الزمن المقدر (ثانية)",
  "نص السؤال",
  "الخيار A",
  "الخيار B",
  "الخيار C",
  "الخيار D",
  "الإجابة الصحيحة",
  "تبرير الإجابة الصحيحة",
  "تصنيف مشتت A",
  "تبرير مشتت A",
  "تصنيف مشتت B",
  "تبرير مشتت B",
  "تصنيف مشتت C",
  "تبرير مشتت C",
  "تصنيف مشتت D",
  "تبرير مشتت D",
  "المرجع المصدري",
  "ملاحظات المراجع",
] as const;

export type DifficultyCode = "MUBTADI" | "MUTAWASSIT" | "IHTIRAFI";
export type BloomCode = "BLOOM1" | "BLOOM2" | "BLOOM3" | "BLOOM4" | "BLOOM5" | "BLOOM6";
export type DistractorCode = "M" | "P" | "T" | "W";

const DIFFICULTY_MAP: Record<string, DifficultyCode> = {
  "مبتدئ": "MUBTADI",
  "متوسط": "MUTAWASSIT",
  "احترافي": "IHTIRAFI",
};

const DISTRACTOR_CODES = new Set(["M", "P", "T", "W"]);
const CHOICE_LABELS = ["A", "B", "C", "D"] as const;
type ChoiceLabel = (typeof CHOICE_LABELS)[number];

export interface ParsedChoice {
  label: ChoiceLabel;
  text: string;
  isCorrect: boolean;
  justification: string;
  distractorType: DistractorCode | null;
}

export interface ParsedQuestion {
  order: number;
  externalCode: string;
  language: string;
  knowledgePath: string;
  frameworkRef: string | null;
  bloomLevel: BloomCode;
  bloomLabel: string;
  difficulty: DifficultyCode;
  difficultyLabel: string;
  targetPValue: number | null;
  targetDiscrimination: number | null;
  estimatedTimeSeconds: number;
  text: string;
  sourceReference: string | null;
  reviewerNotes: string | null;
  choices: ParsedChoice[];
}

export interface ParsedItemBank {
  questions: ParsedQuestion[];
  blueprintRows: (string | number | null)[][] | null;
  qaLogRows: { item: string; result: string; notes: string }[] | null;
}

export class ItemBankImportError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super(`Item bank import failed with ${issues.length} issue(s):\n` + issues.join("\n"));
    this.issues = issues;
  }
}

function cellText(row: ExcelJS.Row, col: number): string | null {
  const v = row.getCell(col).value;
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && "richText" in (v as object)) {
    return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("").trim() || null;
  }
  if (typeof v === "object" && "text" in (v as object)) {
    return String((v as { text: unknown }).text).trim() || null;
  }
  const s = String(v).trim();
  return s.length ? s : null;
}

function cellNumber(row: ExcelJS.Row, col: number): number | null {
  const v = row.getCell(col).value;
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseBloomLabel(label: string): BloomCode | null {
  const match = label.match(/بلوم\s*([1-6])/);
  if (!match) return null;
  return (`BLOOM${match[1]}` as BloomCode);
}

/**
 * Parses a workbook buffer into a structured item bank. Throws
 * ItemBankImportError (with the full list of problems) on any structural
 * or per-question validation failure — callers should surface `issues` to
 * the admin instead of a generic error.
 */
export async function parseItemBankWorkbook(buffer: Buffer | ArrayBuffer): Promise<ParsedItemBank> {
  const workbook = new ExcelJS.Workbook();
  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  // exceljs pulls in fast-csv, which carries its own (older, non-generic)
  // @types/node copy — that makes its declared `Buffer` a structurally
  // different type from ours even though both are the same Node Buffer at
  // runtime. `any` sidesteps the duplicate-@types/node type collision.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(nodeBuffer as any);

  const issues: string[] = [];

  const sheet = workbook.getWorksheet(ITEM_BANK_SHEET_NAME);
  if (!sheet) {
    throw new ItemBankImportError([
      `لم يتم العثور على ورقة باسم "${ITEM_BANK_SHEET_NAME}" في الملف.`,
    ]);
  }

  const headerRow = sheet.getRow(1);
  EXPECTED_HEADERS.forEach((expected, idx) => {
    const actual = cellText(headerRow, idx + 1);
    if (actual !== expected) {
      issues.push(
        `العمود ${String.fromCharCode(65 + idx)} في الصف الأول متوقَّع أن يكون "${expected}" لكن القيمة الموجودة هي "${actual ?? "(فارغ)"}".`
      );
    }
  });

  if (issues.length) {
    throw new ItemBankImportError(issues);
  }

  const questions: ParsedQuestion[] = [];
  const seenCodes = new Set<string>();

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const externalCode = cellText(row, 1);
    if (!externalCode) return; // blank trailing row

    const rowIssues: string[] = [];
    const language = cellText(row, 2) ?? "AR";
    const knowledgePath = cellText(row, 3);
    const frameworkRef = cellText(row, 4);
    const bloomLabel = cellText(row, 5);
    const difficultyLabel = cellText(row, 6);
    const targetPValue = cellNumber(row, 7);
    const targetDiscrimination = cellNumber(row, 8);
    const estimatedTimeSeconds = cellNumber(row, 9);
    const text = cellText(row, 10);
    const optionTexts: Record<ChoiceLabel, string | null> = {
      A: cellText(row, 11),
      B: cellText(row, 12),
      C: cellText(row, 13),
      D: cellText(row, 14),
    };
    const correctLabelRaw = cellText(row, 15);
    const correctJustification = cellText(row, 16);
    const distractor: Record<ChoiceLabel, { type: string | null; justification: string | null }> = {
      A: { type: cellText(row, 17), justification: cellText(row, 18) },
      B: { type: cellText(row, 19), justification: cellText(row, 20) },
      C: { type: cellText(row, 21), justification: cellText(row, 22) },
      D: { type: cellText(row, 23), justification: cellText(row, 24) },
    };
    const sourceReference = cellText(row, 25);
    const reviewerNotes = cellText(row, 26);

    if (seenCodes.has(externalCode)) rowIssues.push(`رقم السؤال "${externalCode}" مكرر.`);
    if (!knowledgePath) rowIssues.push("المسار المعرفي فارغ.");
    if (!bloomLabel) rowIssues.push("مستوى بلوم فارغ.");
    const bloomLevel = bloomLabel ? parseBloomLabel(bloomLabel) : null;
    if (bloomLabel && !bloomLevel) rowIssues.push(`تعذّر تفسير مستوى بلوم "${bloomLabel}".`);
    if (!difficultyLabel) rowIssues.push("الصعوبة فارغة.");
    const difficulty = difficultyLabel ? DIFFICULTY_MAP[difficultyLabel] : undefined;
    if (difficultyLabel && !difficulty) rowIssues.push(`قيمة صعوبة غير معروفة "${difficultyLabel}".`);
    if (!estimatedTimeSeconds || estimatedTimeSeconds <= 0) rowIssues.push("الزمن المقدر (ثانية) غير صالح.");
    if (!text) rowIssues.push("نص السؤال فارغ.");
    for (const l of CHOICE_LABELS) {
      if (!optionTexts[l]) rowIssues.push(`نص الخيار ${l} فارغ.`);
    }
    const correctLabel = correctLabelRaw?.toUpperCase().trim() as ChoiceLabel | undefined;
    if (!correctLabel || !CHOICE_LABELS.includes(correctLabel)) {
      rowIssues.push(`قيمة "الإجابة الصحيحة" غير صالحة: "${correctLabelRaw ?? ""}".`);
    }
    if (!correctJustification) rowIssues.push("تبرير الإجابة الصحيحة فارغ.");
    for (const l of CHOICE_LABELS) {
      if (l === correctLabel) continue;
      const d = distractor[l];
      if (!d.type || !DISTRACTOR_CODES.has(d.type.toUpperCase())) {
        rowIssues.push(`تصنيف مشتت ${l} غير صالح: "${d.type ?? ""}".`);
      }
      if (!d.justification) rowIssues.push(`تبرير مشتت ${l} فارغ.`);
    }

    if (rowIssues.length) {
      issues.push(`السؤال ${externalCode} (الصف ${rowNumber}): ` + rowIssues.join(" "));
      return;
    }

    seenCodes.add(externalCode);

    const choices: ParsedChoice[] = CHOICE_LABELS.map((label) => ({
      label,
      text: optionTexts[label]!,
      isCorrect: label === correctLabel,
      justification: label === correctLabel ? correctJustification! : distractor[label].justification!,
      distractorType: label === correctLabel ? null : ((distractor[label].type!.toUpperCase()) as DistractorCode),
    }));

    questions.push({
      order: questions.length + 1,
      externalCode,
      language,
      knowledgePath: knowledgePath!,
      frameworkRef,
      bloomLevel: bloomLevel!,
      bloomLabel: bloomLabel!,
      difficulty: difficulty!,
      difficultyLabel: difficultyLabel!,
      targetPValue,
      targetDiscrimination,
      estimatedTimeSeconds: estimatedTimeSeconds!,
      text: text!,
      sourceReference,
      reviewerNotes,
      choices,
    });
  });

  if (issues.length) {
    throw new ItemBankImportError(issues);
  }
  if (questions.length === 0) {
    throw new ItemBankImportError(["لم يتم العثور على أي أسئلة صالحة في الملف."]);
  }

  // Blueprint & QA Log are optional — kept as raw JSON for admin display only.
  let blueprintRows: (string | number | null)[][] | null = null;
  const blueprintSheet = workbook.getWorksheet(BLUEPRINT_SHEET_NAME);
  if (blueprintSheet) {
    blueprintRows = [];
    blueprintSheet.eachRow((row) => {
      const cells: (string | number | null)[] = [];
      let hasValue = false;
      for (let c = 1; c <= (blueprintSheet.actualColumnCount || 20); c++) {
        const t = cellText(row, c);
        const n = t === null ? null : (isNaN(Number(t)) ? t : Number(t));
        if (n !== null) hasValue = true;
        cells.push(n);
      }
      if (hasValue) blueprintRows!.push(cells);
    });
  }

  let qaLogRows: { item: string; result: string; notes: string }[] | null = null;
  const qaSheet = workbook.getWorksheet(QA_LOG_SHEET_NAME);
  if (qaSheet) {
    qaLogRows = [];
    qaSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const item = cellText(row, 1);
      const result = cellText(row, 2);
      const notes = cellText(row, 3);
      if (item) qaLogRows!.push({ item, result: result ?? "", notes: notes ?? "" });
    });
  }

  return { questions, blueprintRows, qaLogRows };
}
