import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyPresenceSnapshot,
  stampPresenceEntry
} from '../src/contexts/Chat/presenceSnapshot';

const online = (id: number, extra: Record<string, any> = {}) => ({
  id,
  username: `user${id}`,
  profilePicUrl: '',
  isOnline: true,
  isAway: false,
  isBusy: false,
  ...extra
});

// A request emitted "now"; entries stamped after it represent presence events
// that landed while the snapshot was in flight.
const REQUESTED_AT = 1_000_000;
const stampedAfterRequest = (entry: Record<string, any>) => ({
  ...entry,
  statusUpdatedAt: REQUESTED_AT + 500
});
const stampedBeforeRequest = (entry: Record<string, any>) => ({
  ...entry,
  statusUpdatedAt: REQUESTED_AT - 500
});

test('complete snapshot flips users it no longer lists to offline', () => {
  // 11 went offline while this tab was disconnected, so no online_status_changed
  // arrived for them; the reconnect snapshot is the only evidence.
  const chatStatus = {
    10: online(10),
    11: online(11),
    12: { ...online(12), isOnline: false, lastActive: 1_784_000_000 }
  };

  const next = applyPresenceSnapshot({
    chatStatus,
    onlineUsers: { 10: online(10) },
    requestedAt: REQUESTED_AT,
    reconcileOffline: true
  });

  assert.equal(next[10].isOnline, true);
  assert.equal(next[11].isOnline, false);
  assert.equal(next[12].isOnline, false);
  // The snapshot carries no timestamp, so it must not invent one.
  assert.equal(next[11].lastActive, undefined);
  assert.equal(next[12].lastActive, 1_784_000_000);
  // Reconciling must not mutate the previous map.
  assert.equal(chatStatus[11].isOnline, true);
});

test('incomplete snapshot never marks anyone offline', () => {
  const next = applyPresenceSnapshot({
    chatStatus: { 10: online(10), 11: online(11) },
    onlineUsers: {},
    requestedAt: REQUESTED_AT,
    reconcileOffline: false
  });

  assert.equal(next[10].isOnline, true);
  assert.equal(next[11].isOnline, true);
});

test('a user who came online while the snapshot was in flight stays online', () => {
  // The snapshot was taken before 11 connected, but their
  // online_status_changed beat the ack back to this tab.
  const next = applyPresenceSnapshot({
    chatStatus: {
      10: stampedBeforeRequest(online(10)),
      11: stampedAfterRequest(online(11))
    },
    onlineUsers: { 10: online(10) },
    requestedAt: REQUESTED_AT,
    reconcileOffline: true
  });

  assert.equal(next[11].isOnline, true);
  assert.equal(next[10].isOnline, true);
});

test('a user who went offline while the snapshot was in flight stays offline', () => {
  // Mirror case: the snapshot still lists 11 as online, but their offline
  // event already landed. The snapshot must not resurrect them.
  const next = applyPresenceSnapshot({
    chatStatus: {
      11: stampedAfterRequest({ ...online(11), isOnline: false })
    },
    onlineUsers: { 11: online(11) },
    requestedAt: REQUESTED_AT,
    reconcileOffline: true
  });

  assert.equal(next[11].isOnline, false);
});

test('stamped-before-request entries are still reconciled', () => {
  const next = applyPresenceSnapshot({
    chatStatus: { 11: stampedBeforeRequest(online(11)) },
    onlineUsers: {},
    requestedAt: REQUESTED_AT,
    reconcileOffline: true
  });

  assert.equal(next[11].isOnline, false);
});

test('stampPresenceEntry marks an entry as newer than an earlier request', () => {
  const before = Date.now();
  const stamped = stampPresenceEntry(online(10));
  assert.ok(stamped.statusUpdatedAt >= before);

  const next = applyPresenceSnapshot({
    chatStatus: { 10: stamped },
    onlineUsers: {},
    requestedAt: before - 1,
    reconcileOffline: true
  });
  assert.equal(next[10].isOnline, true);
});

test('snapshot still merges member data and away/busy flags', () => {
  const next = applyPresenceSnapshot({
    chatStatus: { 10: { ...online(10), isAway: true } },
    onlineUsers: {
      10: online(10, { isBusy: true, profilePicUrl: '/pic.png' }),
      13: online(13)
    },
    requestedAt: REQUESTED_AT,
    reconcileOffline: true
  });

  assert.equal(next[10].isBusy, true);
  assert.equal(next[10].isAway, false);
  assert.equal(next[10].profilePicUrl, '/pic.png');
  assert.equal(next[13].isOnline, true);
});

test('a snapshot keeps away/busy flags it does not restate', () => {
  const next = applyPresenceSnapshot({
    chatStatus: { 10: { ...online(10), isAway: true, isBusy: true } },
    onlineUsers: { 10: { id: 10, username: 'user10' } },
    requestedAt: REQUESTED_AT,
    reconcileOffline: true
  });

  assert.equal(next[10].isAway, true);
  assert.equal(next[10].isBusy, true);
});

test('the channel scoped snapshot never flips absent users offline', () => {
  // check_online_users covers one channel's members only, so absence from it is
  // not evidence of being offline.
  const next = applyPresenceSnapshot({
    chatStatus: { 10: online(10), 11: online(11) },
    onlineUsers: { 10: online(10) },
    requestedAt: REQUESTED_AT,
    reconcileOffline: false
  });

  assert.equal(next[10].isOnline, true);
  assert.equal(next[11].isOnline, true);
});

// Two snapshots in flight at once is the ordinary case now: binding the socket
// asks for app-wide presence while opening a channel asks for that channel's.
// Whichever reply arrives second must not be allowed to undo the newer one just
// because it is slower.
test('an older snapshot cannot overwrite what a newer snapshot applied', () => {
  const newerRequestedAt = REQUESTED_AT + 5_000;
  // The newer, app-wide snapshot lands first and reconciles user 2 offline.
  const afterNewer = applyPresenceSnapshot({
    chatStatus: { 2: online(2) },
    onlineUsers: { 1: online(1) },
    requestedAt: newerRequestedAt,
    reconcileOffline: true
  });
  assert.equal(afterNewer[1].isOnline, true);
  assert.equal(afterNewer[2].isOnline, false);

  // The older, channel-scoped snapshot arrives late still believing user 2 is
  // online. It was asked for first, so it loses.
  const afterOlder = applyPresenceSnapshot({
    chatStatus: afterNewer,
    onlineUsers: { 2: online(2) },
    requestedAt: REQUESTED_AT,
    reconcileOffline: false
  });
  assert.equal(
    afterOlder[2].isOnline,
    false,
    'a stale snapshot resurrected a user the newer one reconciled offline'
  );
});

test('an older snapshot cannot mark someone offline that a newer one just saw', () => {
  const newerRequestedAt = REQUESTED_AT + 5_000;
  const afterNewer = applyPresenceSnapshot({
    chatStatus: {},
    onlineUsers: { 7: online(7) },
    requestedAt: newerRequestedAt,
    reconcileOffline: false
  });
  assert.equal(afterNewer[7].isOnline, true);

  const afterOlder = applyPresenceSnapshot({
    chatStatus: afterNewer,
    onlineUsers: {},
    requestedAt: REQUESTED_AT,
    reconcileOffline: true
  });
  assert.equal(
    afterOlder[7].isOnline,
    true,
    'a stale complete snapshot marked a freshly-seen user offline'
  );
});

test('a genuinely newer snapshot still wins', () => {
  const first = applyPresenceSnapshot({
    chatStatus: {},
    onlineUsers: { 9: online(9) },
    requestedAt: REQUESTED_AT,
    reconcileOffline: false
  });
  const second = applyPresenceSnapshot({
    chatStatus: first,
    onlineUsers: {},
    requestedAt: REQUESTED_AT + 5_000,
    reconcileOffline: true
  });
  assert.equal(second[9].isOnline, false);
});

test('a socket event still outranks a snapshot that was asked for earlier', () => {
  const withEvent = {
    4: stampPresenceEntry(online(4))
  };
  const applied = applyPresenceSnapshot({
    chatStatus: withEvent,
    onlineUsers: {},
    requestedAt: 1,
    reconcileOffline: true
  });
  assert.equal(applied[4].isOnline, true);
});
