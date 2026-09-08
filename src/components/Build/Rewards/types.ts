export interface RewardConfig {
  dailyXP: number;
  dailyCoins: number;
  userDailyXP: number;
  userDailyCoins: number;
  lifetimeXP: number;
  lifetimeCoins: number;
  rules: Array<{
    id: string;
    title: string;
    xp: number;
    coins: number;
    verifier: 'numeric-quiz';
    questions: Array<{ prompt: string; answer: number }>;
  }>;
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
    | 'not_configured'
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
  reviewNote: string;
  sourceVersionId: number;
  summary: Array<{ title: string; xp: number; coins: number }>;
  approvalMatches: boolean;
  canPublish: boolean;
}
