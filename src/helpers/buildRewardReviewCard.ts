// Pure presentation helpers for the `buildRewardReview` chat card. The card
// payload is hydrated by the server from the review row (status is canonical,
// answer keys are never included); these helpers only phrase it.

export type BuildRewardReviewStatus =
  'pending' | 'approved' | 'rejected' | 'superseded' | 'revoked';

export interface BuildRewardReviewRuleSummary {
  id?: string;
  title?: string;
  xp?: number | null;
  coins?: number | null;
}

export interface BuildRewardReviewCardPayload {
  reviewId?: number;
  buildId?: number;
  ownerId?: number;
  ownerUsername?: string | null;
  title?: string;
  thumbnailUrl?: string | null;
  status?: BuildRewardReviewStatus | string;
  // 'superseded' has two causes: the creator sent a newer request, or the
  // creator saved a newer version (the request can then never be published).
  closedBySave?: boolean;
  reason?: string;
  sourceVersionId?: number;
  rules?: BuildRewardReviewRuleSummary[];
  budgets?: {
    dailyXP?: number;
    dailyCoins?: number;
    userDailyXP?: number;
    userDailyCoins?: number;
    lifetimeXP?: number;
    lifetimeCoins?: number;
  };
  createdAt?: number;
  reviewedAt?: number;
  eventTimeMs?: number;
}

const REVIEW_STATUSES: ReadonlySet<string> = new Set([
  'pending',
  'approved',
  'rejected',
  'superseded',
  'revoked'
]);

export function normalizeBuildRewardReviewStatus(
  value: unknown
): BuildRewardReviewStatus {
  const status = String(value || '').trim();
  return REVIEW_STATUSES.has(status)
    ? (status as BuildRewardReviewStatus)
    : 'pending';
}

export function summarizeBuildRewardRules(
  rules?: BuildRewardReviewRuleSummary[] | null
) {
  const list = Array.isArray(rules) ? rules : [];
  let maxXP = 0;
  let maxCoins = 0;
  for (const rule of list) {
    maxXP = Math.max(maxXP, Math.floor(Number(rule?.xp) || 0));
    maxCoins = Math.max(maxCoins, Math.floor(Number(rule?.coins) || 0));
  }
  return { ruleCount: list.length, maxXP, maxCoins };
}

function formatAmount(value: number) {
  return Number(value || 0).toLocaleString('en-US');
}

// "3 rules · up to 500 XP & 50 Coins each" — one line a reviewer can scan.
export function formatBuildRewardRulesSummary(
  rules?: BuildRewardReviewRuleSummary[] | null
) {
  const { ruleCount, maxXP, maxCoins } = summarizeBuildRewardRules(rules);
  if (ruleCount === 0) return 'Earning rules set by the admin at approval';
  const ruleLabel = `${ruleCount} ${ruleCount === 1 ? 'rule' : 'rules'}`;
  const amounts = [
    maxXP > 0 ? `${formatAmount(maxXP)} XP` : '',
    maxCoins > 0 ? `${formatAmount(maxCoins)} Coins` : ''
  ].filter(Boolean);
  if (amounts.length === 0) return ruleLabel;
  return `${ruleLabel} · up to ${amounts.join(' & ')} each`;
}

export function getBuildRewardReviewBannerText(
  status: BuildRewardReviewStatus,
  closedBySave = false
) {
  switch (status) {
    case 'approved':
      return 'Reward release approved';
    case 'rejected':
      return 'Reward release declined';
    case 'superseded':
      return closedBySave
        ? 'Reward review closed · a newer version was saved'
        : 'Reward review replaced by a newer version';
    case 'revoked':
      return 'Reward approval revoked';
    default:
      return 'Sent for XP & Coin reward review';
  }
}

export function getBuildRewardReviewStatusLabel(
  status: BuildRewardReviewStatus
) {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Declined';
    case 'superseded':
      return 'Closed';
    case 'revoked':
      return 'Revoked';
    default:
      return 'Waiting for review';
  }
}

// The Management page's "App reward approvals" panel is where a review is
// actually approved; the query string lets it open on this one review.
export function getBuildRewardReviewManagementPath(reviewId: number) {
  const normalized = Math.floor(Number(reviewId || 0));
  return normalized > 0
    ? `/management?rewardReview=${normalized}`
    : '/management';
}

export function parseBuildRewardReviewFocusId(search: string) {
  try {
    const value = new URLSearchParams(search || '').get('rewardReview');
    const reviewId = Math.floor(Number(value || 0));
    return Number.isSafeInteger(reviewId) && reviewId > 0 ? reviewId : 0;
  } catch {
    return 0;
  }
}
