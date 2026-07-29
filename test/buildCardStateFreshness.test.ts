import assert from 'node:assert/strict';
import test from 'node:test';
import { isCachedCardStateFresher } from '../src/helpers/buildCardState';

const HYDRATED_AT = 2_000_000;

test('an action this tab just took wins over an older hydration', () => {
  assert.equal(
    isCachedCardStateFresher(
      { __eventTime: HYDRATED_AT + 1_000 },
      { eventTimeMs: HYDRATED_AT }
    ),
    true
  );
});

test('a fresh hydration wins over a stale cached action', () => {
  // The case that made a brand new submission render as already merged: the
  // owner merged an earlier card, the contributor saved again and sent another,
  // and the branch-keyed cache entry outlived the submission it described.
  assert.equal(
    isCachedCardStateFresher(
      { __eventTime: HYDRATED_AT - 60_000 },
      { eventTimeMs: HYDRATED_AT }
    ),
    false
  );
});

test('no cached entry never overrides anything', () => {
  assert.equal(isCachedCardStateFresher(null, { eventTimeMs: HYDRATED_AT }), false);
  assert.equal(
    isCachedCardStateFresher(undefined, { eventTimeMs: HYDRATED_AT }),
    false
  );
  assert.equal(isCachedCardStateFresher({}, { eventTimeMs: HYDRATED_AT }), false);
});

test('an unstamped payload cannot claim to be newer', () => {
  assert.equal(isCachedCardStateFresher({ __eventTime: 1 }, {}), true);
  assert.equal(isCachedCardStateFresher({ __eventTime: 1 }, null), true);
});

test('a simultaneous stamp resolves to the cached action', () => {
  // Equal stamps mean the action and the read describe the same moment; the
  // action is the one that knows what the user just did.
  assert.equal(
    isCachedCardStateFresher(
      { __eventTime: HYDRATED_AT },
      { eventTimeMs: HYDRATED_AT }
    ),
    true
  );
});
