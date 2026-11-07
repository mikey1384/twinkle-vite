// Pure presentation helpers for the `buildRewardReview` chat card. The card
// payload is hydrated by the server from the review row (status is canonical,
// answer keys are never included); these helpers only phrase it.

export type BuildRewardReviewStatus =
  | 'pending'
  | 'changes_offered'
  | 'approved'
  | 'rejected'
  | 'superseded'
  | 'revoked';

export interface BuildRewardReviewProposalSummary {
  revision?: number;
  note?: string;
  // A new app name / thumbnail the offer applies on accept.
  title?: string | null;
  thumbnailUrl?: string | null;
  offeredAt?: number;
  changedFiles?: Array<{ path?: string; status?: string }>;
  diffSummary?: {
    total?: number;
    added?: number;
    updated?: number;
    deleted?: number;
  };
}

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
  // Approval publishes: the version that went live, once it did.
  publishedArtifactVersionId?: number | null;
  // The creator turned the reviewer's proposed changes down.
  declinedByCreator?: boolean;
  // The reviewer's proposed changes, while offered (and after, for history).
  proposal?: BuildRewardReviewProposalSummary | null;
  // Coin prices with their destinations (present only when the app charges).
  prices?: BuildCoinPriceSummary[];
  rules?: BuildRewardReviewRuleSummary[];
  budgets?: {
    userDailyXP?: number;
    userDailyCoins?: number;
  };
  createdAt?: number;
  reviewedAt?: number;
  eventTimeMs?: number;
}

const REVIEW_STATUSES: ReadonlySet<string> = new Set([
  'pending',
  'changes_offered',
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
  closedBySave = false,
  declinedByCreator = false
) {
  switch (status) {
    case 'changes_offered':
      return 'The admin suggested changes';
    case 'approved':
      return 'Reward release approved';
    case 'rejected':
      return declinedByCreator
        ? 'Reward review closed · changes declined'
        : 'Reward release declined';
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
    case 'changes_offered':
      return 'Waiting for the creator';
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

// The name and thumbnail an offer would actually change. One the app already
// has (the creator renamed to it after the offer) is no change.
export function getBuildRewardOfferedIdentity({
  proposedTitle,
  proposedThumbnailUrl,
  currentTitle,
  currentThumbnailUrl
}: {
  proposedTitle?: string | null;
  proposedThumbnailUrl?: string | null;
  currentTitle?: string | null;
  currentThumbnailUrl?: string | null;
}) {
  // Titles compare as the server does (normalizeSuggestedBuildTitle):
  // whitespace collapsed, case kept, so a case-only rename still shows.
  const normalizeTitle = (value?: string | null) =>
    String(value || '').replace(/\s+/g, ' ').trim();
  const title = normalizeTitle(proposedTitle);
  const thumbnailUrl = String(proposedThumbnailUrl || '').trim();
  return {
    title: title && title !== normalizeTitle(currentTitle) ? title : '',
    thumbnailUrl:
      thumbnailUrl && thumbnailUrl !== String(currentThumbnailUrl || '').trim()
        ? thumbnailUrl
        : ''
  };
}

// "3 files changed · 1 added" — the proposal chip on the card. Pass the app's
// current name and thumbnail so ones it already has are not counted.
export function formatBuildRewardProposalSummary(
  proposal?: BuildRewardReviewProposalSummary | null,
  current?: { title?: string | null; thumbnailUrl?: string | null }
) {
  const offered = getBuildRewardOfferedIdentity({
    proposedTitle: proposal?.title,
    proposedThumbnailUrl: proposal?.thumbnailUrl,
    currentTitle: current?.title,
    currentThumbnailUrl: current?.thumbnailUrl
  });
  const summary = proposal?.diffSummary || {};
  const total = Math.max(
    0,
    Math.floor(
      Number(summary.total ?? (proposal?.changedFiles || []).length) || 0
    )
  );
  const identity = [
    offered.title ? 'new name' : '',
    offered.thumbnailUrl ? 'new thumbnail' : ''
  ].filter(Boolean);
  if (total === 0) {
    if (!identity.length) return 'No file changes';
    const text = identity.join(' · ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  const parts = [
    `${total} ${total === 1 ? 'file' : 'files'} changed`,
    summary.added ? `${summary.added} added` : '',
    summary.deleted ? `${summary.deleted} removed` : '',
    ...identity
  ].filter(Boolean);
  return parts.join(' · ');
}

export interface BuildCoinPriceSummary {
  id: string;
  title: string;
  coins: number;
  destination: 'removed' | 'owner';
  offers?: { minCoins: number; maxCoins?: number };
  builders?: {
    coinsPerUnit: number;
    unitName?: string;
    maxUnitsPerRecipient?: number;
    maxRecipients?: number;
    maxCoinsPerPurchase?: number;
    tally?: { plotSize: number; keyFormat: string };
  };
}
// r2: what every builders price guarantees, in the words the review screen,
// the chat card and the CLI share (helpers/build/coinPrices.ts on the API).
export const COIN_TALLY_PLAIN_WORDS =
  "Builders are paid for the blocks Twinkle itself recorded as theirs inside the plot; the app can't change who or how many.";
// The builders' part of one purchase at most (platform ceilings when the
// summary leaves them out: 64 builders, 100,000 Coins).
function builderCeiling(builders: NonNullable<BuildCoinPriceSummary['builders']>) {
  const perPurchase = Math.min(builders.maxCoinsPerPurchase ?? 100_000, 100_000);
  if (!builders.maxUnitsPerRecipient) return perPurchase;
  return Math.min(
    perPurchase,
    builders.coinsPerUnit * builders.maxUnitsPerRecipient * (builders.maxRecipients ?? 64)
  );
}
// The approval message names where each price's Coins go (RULING 11-07):
// "Extra land plot — 500 Coins, removed". A price whose Coins can reach a
// person says so (round-2 review N3, N7): a 0-Coin builders price is not a
// "free claim", and a resold item pays the previous holder.
export function formatBuildCoinPriceLine(
  price: BuildCoinPriceSummary,
  ownerUsername?: string | null
) {
  const destination =
    price.coins <= 0
      ? price.builders
        ? 'no Coins of its own'
        : 'free claim'
      : price.destination === 'owner'
        ? `goes to ${ownerUsername || 'the app owner'}`
        : 'removed';
  const extras = [
    price.builders
      ? `plus ${formatAmount(price.builders.coinsPerUnit)} per ${price.builders.unitName || 'block'} Twinkle recorded for other builders inside the ${price.builders.tally ? `${price.builders.tally.plotSize}×${price.builders.tally.plotSize} ` : ''}plot, up to ${formatAmount(builderCeiling(price.builders))} a purchase`
      : '',
    price.offers
      ? `resales pay the previous holder, another player, up to ${price.offers.maxCoins !== undefined ? formatAmount(price.offers.maxCoins) : '?'} Coins`
      : ''
  ].filter(Boolean);
  return `${price.title} — ${formatAmount(price.coins)} Coins, ${destination}${extras.length ? ` (${extras.join('; ')})` : ''}`;
}
// The chat card's red line when any price pays a person: who, in plain words.
export function buildCoinPricePersonWarning(
  prices: BuildCoinPriceSummary[],
  ownerUsername?: string | null
) {
  const who = [
    prices.some((price) => price.destination === 'owner' && price.coins > 0)
      ? `${ownerUsername || 'the app owner'} (the owner)`
      : '',
    prices.some((price) => price.builders) ? 'the builders Twinkle recorded on the land' : '',
    prices.some((price) => price.offers) ? 'another player when an item is resold' : ''
  ].filter(Boolean);
  if (!who.length) return null;
  const tally = prices.some((price) => price.builders) ? ` ${COIN_TALLY_PLAIN_WORDS}` : '';
  return `Coins go to ${who.length > 1 ? `${who.slice(0, -1).join(', ')} and ${who[who.length - 1]}` : who[0]}.${tally} Approving needs a review note.`;
}

// The rules JSON the reviewer's editor starts from (review M5, 11-07): the
// request's config whenever it has earning rules or Coin prices (a
// prices-only app starts with its declared prices, so approving never needs
// them retyped), else the empty template.
export function initialReviewRulesText(
  config: { rules?: unknown[]; prices?: unknown[] } | null | undefined,
  emptyConfig: unknown
) {
  return JSON.stringify(
    config && (config.rules?.length || config.prices?.length) ? config : emptyConfig,
    null,
    2
  );
}
