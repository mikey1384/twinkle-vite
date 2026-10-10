import type { ReviewRuleCard } from '../Review/RuleCard';
import type { SavedChallengeReview } from '../Review/challengeReviews';

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
  // the stop's twist, and the question type a teach stop introduces
  modifier?: 'example' | 'combo' | 'fog' | 'chaser';
  teaches?: QuestFormat;
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

// The ways an obstacle asks its question (Mikey 10-10): fill the gap, pick
// the right road, spot the crack, fix the jammed lock.
export type QuestFormat =
  'blank' | 'which' | 'crack' | 'fix' | 'stomp' | 'momentum' | 'build';

export interface QuestQuestion {
  position: number;
  // practice stops: how this obstacle asks it (absent = blank)
  format?: QuestFormat;
  // blank/which: the prompt; crack/fix: the sentence with the mistake in it
  question: string;
  // blank: four words; which: two whole sentences; fix: three replacements;
  // crack: none (tap a word instead)
  choices: string[];
  // crack: the sentence's words to tap
  tokens?: string[];
  // build: the end mark shown fixed after the slots (the pieces don't carry it)
  end?: string;
  // fix: the sentence around the wrong part
  parts?: { before: string; wrong: string; after: string };
  // stomp: how many sentences are wrong
  targets?: number;
  skill: string;
  skillName: string;
  retryOf?: number; // practice: a missed question asked again
  baseTimeMs?: number; // boss: this question's time limit
  graceMs?: number; // boss: its reading allowance, inside the limit, not graded
  revealDelayMs?: number; // boss: the telegraph plus Classic's reading pause
  // boss (Mikey 10-10): the attack this hit is (its name shows for
  // telegraphMs first), or a counter: one try on a short clock, no harm
  attack?: 'strike' | 'jab' | 'slam' | 'trap' | 'swarm' | 'barrage' | 'climb';
  telegraphMs?: number;
  counter?: boolean;
}

export interface QuestAnswer {
  position: number;
  isCorrect: boolean;
  // the tap graded (a counter's one try; -1: its clock ran out)
  selectedIndex: number;
  // a boss keeps the key hidden until the right pick
  correctIndex: number | null;
  combo?: number;
  ruleCard?: ReviewRuleCard | null;
  // a miss (or a boss hit that took wrong clicks) can challenge its question
  // with Classic's Challenge; checked = already reviewed by one
  // upheld (client only): the challenge fixed the key and forgave the miss
  challenge?: {
    questionId: number;
    checked: boolean;
    review?: SavedChallengeReview | null;
    upheld?: boolean;
  } | null;
  questionText?: string; // added on the client for the result's challenge list
  // a miss (or a boss hit that took wrong clicks): how long its explanation
  // holds Continue before the run moves on
  readMs?: number;
  // practice
  rights?: number;
  goal?: number;
  retry?: QuestQuestion;
  // practice: the next question, already in the next obstacle's type
  next?: QuestQuestion;
  // practice: this miss was queued to be asked again later in the run
  requeued?: boolean;
  // a chaser stop: how far behind it is now, and caught (the stop is over)
  chaser?: { gap: number; start: number };
  caught?: boolean;
  // crack: every word of the mistake (correctIndex is the first)
  correct?: number[];
  // a miss: the wrong choice the rule card explains
  pickedText?: string;
  // crack / fix / build: the bank's own sentence (for a challenge)
  prompt?: string;
  // boss: the click limit settled the hit as an F
  settled?: boolean;
  // boss
  grade?: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | null;
  gained?: number;
  points?: number;
  passPoints?: number;
  wrong?: number;
  // boss: the health left after this answer; a counter's outcome
  hp?: number;
  counter?: boolean;
  damage?: number;
  late?: boolean; // a counter answered right after its window closed
  // a miss later ruled the question's fault (a check or someone's upheld
  // challenge): a stop's doesn't count, a boss's earned a free rematch
  forgiven?: boolean;
}

export type QuestRules =
  | {
      mode: 'practice';
      goal: number;
      slots?: QuestFormat[];
      // the stop's twist (Mikey 10-10): a worked example first, a combo
      // meter, fog or a chaser
      modifier?: 'example' | 'combo' | 'fog' | 'chaser';
      example?: {
        sentence: string;
        question: string;
        answer: string;
        card: ReviewRuleCard;
      };
      chaser?: { gap: number; start: number };
    }
  | {
      mode: 'boss';
      hits: number;
      passPoints: number;
      timeScale: number;
      hp?: number;
      counterDamage?: number;
    }
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
  hp?: number; // boss resume: its health left
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
  counterHits?: number; // boss: counters landed (bonus damage and XP)
  caught?: boolean; // a chaser stop: the chaser caught up
  counterDamage?: number;
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
  // the run's answers as finished (a miss since ruled the question's fault
  // carries forgiven)
  answers?: Pick<QuestAnswer, 'position' | 'forgiven'>[];
  dailyTaskStatus?: any;
}
