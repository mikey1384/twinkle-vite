import assert from 'node:assert/strict';
import test from 'node:test';
import NotiReducer from '../src/contexts/Notification/reducer';

// 10-12: an old tab crashed the header (App/Header "can't access property
// length, achievedDailyGoals is undefined") after a Today Stats update left
// the list undefined. The store keeps it a list whatever an update carries.
function stateWithGoals(goals: unknown) {
  return { todayStats: { achievedDailyGoals: goals, aiUsagePolicy: null } } as any;
}

for (const type of ['UPDATE_TODAY_STATS', 'APPLY_TODAY_STATS_PROGRESS', 'HYDRATE_TODAY_STATS']) {
  test(`${type}: an undefined or null list keeps the one already stored`, () => {
    const key = type === 'HYDRATE_TODAY_STATS' ? 'todayStats' : 'newStats';
    for (const bad of [undefined, null, 'W']) {
      const next = NotiReducer(stateWithGoals(['W', 'G']), {
        type,
        [key]: { achievedDailyGoals: bad, xpEarned: 5 }
      } as any);
      assert.deepEqual(next.todayStats.achievedDailyGoals, ['W', 'G']);
      assert.equal(next.todayStats.xpEarned, 5);
    }
    const fromNothing = NotiReducer(stateWithGoals(undefined), {
      type,
      [key]: { achievedDailyGoals: undefined }
    } as any);
    assert.deepEqual(fromNothing.todayStats.achievedDailyGoals, []);
  });
}

test('a real list still replaces the stored one', () => {
  const next = NotiReducer(stateWithGoals(['W']), {
    type: 'UPDATE_TODAY_STATS',
    newStats: { achievedDailyGoals: ['W', 'G', 'A'] }
  } as any);
  assert.deepEqual(next.todayStats.achievedDailyGoals, ['W', 'G', 'A']);
});

test('an update without the key leaves the list alone', () => {
  const next = NotiReducer(stateWithGoals(['A']), {
    type: 'UPDATE_TODAY_STATS',
    newStats: { xpEarned: 1 }
  } as any);
  assert.deepEqual(next.todayStats.achievedDailyGoals, ['A']);
});
