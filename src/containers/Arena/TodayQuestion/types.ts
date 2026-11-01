export interface Choice { key: string; label: string }
export interface Profile { revision?: number; goal: string; subject: string; grade: string; confidence: string }
export interface Prompt { prompt: string; passage?: string; choices?: string[] }
export interface Scene {
  kind: 'cards' | 'bars' | 'passage'; caption: string;
  parts: { text: string; emphasis?: boolean; value?: number }[];
}
export interface LessonStep {
  title: string; prompt: string; scene?: Scene; options: { label: string }[];
  response?: { option: number; correct: boolean; feedback: string; scene?: Scene };
}
export interface TodayState {
  // 'shared': another member's cleared question, opened from Home; it has no
  // profile, setup or options, and its own payout and daily paid limit
  kind?: 'shared';
  challengeId?: number;
  sharer?: { id: number; username: string | null };
  paidPerDay?: number;
  paidToday?: number;
  dayIndex: number; nextDay: number;
  profile?: Profile | null;
  setupCompletedToday?: boolean;
  rewards: { correctXP: number; correctCoins: number; guidedXP: number; guidedCoins: number };
  balances: { twinkleXP: number; twinkleCoins: number };
  options?: { goals: (Choice & { subjects: string[] })[]; grades: Choice[]; confidence: Choice[]; exams: Choice[] };
  dailyTaskStatus?: any;
  assignment: {
    id: number; dayIndex: number; title: string; skill: string; question: Prompt;
    rewards: TodayState['rewards']; attempted: boolean; firstCorrect: boolean | null; firstAnswer: string | number | null;
    completedVia: 'correct' | 'guided' | null; reward: { xp: number; coins: number };
    // a shared clear after the day's paid ones: cleared, not paid
    unpaid?: boolean;
    lesson?: { title: string; totalSteps: number; completedSteps: number; summary?: string; steps: LessonStep[] };
    check?: Prompt; checkResult?: { answer: string | number; correct: boolean; explanation?: string } | null;
  } | null;
}
