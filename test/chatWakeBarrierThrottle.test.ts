import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHAT_WAKE_BARRIER_LONG_HIDDEN_MS,
  CHAT_WAKE_BARRIER_MIN_INTERVAL_MS,
  shouldSkipChatWakeBarrier
} from '../src/containers/App/Header/hooks/useAPISocket/chatWakeBarrierThrottle';

test('a tab that flips focus every few seconds re-binds its continuous socket at most once a minute', () => {
  const lastBarrier = { socketId: 'socket-a', at: 1_000 };
  assert.equal(shouldSkipChatWakeBarrier({ lastBarrier: null, socketId: 'socket-a', hiddenForMs: 0, now: 2_000 }), false);
  assert.equal(shouldSkipChatWakeBarrier({ lastBarrier, socketId: 'socket-a', hiddenForMs: 5_000, now: 13_000 }), true);
  assert.equal(
    shouldSkipChatWakeBarrier({ lastBarrier, socketId: 'socket-a', hiddenForMs: 0, now: 1_000 + CHAT_WAKE_BARRIER_MIN_INTERVAL_MS }),
    false
  );
});

test('a new socket or a long absence always re-checks chat rooms', () => {
  const lastBarrier = { socketId: 'socket-a', at: 1_000 };
  assert.equal(shouldSkipChatWakeBarrier({ lastBarrier, socketId: 'socket-b', hiddenForMs: 0, now: 2_000 }), false);
  assert.equal(
    shouldSkipChatWakeBarrier({ lastBarrier, socketId: 'socket-a', hiddenForMs: CHAT_WAKE_BARRIER_LONG_HIDDEN_MS, now: 2_000 }),
    false
  );
  assert.equal(
    shouldSkipChatWakeBarrier({ lastBarrier, socketId: 'socket-a', hiddenForMs: Number.POSITIVE_INFINITY, now: 2_000 }),
    false
  );
});
