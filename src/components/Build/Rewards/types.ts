export interface RewardConfig {
  userDailyXP: number;
  userDailyCoins: number;
  // Receipts one learner may earn per Korean day across all rules.
  userDailyClaims?: number;
  rules: Array<RewardRule>;
  // Twinkle.coins prices approved in the same review (RULING 11-07).
  prices?: CoinPrice[];
  spendBudget?: { userDailyCoins: number };
  // Server-held land (Twinkle.land), reviewed with the prices.
  land?: LandDeclaration;
}
// rewards.json "land" (helpers/build/landPolicy.ts on the API).
export interface LandDeclaration {
  keyGroup: string;
  plotSize: number;
  keyFormat: 'region:x:z' | 'region:cx:cz';
  regions: string[];
  // Worlds players change with no plots (Twinkle stores only declared worlds).
  freeRegions?: string[];
  reserved?: Array<{ x: number; z: number; radius: number; region?: string; why?: string }>;
  switches?: Record<string, { cause: string; values: number[] }>;
  empty?: number[];
  // Land zones (11-10): areas nobody can change, and areas any signed-in
  // player can put back to the generated world (free worlds only).
  locked?: LandLockedArea[];
  resettable?: LandResettableArea[];
}
export interface LandLockedArea {
  region: string;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  why: string;
  allowCauses?: string[];
}
export interface LandResettableArea {
  id: string;
  region: string;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  cooldownSeconds?: number;
  why: string;
}
// summarizeCoinPrices().land: the declaration plus the sentence the review
// screen, the chat card and the CLI share.
export interface LandSummary {
  keyGroup: string;
  plotSize: number;
  keyFormat: string;
  regions: string[];
  freeRegions?: string[];
  reserved: Array<{ x: number; z: number; radius: number; region?: string; why?: string }>;
  switches: Array<{ name: string; cause: string; values: number[] }>;
  empty: number[];
  locked?: LandLockedArea[];
  resettable?: LandResettableArea[];
  text: string;
}
export interface CoinPrice {
  id: string;
  title: string;
  howTo?: string;
  coins: number;
  destination: 'removed' | 'owner';
  userDailyLimit?: number;
  maxLifetime?: number;
  uniqueKey?: boolean;
  keyGroup?: string;
  // Land prices only: how many one player may get per world (purchases and
  // admin grants, also after a sale; refunds do not count).
  maxPerRegion?: number;
  // maxCoins: the highest offer price (required with offers since 11-07).
  offers?: { minCoins: number; maxCoins?: number; maxOpenPerPlayer?: number };
  builders?: {
    coinsPerUnit: number;
    maxUnitsPerRecipient: number;
    maxRecipients?: number;
    maxCoinsPerPurchase?: number;
    unitName?: string;
    // r2: the plot grid the purchase keys name; Twinkle pays from its own
    // block record inside it (required for a builders price).
    tally?: { plotSize: number; keyFormat: 'region:x:z' | 'region:cx:cz' };
  };
}
// Reviewer context for an app's Coin prices (coinPriceReview.ts).
export interface CoinPriceReviewContext {
  ownerUsername: string | null;
  prices: CoinPrice[];
  spendBudget: { userDailyCoins: number } | null;
  sales: Array<{ priceId: string; purchases: number; buyers: number; coins: number }>;
  ownerEarnings: { coins: number; purchases: number; buyers: number };
  builderPurchases: number;
  // r2: blocks Twinkle has recorded in this app, and by how many players.
  tally?: { cells: number; builders: number } | null;
  // Sales and takeovers so far: Coins paid to previous holders.
  resales?: { sales: number; sellers: number; coins: number };
  // Twinkle.land: the declaration's summary, and the worlds and plots now.
  land?: LandSummary | null;
  landStats?: {
    worlds: Array<{ region: string; cells: number; changes: number; plots: number; holders: number }>;
    plots: number;
  } | null;
  // The offer rule's days (30-day takeover, lapse day or null, re-offer wait).
  offerRule?: { takeoverAfterDays: number; lapseAfterDays: number | null; reofferCooldownDays: number };
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
  // How to earn it, in the player's words; shown on the Earn page.
  howTo?: string;
  // Earn page section header, and the key tying repeat rules into one row.
  category?: string;
  series?: string;
  xp: number;
  coins: number;
  // numeric-quiz: server-checked answers. completion: the app reports a
  // finished activity; the server holds it to minSeconds, once a day, budgets.
  // generated-quiz: questions the server writes into a bank (see `bank`).
  // archive-rematch: the daily rematch of one retired until-earned puzzle.
  verifier:
    'numeric-quiz' | 'completion' | 'generated-quiz' | 'archive-rematch';
  // generated-quiz only: the difficulty ladder (percent of xp/coins per step,
  // easiest first, ending at 100), the starting step, the generation brief
  // and the topics questions are written for.
  bank?: {
    steps: number[];
    startStep?: number;
    instructions: string;
    topics: Array<{ key: string; title: string; description: string }>;
  };
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
  retry?: { xpPercent: number; coinsPercent: number; paidAttempts?: number };
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
  // A new app name / thumbnail the offer applies on accept (null: unchanged),
  // and (creator settings) what the app has now.
  title?: string | null;
  thumbnailUrl?: string | null;
  currentTitle?: string;
  currentThumbnailUrl?: string | null;
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
  // The app's thumbnail now, and what the offer would change name and
  // thumbnail to (null: unchanged).
  thumbnailUrl?: string | null;
  proposedTitle?: string | null;
  proposedThumbnailUrl?: string | null;
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
  // Reviewer view: the app's thumbnail and the one set on the reviewer's
  // workspace copy (offerable as a new thumbnail).
  thumbnailUrl?: string | null;
  proposalWorkspaceThumbnailUrl?: string | null;
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
  // rules only a timer checks (the warning the creator saw before sending)
  timerOnlyWarnings?: string[];
  // Coin prices: shared warnings and who gets the Coins.
  coinPriceWarnings?: string[];
  coinPrices?: CoinPriceReviewContext | null;
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
  // The saved code has no rewards and the app never set any up.
  neverHadRewards?: boolean;
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
    // rules only a timer checks; shown before Send, never blocking it
    warnings?: string[];
    rules: Array<{
      id: string;
      title: string;
      xp: number;
      coins: number;
      verifier:
        'numeric-quiz' | 'completion' | 'generated-quiz' | 'archive-rematch';
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
    // What the app asks to charge and where each price's Coins go.
    prices?: CoinPrice[];
    spendBudget?: { userDailyCoins: number } | null;
  } | null;
  approvalMatches: boolean;
  canPublish: boolean;
}
