export type ArenaDifficulty = 'easy' | 'normal' | 'hard';

export interface ArenaExamSummary {
  key: string;
  // boss codename, e.g. H3-3 with label 수능
  code: string;
  codeLabel: string | null;
  // the three modes and whether each has questions yet
  difficulties: { difficulty: ArenaDifficulty; ready: boolean }[];
  name: string;
  nameEn: string;
  lengths: {
    length: 'short' | 'medium' | 'full';
    items: number;
    minutes: number;
  }[];
}

export interface ArenaGradeEstimate {
  grade: number;
  low: number;
  high: number;
  probability: number;
}

export interface ArenaBattleSummary {
  id: number;
  examKey: string;
  length: 'short' | 'medium' | 'full';
  difficulty: ArenaDifficulty;
  // a win (the exam's top-grade line on this paper) can be shared
  winAt: number | null;
  won: boolean;
  mode: 'battle' | 'untimed';
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
  recent: ArenaBattleSummary[];
  paidBattlesToday: number;
  paidBattlesPerDay: number;
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
  visual?: Record<string, unknown>;
  choices: string[];
  answer: number | null;
  key?: number;
  correct?: boolean;
  review?: { explanation: string; evidence?: string; why?: string[] };
}

export interface ArenaBattle {
  battle: ArenaBattleSummary & {
    exam: {
      key: string;
      code: string;
      codeLabel: string | null;
      name: string;
      nameEn: string;
      choices: number;
      gradeLabels?: string[] | null;
    };
    minutes: number | null;
    deadlineAt: number | null;
    serverNow: number;
  };
  passages: Record<
    string,
    { kind: string; body: string; audioPath: string | null }
  >;
  items: ArenaItem[];
  // an untimed retake: when each question was answered last time (seconds)
  ghost?: { no: number; at: number }[] | null;
}

// Arena's Weekly League board (api helpers/arena/league.ts loadLeague)
export interface ArenaLeague {
  week: number;
  endsAt: number;
  tier: number;
  tierName: string;
  hidden: boolean;
  shielded: boolean;
  lastResult: {
    week: number;
    rank: number;
    outcome: 'up' | 'stay' | 'down';
    xp: number;
    tierName: string;
  } | null;
  joined: boolean;
  size: number;
  myRank: number | null;
  myLp: number;
  // ranks 1..upTo go up; downFrom..size go down; 0 = no line
  upTo: number;
  downFrom: number;
  rows: {
    rank: number;
    lp: number;
    me: boolean;
    user: { id: number; username: string; profilePicUrl: string | null } | null;
  }[];
}
