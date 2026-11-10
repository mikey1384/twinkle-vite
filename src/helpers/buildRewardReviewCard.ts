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
  // Server-held land (Twinkle.land) approved with the prices.
  land?: BuildLandSummary | null;
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
// r2: what Twinkle counts for a builders price and what it cannot know, in
// the words the review screen, the chat card and the CLI share
// (COIN_TALLY_PLAIN_WORDS in helpers/build/coinPrices.ts on the API;
// review-r2 M5, with Mikey's 11-07 credit rule).
export const COIN_TALLY_PLAIN_WORDS =
  "Builders are paid from Twinkle's record of who placed each block. Each player's copy of the app reports only that player's own blocks, under their own sign-in, so the app can't name anyone else; but Twinkle does not see the world, so it cannot tell whether a recorded block is really there. A block stays credited to the player who placed it when someone else breaks or builds over it; the credit ends only when that player removes it, or when a plot containing it is sold (so the same builders are never paid twice).";
// Twinkle.land (11-08): builders are paid from the block changes Twinkle
// accepted, so the words change when the app declares land
// (LAND_TALLY_PLAIN_WORDS / LAND_TALLY_REMAINING_RISK in
// helpers/build/landPolicy.ts on the API).
// The API's words (helpers/build/landPolicy.ts), review L3: only a purchase
// from Twinkle uses credit up; the daily cap is said once.
export const LAND_TALLY_PLAIN_WORDS =
  "Builders are paid from Twinkle's record of who placed each block in this app's world. A block stays credited to the player who placed it when someone else breaks or builds over it. The credit ends when that player removes it, or when a plot containing it is bought from Twinkle (then those builders are paid, once); a Sell, a takeover or a grant does not use it up. A player earns credit for at most 20,000 new blocks a day.";
export const LAND_TALLY_REMAINING_RISK =
  "Remaining risk: a block someone else broke stays paid until a plot containing it is bought from Twinkle, so a buyer may pay for a block that is gone (Mikey's rule).";

// summarizeCoinPrices().land on the API.
export interface BuildLandSummary {
  keyGroup: string;
  plotSize: number;
  keyFormat: string;
  regions: string[];
  freeRegions?: string[];
  reserved?: Array<{ x: number; z: number; radius: number; region?: string; why?: string }>;
  switches?: Array<{ name: string; cause: string; values: number[] }>;
  empty?: number[];
  locked?: LandZoneArea[];
  resettable?: Array<LandZoneArea & { id: string; cooldownSeconds?: number }>;
  text?: string;
}
interface LandZoneArea {
  region: string;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  why: string;
  allowCauses?: string[];
}
// The chat card's one land line: short; the review screen has the rest.
// Review L3: a switch lets anyone set blocks in the plot to its values.
// Land zones (11-10): one short count of locked and resettable areas.
export function formatBuildLandLine(land: BuildLandSummary) {
  const worlds = land.regions.length;
  const switches = (land.switches || []).map((entry) => entry.name);
  const count = (n: number, word: string) => `${n} ${word} ${n === 1 ? 'area' : 'areas'}`;
  const zones = [
    land.locked?.length ? `${count(land.locked.length, 'locked')} nobody can change` : '',
    land.resettable?.length ? `${count(land.resettable.length, 'resettable')} any player can put back` : ''
  ].filter(Boolean);
  return `Land in ${worlds} ${worlds === 1 ? 'world' : 'worlds'}: inside a ${land.plotSize}×${land.plotSize} plot someone holds, only they and the players they allow can change blocks${
    switches.length ? `; turning on ${switches.join(' or ')} lets anyone set blocks there to ${switches.length === 1 ? 'its values' : 'their values'}` : ''
  }.${zones.length ? ` ${zones.join('; ')}.` : ''}`;
}
// Land zones in plain words (landZoneText on the API: the same words).
const LAND_RESET_COOLDOWN_SECONDS = 30;
export function landZoneText(land: { locked?: LandZoneArea[]; resettable?: Array<LandZoneArea & { id: string; cooldownSeconds?: number }> }) {
  const locked = land.locked || [];
  const resettable = land.resettable || [];
  const rect = (area: LandZoneArea) => `x ${area.x0}..${area.x1}, z ${area.z0}..${area.z1}`;
  const place = (area: LandZoneArea) => `${area.why} (${area.region}, ${rect(area)})`;
  const lockedWords = locked.length
    ? ` Locked: nobody can change blocks in ${locked
        .map((area) => `${place(area)}${area.allowCauses?.length ? `, except ${area.allowCauses.join('/')}` : ''}`)
        .join('; ')}.`
    : '';
  const cooldownOf = (area: { cooldownSeconds?: number }) => area.cooldownSeconds ?? LAND_RESET_COOLDOWN_SECONDS;
  const cooldowns = Array.from(new Set(resettable.map(cooldownOf)));
  const same = cooldowns.length === 1;
  const resetWords = resettable.length
    ? ` Resettable: any signed-in player can put ${resettable
        .map((area) => `${place(area)}${same ? '' : `, at most once every ${cooldownOf(area)} seconds`}`)
        .join('; ')} back the way the world made ${resettable.length === 1 ? 'it' : 'them'}${
        same ? `, at most once every ${cooldowns[0]} seconds${resettable.length === 1 ? '' : ' each'}` : ''
      }; anything built there is removed.`
    : '';
  return `${lockedWords}${resetWords}`;
}
// The review sentence (landReviewText on the API), for a declaration the
// server has not summarized (the same words).
export function landReviewText(land: {
  keyGroup: string;
  plotSize: number;
  keyFormat: string;
  regions: string[];
  freeRegions?: string[];
  reserved?: Array<{ x: number; z: number; radius: number; region?: string; why?: string }>;
  switches?: Record<string, { values?: number[] }> | Array<{ name: string; values?: number[] }>;
  locked?: LandZoneArea[];
  resettable?: Array<LandZoneArea & { id: string; cooldownSeconds?: number }>;
}) {
  const switches = Array.isArray(land.switches)
    ? land.switches.map((entry) => ({ name: entry.name, values: entry.values || [] }))
    : Object.entries(land.switches || {}).map(([name, entry]) => ({ name, values: entry?.values || [] }));
  const reserved = (land.reserved || []).map(
    (spot) =>
      `within ${spot.radius} blocks of ${spot.why ? `${spot.why} ` : ''}(${spot.x}, ${spot.z})${spot.region ? ` in ${spot.region}` : ''}`
  );
  const size = `${land.plotSize}×${land.plotSize}`;
  const free = land.freeRegions || [];
  const switchWords = switches.length
    ? ` When the holder turns on ${switches.map((entry) => entry.name).join(' or ')}, anyone, guests too, may set any block in the plot to ${switches
        .map((entry) => `${entry.name} ${entry.values.join('/')}`)
        .join(', ')}.`
    : '';
  return `Land. Twinkle holds the land in these worlds: ${land.regions.join(', ')}${
    free.length ? `; players also build in ${free.join(', ')} (no plots)` : ''
  }. Inside a plot someone holds, Twinkle refuses block changes from anyone except its holder and the players they allow (only me / friends / everyone).${switchWords} Plots are ${size}, full height, named by their ${
    land.keyFormat === 'region:cx:cz' ? 'grid square' : 'corner'
  } (key group "${land.keyGroup}").${reserved.length ? ` No plots ${reserved.join('; ')}.` : ''}${landZoneText(land)}`;
}
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
      ? `plus ${formatAmount(price.builders.coinsPerUnit)} per ${price.builders.unitName || 'block'} credited to other players in Twinkle's record inside the ${price.builders.tally ? `${price.builders.tally.plotSize}×${price.builders.tally.plotSize} ` : ''}plot, up to ${formatAmount(builderCeiling(price.builders))} a purchase`
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
  ownerUsername?: string | null,
  land?: BuildLandSummary | null
) {
  const who = [
    prices.some((price) => price.destination === 'owner' && price.coins > 0)
      ? `${ownerUsername || 'the app owner'} (the owner)`
      : '',
    prices.some((price) => price.builders) ? "the builders in Twinkle's block record for the land" : '',
    prices.some((price) => price.offers) ? 'another player when an item is resold' : ''
  ].filter(Boolean);
  if (!who.length) return null;
  // review-r2 M5: the chat card also says what can go wrong and who fixes it.
  const tally = prices.some((price) => price.builders)
    ? land
      ? ` ${LAND_TALLY_PLAIN_WORDS} ${LAND_TALLY_REMAINING_RISK}`
      : ` ${COIN_TALLY_PLAIN_WORDS} A player can record blocks that aren't there (only the admin can clear them, with lumine admin coins tally-clear).`
    : '';
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
