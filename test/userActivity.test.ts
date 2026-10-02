import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyUserActivityEvent,
  createUserActivityRegistry,
  getNextUserActivityRefreshAt,
  USER_ACTIVITY_REFRESH_AFTER_MS,
  type UserActivity
} from '../src/helpers/userActivity';
import { applyPresenceSnapshot } from '../src/contexts/Chat/presenceSnapshot';

const app: UserActivity = {
  kind: 'app',
  id: 1,
  title: 'Math Lab',
  thumbnailUrl: '/cover.png'
};
const game: UserActivity = {
  kind: 'game',
  id: 'wordle',
  title: 'Wordle',
  thumbnailUrl: null
};

test('foreground games override an app, rankings suppress it, and closing restores the active app', () => {
  const registry = createUserActivityRegistry();
  const runtime = {};
  const modal = {};
  let notifications = 0;
  const unsubscribe = registry.subscribe(() => notifications++);
  registry.set(runtime, 7, app, 0);
  registry.set(modal, 7, game, 10);
  assert.equal(registry.get(7), game);
  registry.set(modal, 7, null, 10);
  assert.equal(registry.get(7), null);
  registry.remove(modal);
  assert.equal(registry.get(7), app);
  assert.equal(notifications, 4);
  unsubscribe();
  registry.remove(runtime);
  assert.equal(registry.get(7), null);
  assert.equal(notifications, 4);
});

test('changing routes and accounts never falls back to another account’s activity', () => {
  const registry = createUserActivityRegistry();
  const first = {};
  const next = {};
  registry.set(first, 7, app, 0);
  registry.set(next, 7, { kind: 'app', id: 2 }, 0);
  registry.remove(first);
  assert.deepEqual(registry.get(7), { kind: 'app', id: 2 });
  assert.equal(registry.get(8), null);
  registry.set({}, 8, game, 10);
  assert.deepEqual(registry.get(7), { kind: 'app', id: 2 });
  assert.equal(registry.get(8), game);
});

test('late server observations cannot restore a cleared or replaced badge', () => {
  const first = applyUserActivityEvent(
    { isOnline: true },
    { activity: app, observedAt: 100 },
    1000
  );
  const stopped = applyUserActivityEvent(
    first,
    { activity: null, observedAt: 120 },
    1020
  );
  assert.equal(
    applyUserActivityEvent(stopped, { activity: app, observedAt: 110 }, 1030),
    stopped
  );
  assert.equal(
    applyUserActivityEvent(stopped, { activity: app, observedAt: NaN }),
    stopped
  );
  assert.equal(stopped.activity, null);
});

test('an event during a snapshot survives while the snapshot still hydrates online presence', () => {
  const entry = applyUserActivityEvent(
    {},
    { activity: game, observedAt: 120 },
    1050
  );
  const next = applyPresenceSnapshot({
    chatStatus: { 7: entry },
    onlineUsers: {
      7: { id: 7, username: 'Player', activity: app, activityObservedAt: 100 }
    },
    requestedAt: 1000,
    reconcileOffline: true
  });
  assert.equal(next[7].activity, game);
  assert.equal(next[7].isOnline, true);
  assert.equal(next[7].username, 'Player');
  assert.equal(next[7].statusUpdatedAt, 1000);
});

test('newer snapshots refresh or clear badges; old server snapshots preserve known activity', () => {
  const entry = applyUserActivityEvent(
    { isOnline: true },
    { activity: app, observedAt: 100 },
    1000
  );
  const snapshot = (member: any) =>
    applyPresenceSnapshot({
      chatStatus: { 7: entry },
      onlineUsers: { 7: member },
      requestedAt: 2000,
      reconcileOffline: true
    })[7];
  assert.equal(snapshot({ id: 7 }).activity, app);
  assert.equal(
    snapshot({ id: 7, activity: game, activityObservedAt: 90 }).activity,
    app
  );
  assert.equal(
    snapshot({ id: 7, activity: game, activityObservedAt: 200 }).activity,
    game
  );
  assert.equal(
    snapshot({ id: 7, activity: null, activityObservedAt: 200 }).activity,
    null
  );
  const offline = applyPresenceSnapshot({
    chatStatus: { 7: entry },
    onlineUsers: {},
    requestedAt: 2000,
    reconcileOffline: true
  });
  assert.equal(offline[7].isOnline, false);
  assert.equal(offline[7].activity, null);
});

test('presence changes cannot block a snapshot from clearing an older activity', () => {
  const previous = {
    ...applyUserActivityEvent(
      { id: 7, isOnline: true, isBusy: false },
      { activity: app, observedAt: 100 },
      1000
    ),
    isBusy: true,
    statusUpdatedAt: 1100
  };
  const next = applyPresenceSnapshot({
    chatStatus: { 7: previous },
    onlineUsers: {
      7: { id: 7, isBusy: false, activity: null, activityObservedAt: 200 }
    },
    requestedAt: 1050,
    reconcileOffline: true
  })[7];
  assert.equal(next.activity, null);
  assert.equal(next.isBusy, true);
  assert.equal(next.statusUpdatedAt, 1100);
});

test('a snapshot preserves a newer activity even when presence also changed', () => {
  const previous = {
    ...applyUserActivityEvent(
      { id: 7, isOnline: true, isAway: true },
      { activity: game, observedAt: 200 },
      1100
    ),
    statusUpdatedAt: 1100
  };
  const next = applyPresenceSnapshot({
    chatStatus: { 7: previous },
    onlineUsers: {
      7: { id: 7, isAway: false, activity: null, activityObservedAt: 100 }
    },
    requestedAt: 1050,
    reconcileOffline: true
  })[7];
  assert.equal(next.activity, game);
  assert.equal(next.isAway, true);
});

test('a snapshot cannot restore an activity after a newer offline event', () => {
  const previous = {
    id: 7,
    isOnline: false,
    activity: null,
    statusUpdatedAt: 1100
  };
  const next = applyPresenceSnapshot({
    chatStatus: { 7: previous },
    onlineUsers: { 7: { id: 7, activity: app, activityObservedAt: 100 } },
    requestedAt: 1050,
    reconcileOffline: true
  })[7];
  assert.equal(next, previous);
});

test('activity refresh targets the oldest online activity and moves with fresh canonical data', () => {
  const chatStatus = {
    7: { isOnline: true, activity: app, activityUpdatedAt: 1000 },
    8: { isOnline: true, activity: game, activityUpdatedAt: 2000 },
    9: { isOnline: false, activity: app, activityUpdatedAt: 1 }
  };
  assert.equal(
    getNextUserActivityRefreshAt(chatStatus),
    1000 + USER_ACTIVITY_REFRESH_AFTER_MS
  );
  assert.equal(
    getNextUserActivityRefreshAt({
      ...chatStatus,
      7: { ...chatStatus[7], activity: null }
    }),
    2000 + USER_ACTIVITY_REFRESH_AFTER_MS
  );
  assert.equal(
    getNextUserActivityRefreshAt({ 7: { isOnline: true, activity: app } }),
    1
  );
  assert.equal(
    getNextUserActivityRefreshAt({ 7: { isOnline: false, activity: app } }),
    0
  );
  assert.equal(
    getNextUserActivityRefreshAt({ 7: { isOnline: true, activity: null } }),
    0
  );
});
