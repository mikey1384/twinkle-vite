import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyUserActivityEvent,
  createUserActivityRegistry,
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
