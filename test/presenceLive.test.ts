import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { applyPresenceSnapshot } from '../src/contexts/Chat/presenceSnapshot';
import {
  bindSupportsPresenceLive,
  createResyncGapGuard,
  planPresenceResyncSnapshot,
  PRESENCE_LIVE_EVENT,
  PRESENCE_RESYNC_EVENT,
  PRESENCE_RESYNC_SNAPSHOT_EVENT
} from '../src/helpers/presenceLive';

const socketInitSource = readFileSync(
  new URL(
    '../src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts',
    import.meta.url
  ),
  'utf8'
);

function slice(startMarker: string, endMarker: string) {
  const start = socketInitSource.indexOf(startMarker);
  const end = socketInitSource.indexOf(endMarker, start + startMarker.length);
  assert.ok(start > 0 && end > start, `${startMarker} .. ${endMarker}`);
  return socketInitSource.slice(start, end);
}

test('event names match the server protocol', () => {
  assert.equal(PRESENCE_LIVE_EVENT, 'set_presence_live');
  assert.equal(PRESENCE_RESYNC_EVENT, 'presence_resync_required');
  assert.equal(PRESENCE_RESYNC_SNAPSHOT_EVENT, 'presence_resync_snapshot');
});

test('the website only pauses with an API that advertises it', () => {
  assert.equal(bindSupportsPresenceLive({ presenceLive: 1 }), true);
  assert.equal(bindSupportsPresenceLive({ presenceQualified: true }), false);
  assert.equal(bindSupportsPresenceLive(undefined), false);
});

test('resync snapshot plan: only the latest notice, for this bound user, stamped at the notice', () => {
  const pending = { id: 3, at: 5_000 };
  const base = { pending, userId: 42, socketBound: true };
  const payload = {
    resyncId: 3,
    userId: 42,
    onlineUsers: { 7: { id: 7 } },
    isComplete: true,
    recentOfflineUsers: [{ id: 9, lastActive: 100 }]
  };
  assert.deepEqual(planPresenceResyncSnapshot({ ...base, payload }), {
    action: 'apply',
    requestedAt: 5_000,
    onlineUsers: payload.onlineUsers,
    isComplete: true,
    recentOfflineUsers: payload.recentOfflineUsers
  });
  for (const ignored of [
    { ...base, payload: { ...payload, resyncId: 2 } },
    { ...base, payload: { ...payload, userId: 43 } },
    { ...base, pending: null, payload },
    { ...base, socketBound: false, payload }
  ]) {
    assert.deepEqual(planPresenceResyncSnapshot(ignored), { action: 'ignore' });
  }
  assert.deepEqual(
    planPresenceResyncSnapshot({
      ...base,
      payload: { resyncId: 3, userId: 42, retry: true }
    }),
    { action: 'read' }
  );
  const noOffline = planPresenceResyncSnapshot({
    ...base,
    payload: { ...payload, recentOfflineUsers: undefined, isComplete: false }
  });
  assert.equal(noOffline.action, 'apply');
  assert.equal((noOffline as any).isComplete, false);
  assert.equal('recentOfflineUsers' in noOffline, false);
});

test('the page reports visibility on every change and on every bind, if supported', () => {
  const visibilitySource = slice(
    '// Inform server of away/visible status',
    '// The listeners intentionally own one mount-lifetime timer'
  );
  assert.match(
    visibilitySource,
    /const live = isPresencePageLive\(\);\s*if \(presenceLiveSupportedRef\.current\) \{\s*socket\.emit\(PRESENCE_LIVE_EVENT, live\);/
  );
  // Blur still reports away but no longer stops the heartbeat: a visible,
  // unfocused window must not look frozen to the server.
  const blurred = visibilitySource.match(
    /const emitBlurred = \(\) => \{[\s\S]*?\};/
  )?.[0];
  assert.ok(blurred);
  assert.match(blurred, /change_away_status', false/);
  assert.doesNotMatch(blurred, /stopUserHeartbeat|PRESENCE_LIVE_EVENT/);
  assert.match(visibilitySource, /addEventListener\('blur', emitBlurred\)/);
  assert.match(visibilitySource, /removeEventListener\('blur', emitBlurred\)/);
  assert.doesNotMatch(visibilitySource, /'blur', emitHidden/);

  const bindSource = slice(
    'function bindSocketToUser',
    'function hydrateOnlinePresence'
  );
  assert.match(
    bindSource,
    /presenceLiveSupportedRef\.current = bindSupportsPresenceLive\(result\);\s*if \(presenceLiveSupportedRef\.current\) \{\s*socket\.emit\(PRESENCE_LIVE_EVENT, isPresencePageLive\(\)\);[\s\S]*?hydrateOnlinePresence\(bindingUserId\)/
  );
  // Every set_presence_live emit is gated by the advertised capability.
  const emits = [...socketInitSource.matchAll(/socket\.emit\(PRESENCE_LIVE_EVENT/g)];
  assert.equal(emits.length, 2);
  assert.match(
    slice('function handleDisconnect(reason: string)', 'markSocketTransportGap(true)'),
    /presenceLiveSupportedRef\.current = false;\s*presenceResyncRef\.current = null;/
  );
});

test('a resync applies the batched snapshot like a reconnect: presence plus recent offline', () => {
  assert.match(socketInitSource, /socket\.on\(PRESENCE_RESYNC_EVENT, handlePresenceResync\)/);
  assert.match(socketInitSource, /socket\.off\(PRESENCE_RESYNC_EVENT, handlePresenceResync\)/);
  assert.match(
    socketInitSource,
    /socket\.on\(PRESENCE_RESYNC_SNAPSHOT_EVENT, handlePresenceResyncSnapshot\)/
  );
  assert.match(
    socketInitSource,
    /socket\.off\(PRESENCE_RESYNC_SNAPSHOT_EVENT, handlePresenceResyncSnapshot\)/
  );
  const handler = slice(
    'function handlePresenceResync(',
    'function handleRearmUserActionCapture'
  );
  assert.match(handler, /presenceResyncRef\.current = resyncId\s*\?\s*\{ id: resyncId, at: Date\.now\(\) \}/);
  assert.match(
    handler,
    /plan\.action === 'read'\) \{\s*hydrateOnlinePresence\(bindingUserId\);/
  );
  assert.match(
    handler,
    /onSetOnlinePresenceSnapshot\(\{[\s\S]*?requestedAt: plan\.requestedAt[\s\S]*?onSetOnlineUsers\(\{[\s\S]*?recentOfflineUsers: plan\.recentOfflineUsers/
  );
});

test('the resync snapshot repairs everything a paused page missed', () => {
  // While paused this page missed: 11 going offline, 12 coming online, and 13
  // going away. A live event that landed after the request stays.
  const pausedAt = 1_000;
  const requestedAt = 500_000;
  const chatStatus: Record<string, any> = {
    10: { id: 10, isOnline: true, isAway: false, statusUpdatedAt: pausedAt },
    11: { id: 11, isOnline: true, isAway: false, statusUpdatedAt: pausedAt },
    13: { id: 13, isOnline: true, isAway: false, statusUpdatedAt: pausedAt },
    14: {
      id: 14,
      isOnline: true,
      isAway: true,
      statusUpdatedAt: requestedAt + 10
    }
  };
  const next = applyPresenceSnapshot({
    chatStatus,
    onlineUsers: {
      10: { id: 10, isAway: false },
      12: { id: 12, username: 'twelve', isAway: false },
      13: { id: 13, isAway: true },
      14: { id: 14, isAway: false }
    },
    requestedAt,
    reconcileOffline: true
  });
  assert.equal(next[11].isOnline, false);
  assert.equal(next[12].isOnline, true);
  assert.equal(next[13].isAway, true);
  assert.equal(next[14].isAway, true, 'newer live event wins');
});

test('gap guard: after a resync only a full update is accepted, then deltas again', () => {
  const gap = createResyncGapGuard();
  assert.equal(gap.accept(true), true);
  gap.markResynced();
  assert.equal(gap.accept(true), false);
  assert.equal(gap.accept(true), false);
  assert.equal(gap.accept(false), true);
  assert.equal(gap.accept(true), true);
});

test('a resynced tab forgets which tab Zero and Ciel act in', () => {
  const aiSocketSource = readFileSync(
    new URL(
      '../src/containers/App/Header/hooks/useAPISocket/useAISocket.ts',
      import.meta.url
    ),
    'utf8'
  );
  assert.match(
    aiSocketSource,
    /function handleResync\(\) \{\s*activeAgentTabIdRef\.current = null;\s*\}/
  );
  assert.match(aiSocketSource, /socket\.on\(PRESENCE_RESYNC_EVENT, handleResync\)/);
  assert.match(aiSocketSource, /socket\.off\(PRESENCE_RESYNC_EVENT, handleResync\)/);
});
