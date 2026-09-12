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
  verifier: 'numeric-quiz';
  // Standing questions, served on any Korean day no dated set covers.
  questions?: RewardQuestion[];
  // Dated sets (inclusive Korean calendar days); the server serves today's.
  sets?: Array<{ from: string; to?: string; questions: RewardQuestion[] }>;
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
  approvalMatches: boolean;
  canPublish: boolean;
}
