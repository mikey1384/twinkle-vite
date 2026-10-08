import type { ReviewRuleCard } from '../Review/RuleCard';

export interface QuestSkill {
  code: string;
  nameEn: string;
  nameKo: string | null;
}

export interface QuestNode {
  id: string;
  kind: 'stop' | 'fort' | 'castle';
  index: number;
  name: string;
  unlocked: boolean;
  cleared: boolean;
  bestScore: number | null;
  // the best run's letter, Classic's S–F; null until played
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | null;
  // an upheld challenge on this boss earned a rematch that pays in full
  freeRematch?: boolean;
  // today's goals count only the newest stops and bosses (Mikey 10-08)
  countsForGoals?: boolean;
  skills?: QuestSkill[];
}

export interface QuestWorld {
  id: number;
  key: string;
  name: string;
  tier: string;
  unlocked: boolean;
  sMarbles: number;
  nodeCount: number;
  nodes: QuestNode[];
}

export interface QuestState {
  worlds: QuestWorld[];
  nemesis: { skill: string; nameEn: string; misses: number; due: boolean }[];
  ruleBook: { seen: number; total: number };
  rewardedRunsLeft: number;
  // replays of cleared stops and bosses pay in full only once the final castle falls
  replaysPay?: boolean;
  openRun: { runId: number; nodeId: string } | null;
}

export interface QuestQuestion {
  position: number;
  question: string;
  choices: string[];
  skill: string;
  skillName: string;
  retryOf?: number; // practice: a missed question asked again
  baseTimeMs?: number; // boss: this question's time limit
  revealDelayMs?: number; // boss: Classic's reading pause
}

export interface QuestAnswer {
  position: number;
  isCorrect: boolean;
  selectedIndex: number;
  // a boss keeps the key hidden until the right pick
  correctIndex: number | null;
  combo?: number;
  ruleCard?: ReviewRuleCard | null;
  // a miss (or a boss hit that took wrong clicks) can challenge its question
  // with Classic's Challenge; checked = already reviewed by one
  // upheld (client only): the challenge fixed the key and forgave the miss
  challenge?: { questionId: number; checked: boolean; upheld?: boolean } | null;
  questionText?: string; // added on the client for the result's challenge list
  // a miss (or a boss hit that took wrong clicks): how long its explanation
  // holds Continue before the run moves on
  readMs?: number;
  // practice
  rights?: number;
  goal?: number;
  retry?: QuestQuestion;
  // boss
  grade?: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | null;
  gained?: number;
  points?: number;
  passPoints?: number;
  wrong?: number;
}

export type QuestRules =
  | { mode: 'practice'; goal: number }
  | { mode: 'boss'; hits: number; passPoints: number; timeScale: number }
  | { mode: 'nemesis' };

export interface QuestRun {
  runId: number;
  nodeId: string;
  kind: 'stop' | 'fort' | 'castle' | 'nemesis';
  worldId: number;
  rules: QuestRules;
  questions: QuestQuestion[];
  answers?: QuestAnswer[];
  combo?: number;
  rights?: number;
  points?: number;
  wrongPicks?: number[]; // boss resume: choices already clicked wrong on the current hit
  usedMs?: number; // boss resume: time this hit's clock already ran
}

export interface QuestResult {
  runId: number;
  score: number;
  grade?: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | null;
  cleared: boolean;
  perfect?: boolean;
  rights?: number;
  misses?: number;
  points?: number;
  passPoints?: number;
  firstTryCorrect: number;
  size: number;
  xp: number;
  coins: number;
  newXp?: number;
  newCoins?: number;
  rewardedRunsLeft?: number;
  replayCut?: boolean; // an early replay: half XP, no Coins
  freeRematch?: boolean; // a full-pay rematch earned by an upheld challenge
  countsForGoals?: boolean; // false: this node is too far back for today's goals
  dailyTaskStatus?: any;
}
