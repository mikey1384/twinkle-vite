import test from 'node:test';
import assert from 'node:assert/strict';
import { getConfirmedAnalyticsUserId } from '../src/helpers/analyticsIdentity';

test('never treats a completed session attempt as canonical confirmation', () => {
  assert.equal(
    getConfirmedAnalyticsUserId({
      confirmedUserId: null,
      currentUserId: 42,
      sessionLoaded: true
    }),
    null
  );
});

test('syncs analytics only for the matching server-confirmed user', () => {
  assert.equal(
    getConfirmedAnalyticsUserId({
      confirmedUserId: 42,
      currentUserId: 42,
      sessionLoaded: true
    }),
    42
  );
  assert.equal(
    getConfirmedAnalyticsUserId({
      confirmedUserId: 42,
      currentUserId: 99,
      sessionLoaded: true
    }),
    null
  );
  assert.equal(
    getConfirmedAnalyticsUserId({
      confirmedUserId: 42,
      currentUserId: 42,
      sessionLoaded: false
    }),
    null
  );
});
