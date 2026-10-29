import assert from 'node:assert/strict';
import test from 'node:test';
import { isInterestOnlyTrade } from '../src/containers/Chat/Trade/helpers/terms';
import { getTradeStatus } from '../src/containers/Chat/Trade/helpers/status';

test('interest classification uses all offered asset IDs even before hydration', () => {
  const empty = { coins: 0, cardIds: [], groupIds: [], buildIds: [] };
  assert.equal(isInterestOnlyTrade({ type: 'trade', offer: empty }), true);
  for (const offer of [
    { ...empty, coins: 1 },
    { ...empty, cardIds: [12] },
    { ...empty, groupIds: [34] },
    { ...empty, buildIds: [56] }
  ])
    assert.equal(isInterestOnlyTrade({ type: 'trade', offer }), false);
  assert.equal(isInterestOnlyTrade({ type: 'show', offer: empty }), false);
  assert.equal(isInterestOnlyTrade({ type: 'send', offer: empty }), false);
});

test('both viewers and earlier interest retain their meaning; completed receipts stay completed', () => {
  const transaction = { type: 'trade', from: 1, to: 2, offer: {} };
  for (const viewerId of [1, 2]) {
    const input = {
      transaction,
      viewerId,
      isAccepted: false,
      isCancelled: false,
      isCurrent: false
    };
    assert.equal(getTradeStatus(input).label, 'Interest shown');
    const completed = getTradeStatus({ ...input, isAccepted: true });
    assert.equal(completed.label, 'Trade completed');
    assert.equal(completed.requestOnly, false);
  }
});
