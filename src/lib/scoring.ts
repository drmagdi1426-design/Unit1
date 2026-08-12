import type { BloomCode, DifficultyCode } from "@/lib/itemBankImport";

/**
 * Point weighting: harder items and higher-order thinking (Bloom analysis /
 * evaluation) are worth more than simple recall/comprehension — this rewards
 * genuine mastery rather than lucky guesses on easy recall items, in line
 * with adult-learning emphasis on applied, higher-order engagement.
 */
const DIFFICULTY_BASE_POINTS: Record<DifficultyCode, number> = {
  MUBTADI: 10,
  MUTAWASSIT: 15,
  IHTIRAFI: 20,
};

const BLOOM_MULTIPLIER: Record<BloomCode, number> = {
  BLOOM1: 0.9,
  BLOOM2: 1.0,
  BLOOM3: 1.1,
  BLOOM4: 1.25,
  BLOOM5: 1.4,
  BLOOM6: 1.5,
};

export function computeQuestionPoints(difficulty: DifficultyCode, bloomLevel: BloomCode): number {
  return Math.round(DIFFICULTY_BASE_POINTS[difficulty] * BLOOM_MULTIPLIER[bloomLevel]);
}

/** Gamification levels, unlocked by cumulative percentage score of a completed attempt. */
export const LEVELS = [
  { level: 1, title: "مستكشف مبتدئ", minPercent: 0 },
  { level: 2, title: "متدرّب واعد", minPercent: 40 },
  { level: 3, title: "ممارس كفؤ", minPercent: 60 },
  { level: 4, title: "محترف الموارد البشرية", minPercent: 75 },
  { level: 5, title: "خبير إستراتيجي", minPercent: 90 },
] as const;

export function computeLevel(scorePercent: number): { level: number; title: string } {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) {
    if (scorePercent >= l.minPercent) current = l;
  }
  return { level: current.level, title: current.title };
}
