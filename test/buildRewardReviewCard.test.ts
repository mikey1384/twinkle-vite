import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatBuildRewardRulesSummary,
  getBuildRewardReviewBannerText,
  getBuildRewardReviewManagementPath,
  getBuildRewardReviewStatusLabel,
  normalizeBuildRewardReviewStatus,
  parseBuildRewardReviewFocusId,
  summarizeBuildRewardRules
} from '../src/helpers/buildRewardReviewCard';

test('rule summary reports the count and the largest per-rule amounts', () => {
  assert.deepEqual(
    summarizeBuildRewardRules([
      { id: 'a', title: 'A', xp: 100, coins: 5 },
      { id: 'b', title: 'B', xp: 2500, coins: 0 },
      { id: 'c', title: 'C', xp: 0, coins: 40 }
    ]),
    { ruleCount: 3, maxXP: 2500, maxCoins: 40 }
  );
  assert.equal(
    formatBuildRewardRulesSummary([
      { id: 'a', title: 'A', xp: 100, coins: 5 },
      { id: 'b', title: 'B', xp: 2500, coins: 0 },
      { id: 'c', title: 'C', xp: 0, coins: 40 }
    ]),
    '3 rules · up to 2,500 XP & 40 Coins each'
  );
  assert.equal(
    formatBuildRewardRulesSummary([{ id: 'a', title: 'A', xp: 10, coins: 0 }]),
    '1 rule · up to 10 XP each'
  );
  assert.equal(
    formatBuildRewardRulesSummary([{ id: 'a', title: 'A', coins: 3 }]),
    '1 rule · up to 3 Coins each'
  );
});

test('missing or malformed rules never produce NaN or crash the card', () => {
  assert.equal(formatBuildRewardRulesSummary(undefined), 'No earning rules');
  assert.equal(formatBuildRewardRulesSummary([]), 'No earning rules');
  assert.deepEqual(
    summarizeBuildRewardRules([
      { xp: 'lots' as unknown as number, coins: null },
      {} as any
    ]),
    { ruleCount: 2, maxXP: 0, maxCoins: 0 }
  );
  assert.equal(
    formatBuildRewardRulesSummary([{ xp: -5, coins: NaN }]),
    '1 rule'
  );
});

test('status is normalized to the review states the server records', () => {
  for (const status of [
    'pending',
    'approved',
    'rejected',
    'superseded',
    'revoked'
  ]) {
    assert.equal(normalizeBuildRewardReviewStatus(status), status);
  }
  assert.equal(normalizeBuildRewardReviewStatus(undefined), 'pending');
  assert.equal(normalizeBuildRewardReviewStatus('APPROVED'), 'pending');
  assert.equal(
    getBuildRewardReviewBannerText('pending'),
    'Sent for XP & Coin reward review'
  );
  assert.equal(getBuildRewardReviewStatusLabel('pending'), 'Waiting for review');
  assert.equal(getBuildRewardReviewStatusLabel('approved'), 'Approved');
  assert.equal(getBuildRewardReviewStatusLabel('rejected'), 'Declined');
  assert.equal(getBuildRewardReviewStatusLabel('superseded'), 'Superseded');
  assert.equal(getBuildRewardReviewStatusLabel('revoked'), 'Revoked');
});

test('the card deep-links to the Management approvals panel on that review', () => {
  assert.equal(
    getBuildRewardReviewManagementPath(42),
    '/management?rewardReview=42'
  );
  assert.equal(getBuildRewardReviewManagementPath(0), '/management');
  assert.equal(parseBuildRewardReviewFocusId('?rewardReview=42'), 42);
  assert.equal(parseBuildRewardReviewFocusId('?rewardReview=abc'), 0);
  assert.equal(parseBuildRewardReviewFocusId(''), 0);
});
