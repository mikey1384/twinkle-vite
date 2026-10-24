export interface ArenaExamSummary {
  key: string;
  name: string;
  nameEn: string;
  lengths: { length: 'short' | 'medium' | 'full'; items: number; minutes: number }[];
}

export interface ArenaGradeEstimate {
  grade: number;
  low: number;
  high: number;
  probability: number;
}

export interface ArenaFightSummary {
  id: number;
  examKey: string;
  length: 'short' | 'medium' | 'full';
  mode: 'fight' | 'untimed';
  status: 'open' | 'grading' | 'finished' | 'abandoned';
  rawPoints: number | null;
  maxPoints: number | null;
  grade: number | null;
  estimate: {
    theta: number;
    se: number;
    answers: number;
    calibratedAnswers: number;
    grade: ArenaGradeEstimate | null;
  } | null;
  startedAt: number;
  finishedAt: number | null;
}

export interface ArenaState {
  exams: ArenaExamSummary[];
  recent: ArenaFightSummary[];
  paidFightsToday: number;
  paidFightsPerDay: number;
}

export interface ArenaItem {
  no: number;
  type: string;
  section: 'listening' | 'reading' | 'main';
  points: number;
  passageId: number | null;
  set?: string;
  plays?: number;
  stem: string;
  body?: string;
  choices: string[];
  answer: number | null;
  key?: number;
  correct?: boolean;
  review?: { explanation: string; evidence?: string; why?: string[] };
}

export interface ArenaFight {
  fight: ArenaFightSummary & {
    exam: { key: string; name: string; nameEn: string; choices: number };
    minutes: number | null;
    deadlineAt: number | null;
    serverNow: number;
  };
  passages: Record<string, { kind: string; body: string; audioPath: string | null }>;
  items: ArenaItem[];
}
