export interface RewardConfig {
  dailyXP: number;
  dailyCoins: number;
  userDailyXP: number;
  userDailyCoins: number;
  lifetimeXP: number;
  lifetimeCoins: number;
  // Receipts one learner may earn per Korean day across all rules.
  userDailyClaims?: number;
  rules: Array<RewardRule>;
}
export interface RewardQuestion {
  prompt: string;
  answer: number;
  // Shown from the start.
  hint?: string;
  // Released to the learner only after their first answer.
  guide?: unknown;
}
export interface RewardRule {
  id: string;
  title: string;
  xp: number;
  coins: number;
  // numeric-quiz: server-checked answers. completion: the app reports a
  // finished activity; the server holds it to minSeconds, once a day, budgets.
  verifier: 'numeric-quiz' | 'completion';
  // completion only: seconds that must pass between start and claim.
  minSeconds?: number;
  // numeric-quiz only: 'until-earned' plays sets in order and keeps a set up
  // until somebody has earned it; absent/'dated' serves by calendar day.
  progression?: 'dated' | 'until-earned';
  // Standing questions, served on any Korean day no dated set covers.
  questions?: RewardQuestion[];
  // Sets: dated (from/to, inclusive Korean days) or ordered (until-earned).
  sets?: Array<{ from?: string; to?: string; key?: string; questions: RewardQuestion[] }>;
  // Wrong answers allowed per challenge; null = unlimited; absent = 3.
  maxAttempts?: number | null;
  // Share of xp/coins a correct answer pays after a wrong one; absent = full.
  retry?: { xpPercent: number; coinsPercent: number };
}
export interface RewardReview {
  id: number;
  buildId: number;
  ownerId: number;
  title?: string;
  sourceVersionId: number;
  sourceHash: string;
  status: string;
  reason: string;
  createdAt: number;
  config: RewardConfig;
  ownerUsername?: string | null;
  reviewedAt?: number | null;
  // Reviewer context returned by the single-review load.
  detectedRuleIds?: string[];
  isLatest?: boolean;
  // 'superseded' because the creator saved past it (not because a newer
  // request replaced it). Nothing can be decided on such a review.
  closedBySave?: boolean;
  isLive?: boolean;
  publishedVersionId?: number | null;
  appLifetime?: { xp: number; coins: number };
  awarded?: { awards: number; earners: number; xp: number; coins: number };
  events?: Array<{
    actorId: number;
    action: string;
    reason: string;
    artifactVersionId: number | null;
    createdAt: number;
  }>;
  files: Array<{ path: string; content: string }>;
}
export interface RewardSettings {
  policy: {
    liveReviewId: number | null;
    liveStatus: string | null;
    latestReviewId: number | null;
    totalXP: number;
    totalCoins: number;
  } | null;
  state:
    | 'removed'
    | 'needs_review'
    | 'in_review'
    | 'approved'
    | 'published'
    | 'changes_requested'
    | 'paused';
  configured: boolean;
  approvalRequired: boolean;
  canSubmit: boolean;
  isUpdate: boolean;
  liveActive: boolean;
  reviewId: number | null;
  // The last request closed itself because a newer version was saved.
  requestClosedBySave?: boolean;
  reviewNote: string;
  sourceVersionId: number;
  summary: Array<{ title: string; xp: number; coins: number }>;
  // What the saved code declares in rewards.json (merged with the question
  // sheet on file). Null when the code does not use the rewards SDK.
  declaration?: {
    declared: boolean;
    legacy: boolean;
    ok: boolean;
    errors: string[];
    rules: Array<{
      id: string;
      title: string;
      xp: number;
      coins: number;
      verifier: 'numeric-quiz' | 'completion';
      minSeconds?: number;
      progression?: string;
      questionSets: number;
      standingQuestions: number;
    }>;
    budgets: {
      dailyXP: number;
      dailyCoins: number;
      userDailyXP: number;
      userDailyCoins: number;
      lifetimeXP: number;
      lifetimeCoins: number;
      userDailyClaims: number | null;
    } | null;
    sheetRuleIds: string[];
  } | null;
  approvalMatches: boolean;
  canPublish: boolean;
}
