export interface RewardConfig {
  userDailyXP: number;
  userDailyCoins: number;
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
  maxLifetimeClaims?: number;
  completionProof?: 'classic-tower-v1';
  // numeric-quiz only: 'until-earned' plays sets in order and keeps a set up
  // until somebody has earned it; absent/'dated' serves by calendar day.
  progression?: 'dated' | 'until-earned';
  // Standing questions, served on any Korean day no dated set covers.
  questions?: RewardQuestion[];
  // Sets: dated (from/to, inclusive Korean days) or ordered (until-earned).
  sets?: Array<{
    from?: string;
    to?: string;
    key?: string;
    questions: RewardQuestion[];
  }>;
  // Wrong answers allowed per challenge; null = unlimited; absent = 3.
  maxAttempts?: number | null;
  // Share of xp/coins a correct answer pays after a wrong one; absent = full.
  retry?: { xpPercent: number; coinsPercent: number };
}
export interface RewardProposalEarnings {
  rules: Array<{
    title: string;
    xp: number;
    coins: number;
    maxLifetimeClaims?: number;
    completionProof?: 'classic-tower-v1';
  }>;
  budgets: { userDailyXP: number; userDailyCoins: number };
}
export interface RewardProposalSummary {
  revision: number;
  rewards?: RewardProposalEarnings;
  note: string;
  offeredAt: number;
  changedFiles: Array<{
    path: string;
    status: 'added' | 'updated' | 'deleted' | string;
  }>;
  diffSummary: {
    total: number;
    added: number;
    updated: number;
    deleted: number;
  };
}
export interface RewardProposalDiff {
  proposalRevision: number;
  rewards?: RewardProposalEarnings;
  reviewId: number;
  buildId: number;
  title: string;
  status: string;
  note: string;
  offeredAt: number | null;
  declinedAt: number | null;
  files: Array<{
    path: string;
    status: 'added' | 'updated' | 'deleted' | string;
    before: string;
    after: string;
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
  proposalConfig?: RewardConfig | null;
  ownerUsername?: string | null;
  reviewedAt?: number | null;
  // Reviewer proposal (2026-09-15): the reviewer's modified copy of the
  // submitted version, offered as the condition of approval.
  proposalHash?: string | null;
  proposalNote?: string;
  proposalBuildId?: number | null;
  offeredAt?: number | null;
  declinedAt?: number | null;
  declinedByCreator?: boolean;
  proposal?: RewardProposalSummary | null;
  proposalFiles?: Array<{ path: string; content: string }> | null;
  // Approval publishes: the version an approval (or accepted proposal) put live.
  publishedArtifactVersionId?: number | null;
  published?: {
    artifactVersionId: number;
    version: number;
    transition: string;
  } | null;
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
    | 'changes_offered'
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
  // The creator turned down the reviewer's proposed changes.
  declinedByCreator?: boolean;
  // The version the latest approval published (approval publishes).
  publishedArtifactVersionId?: number | null;
  // Present while the reviewer's proposed changes wait for the creator.
  proposal?: RewardProposalSummary | null;
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
      userDailyXP: number;
      userDailyCoins: number;
      userDailyClaims: number | null;
    } | null;
    sheetRuleIds: string[];
  } | null;
  approvalMatches: boolean;
  canPublish: boolean;
}
