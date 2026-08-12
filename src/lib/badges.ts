/** Fixed badge catalogue — codes are stable identifiers used by the award logic in src/lib/gamification.ts. */
export const BADGE_CATALOG = [
  {
    code: "COMPLETION",
    title: "المثابر",
    description: "أكمل الاختبار كاملاً بجميع أسئلته الـ45.",
    icon: "🏁",
  },
  {
    code: "HIGH_ACCURACY",
    title: "الدقة العالية",
    description: "حقق نسبة إجابات صحيحة 90% فأكثر.",
    icon: "🎯",
  },
  {
    code: "PERFECT_SCORE",
    title: "التميّز الكامل",
    description: "أجاب عن جميع الأسئلة إجابة صحيحة (100%).",
    icon: "🏆",
  },
  {
    code: "DEEP_ANALYST",
    title: "المحلّل العميق",
    description: "أجاب بشكل صحيح عن جميع أسئلة مستويي التحليل والتقييم (بلوم 4 و5).",
    icon: "🧠",
  },
  {
    code: "PERFECT_PACE",
    title: "الوتيرة المثالية",
    description: "حافظ على دقة عالية (80%+) وزمن إجابة قريب من الزمن المقدَّر لكل سؤال دون تسرّع أو تردد.",
    icon: "⏱️",
  },
] as const;

export type BadgeCode = (typeof BADGE_CATALOG)[number]["code"];
