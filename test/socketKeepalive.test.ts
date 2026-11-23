import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSocketKeepalive,
  SOCKET_DEAD_LINK_AFTER_MS
} from '../src/helpers/socketKeepalive';

function setup() {
  let clock = 0;
  let dead = 0;
  const timers: { at: number; callback: () => void; cleared: boolean }[] = [];
  const keepalive = createSocketKeepalive({
    onDeadLink: () => {
      dead += 1;
    },
    now: () => clock,
    setTimer: (callback, ms) => {
      const timer = { at: clock + ms, callback, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (handle) => {
      (handle as { cleared: boolean }).cleared = true;
    }
  });
  // Runs the timers that are due, like a page whose timers were never frozen.
  const advance = (ms: number) => {
    const end = clock + ms;
    for (;;) {
      const next = timers
        .filter((timer) => !timer.cleared && timer.at <= end)
        .sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      clock = Math.max(clock, next.at);
      next.cleared = true;
      next.callback();
    }
    clock = end;
  };
  // Time passes with timers frozen (a suspended page); they all fire late.
  const freeze = (ms: number) => {
    clock += ms;
  };
  return { keepalive, advance, freeze, dead: () => dead };
}

test('work subscribed to the beat runs once per server ping and stops when unsubscribed', () => {
  const { keepalive } = setup();
  let beats = 0;
  const stop = keepalive.subscribe(() => {
    beats += 1;
  });
  keepalive.connected();
  keepalive.ping();
  keepalive.ping();
  assert.equal(beats, 2);
  stop();
  keepalive.ping();
  assert.equal(beats, 2);
});

test('a listener that throws does not stop the others', () => {
  const { keepalive } = setup();
  let beats = 0;
  const originalError = console.error;
  console.error = () => {};
  try {
    keepalive.subscribe(() => {
      throw new Error('boom');
    });
    keepalive.subscribe(() => {
      beats += 1;
    });
    keepalive.ping();
  } finally {
    console.error = originalError;
  }
  assert.equal(beats, 1);
});

test('pings that keep arriving never report a dead link', () => {
  const { keepalive, advance, dead } = setup();
  keepalive.connected();
  for (let i = 0; i < 20; i++) {
    advance(25_000);
    keepalive.ping();
  }
  assert.equal(dead(), 0);
});

test('two missed pings on a visible page report the dead link once', () => {
  const { keepalive, advance, dead } = setup();
  keepalive.connected();
  advance(25_000);
  keepalive.ping();
  advance(SOCKET_DEAD_LINK_AFTER_MS - 1);
  assert.equal(dead(), 0);
  advance(1);
  assert.equal(dead(), 1);
  advance(10 * SOCKET_DEAD_LINK_AFTER_MS);
  assert.equal(dead(), 1, 'nothing more until the next connect');
  keepalive.disconnected();
  keepalive.connected();
  advance(SOCKET_DEAD_LINK_AFTER_MS);
  assert.equal(dead(), 2);
});

test('a hidden page is never judged, and gets a full window after it returns', () => {
  const { keepalive, advance, dead } = setup();
  keepalive.connected();
  advance(30_000);
  keepalive.visibilityChanged(false);
  advance(10 * SOCKET_DEAD_LINK_AFTER_MS);
  assert.equal(dead(), 0);
  keepalive.visibilityChanged(true);
  advance(SOCKET_DEAD_LINK_AFTER_MS - 1);
  assert.equal(dead(), 0);
  advance(1);
  assert.equal(dead(), 1);
});

test('a disconnected socket is never judged', () => {
  const { keepalive, advance, dead } = setup();
  keepalive.connected();
  keepalive.disconnected();
  advance(10 * SOCKET_DEAD_LINK_AFTER_MS);
  assert.equal(dead(), 0);
});

test('a timer that fires late after a frozen page gets one more window before the link is judged', () => {
  const { keepalive, advance, freeze, dead } = setup();
  keepalive.connected();
  // The page froze without a visibility event for ten minutes.
  freeze(600_000);
  advance(0);
  assert.equal(dead(), 0, 'the late timer must not close a link that may be fine');
  // The queued pings are delivered once the page runs again.
  keepalive.ping();
  advance(25_000);
  keepalive.ping();
  assert.equal(dead(), 0);
  // If instead nothing arrives for a whole window, the link is dead.
  advance(SOCKET_DEAD_LINK_AFTER_MS);
  assert.equal(dead(), 1);
});
