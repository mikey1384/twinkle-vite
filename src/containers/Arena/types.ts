export type ArenaDifficulty = 'easy' | 'normal' | 'hard';
export type ArenaCompanion = 'Zero' | 'Ciel' | 'solo';
export interface ArenaMasteryProgress {
  clears: number;
  required: number;
  completed: boolean;
  solo: boolean;
  pending: boolean;
  tiers?: { pass: boolean; perfect: boolean };
  rewardsComplete?: boolean;
  retry?: { clears: number; required: number };
}
export interface ArenaScoreRules { correct: number; incorrect: number; omitted: number }

export interface ArenaRewardOffer {
  xp: number;
  coins: number;
  baseXP: number;
  baseCoins: number;
  target: number;
  max: number;
  freshPoints?: number;
  totalPoints?: number;
  dailyRemaining?: number;
  pendingOverlapPoints?: number;
  markingRequired?: boolean;
  mastery?: ArenaMasteryProgress;
  masteryReward?: { target: number; xp: number; coins: number; maxXP: number; maxCoins: number;
    tiers?: { pass?: { target: number; xp: number; coins: number }; perfect?: { target: number; xp: number; coins: number } } };
  nextPaperAvailable?: boolean;
  requirements?: { id: string; label: string; target: number; max: number; earned?: number | null }[];
}

export type ArenaRewardStatus = 'pending' | 'below_target' | 'below_skill_target' | 'daily_limit' | 'already_rewarded' | 'awarded';

export type ArenaBattlePreview =
  | { alreadyTaken: true; battleId: number; status: string; preview?: never }
  | { alreadyTaken?: false; preview: ArenaRewardOffer & { token: string } };

export interface ArenaExamSummary {
  key: string;
  ageLevel?: number;
  access?: { message: string; prerequisites: { key: string; name: string }[] } | null;
  mastery?: ArenaMasteryProgress;
  // boss codename, e.g. H3-3 with label 수능
  code: string;
  codeLabel: string | null;
  // the three modes and whether each has questions yet
  difficulties: {
    difficulty: ArenaDifficulty;
    ready: boolean;
    slain: boolean;
  }[];
  name: string;
  nameEn: string;
  language?: 'ko' | 'en';
  // has a listening section (the cover's rules mention it)
  listening?: boolean;
  // essay or spoken answers: its scores include AI estimates
  aiMarked?: boolean;
  scoreRules?: ArenaScoreRules;
  components?: { name: string; minutes: number; kind?: 'break' }[];
  lengths: {
    length: 'short' | 'medium' | 'full';
    items: number;
    minutes: number;
    rewards?: Record<ArenaDifficulty, ArenaRewardOffer>;
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
  masteryProgress?: ArenaMasteryProgress;
  companion?: ArenaCompanion;
  mastery?: { clearsBefore: number; required: number; solo: boolean; target: number; completed: boolean; clearedAt?: number;
    version?: number; rewardTier?: 'pass' | 'perfect'; qualification?: { clears: number; required: number; afterBattleId: number } };
  examKey: string;
  length: 'short' | 'medium' | 'full';
  difficulty: ArenaDifficulty;
  // a win (the exam's top-grade line on this paper) can be shared
  winAt: number | null;
  won: boolean;
  // the exam has essay or spoken answers: the score includes AI estimates
  aiMarked?: boolean;
  // its essay or spoken answers' marking (lists and the result)
  marking?: ArenaMarkingSummary;
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

export interface ArenaMarkingSummary {
  total: number;
  marked: number;
  // points of the marks already in
  markedPoints: number;
  // the battle's rawPoints already include every mark
  settled?: boolean;
  pending: number;
  awaiting: number;
  failed: number;
  stalled: boolean;
}

// An AI mark on the exam's public scale: always an estimate
export interface ArenaMark {
  criteria: {
    id: string;
    name: string;
    nameKo: string;
    score: number;
    max: number;
    comment: string;
    commentKo?: string;
  }[];
  total: number;
  max: number;
  // how the exam reports it: "16/20", "Band 6.5", "7점 / 10점"
  scaleScore: string;
  points: number;
  maxPoints: number;
  feedback: string;
  feedbackKo?: string;
  estimate: true;
}

export interface ArenaState {
  exams: ArenaExamSummary[];
  recent: ArenaBattleSummary[];
  paidBattlesToday: number;
  paidBattlesPerDay: number;
  examsToday?: number;
  examsPerDay?: number;
}

// 'order': the choices are tiles placed into body's blanks (TOEFL iBT
// Build a Sentence), the answer their indices in blank order
export type TypedFormat = 'integer' | 'number' | 'text' | 'transformation' | 'order';

export interface ArenaPartialCredit {
  earned: number;
  max: number;
  reason: 'blank' | 'word-count' | 'keyword' | 'full-forms' | null;
  parts: { correct: boolean; accepted: string[] }[];
}

export interface C1ScaleReport {
  skills: {
    key: string;
    label: string;
    raw: number;
    max: number;
    pending: boolean;
    complete: boolean;
    range: { low: number; high: number } | null;
  }[];
  average: { low: number; high: number; skills: number } | null;
}

export interface ArenaItem {
  no: number;
  type: string;
  section: 'listening' | 'reading' | 'main';
  points: number;
  unscored?: boolean;
  written?: boolean;
  wrongPenalty?: number;
  heading?: { title: string; directions: string };
  passageFirst?: boolean;
  fullWidth?: boolean;
  passageId: number | null;
  set?: string;
  plays?: number;
  stem: string;
  body?: string;
  visual?: Record<string, unknown>;
  // [] for a typed answer
  choices: string[];
  // a typed answer (수학 단답형 etc.): digits only, or a word or phrase
  typed?: TypedFormat;
  keyword?: string;
  // the number the real paper prints when it restarts per section
  // (TOEFL Junior "L12", TOSEL "II-3"); `no` stays the unique key
  display?: string;
  // options heard, not printed (TOSEL): choices are bare letters
  spokenChoices?: boolean;
  // an essay or spoken answer, AI-marked after the battle
  marked?: 'essay' | 'spoken';
  // a spoken prompt that is heard, not read (TOEFL iBT Speaking): its
  // script stays hidden until the battle is over; promptAudio plays first
  heard?: boolean;
  promptAudio?: string;
  task?: {
    minWords?: number;
    maxWords?: number;
    minChars?: number;
    maxChars?: number;
    prepSeconds?: number;
    responseSeconds?: number;
  };
  // a spoken answer's recording (null: none yet)
  recording?: { seconds: number | null } | null;
  // after the battle: the rubric it was marked on and the mark so far
  rubric?: {
    scale: string;
    criteria: { id: string; name?: string; max?: number; descriptor: string }[];
    requirements?: string[];
  };
  marking?: {
    status: 'draft' | 'queued' | 'marking' | 'marked' | 'awaiting' | 'failed';
    failure?: string;
    mark?: ArenaMark;
    transcript?: string;
  };
  // a choice index, or the typed text
  answer: number | string | null;
  // the key: a choice index, or the accepted typed answer the review prints
  key?: number | string;
  correct?: boolean;
  partialCredit?: ArenaPartialCredit;
  // ko: the Korean review of an English exam
  review?: {
    explanation: string;
    evidence?: string;
    why?: string[];
    ko?: { explanation: string; why?: string[] };
  };
}

export interface ArenaBattle {
  battle: ArenaBattleSummary & {
    exam: {
      key: string;
      // the exam's own language: reviews default to it
      language?: 'en' | 'ko';
      // 'all': every item prints its [n점] tag (수학, 한국사능력검정)
      pointTags?: 'all' | null;
      // (A)-(E) on English-language exams, ①-⑤ on Korean papers
      optionMarkers?: 'letters' | 'circled';
      // 'problem': 수학-style items (setup inline, then the question)
      layout?: 'problem' | null;
      code: string;
      codeLabel: string | null;
      name: string;
      nameEn: string;
      choices: number;
      aiMarked?: boolean;
      gradeLabels?: string[] | null;
      scoreRules?: ArenaScoreRules;
    };
    minutes: number | null;
    deadlineAt: number | null;
    serverNow: number;
    component?: {
      kind?: 'break';
      index: number;
      count: number;
      name: string;
      minutes: number;
      allowEarlyFinish?: boolean;
      startedAt: number | null;
      deadlineAt: number | null;
      state: 'ready' | 'running' | 'expired' | 'complete';
    };
    scaleReport?: C1ScaleReport | null;
    rewardOffer?: ArenaRewardOffer;
    reward?: {
      xpEarned: number;
      coinsEarned: number;
      rewardPending: boolean;
      markingPending: boolean;
      rewardStatus?: ArenaRewardStatus;
      baseXpEarned?: number;
      baseCoinsEarned?: number;
      scoreBonusXpEarned?: number;
      scoreBonusCoinsEarned?: number;
    } | null;
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
    // places moved since yesterday (+ up), or 'new' today
    move: number | 'new';
    user: { id: number; username: string; profilePicUrl: string | null } | null;
  }[];
}
