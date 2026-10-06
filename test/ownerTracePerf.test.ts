import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPageLoadTiming,
  createNavTimingTracker,
  createStallMonitor,
  describeSlowRequest,
  redactRequestPath
} from '../src/helpers/ownerTracePerf';

function fakeTimers() {
  const timers: { callback: () => void; ms: number; cleared: boolean }[] = [];
  return {
    timers,
    setTimer: (callback: () => void, ms: number) => {
      const timer = { callback, ms, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (handle: unknown) => {
      (handle as { cleared: boolean }).cleared = true;
    },
    fire() {
      for (const timer of timers.splice(0)) {
        if (!timer.cleared) timer.callback();
      }
    },
    live: () => timers.filter((timer) => !timer.cleared).length
  };
}

function navSetup({ owner = true }: { owner?: boolean } = {}) {
  const state = { owner, clock: 10_000, tapAt: null as number | null };
  const events: { type: string; data: any; path?: string }[] = [];
  const timers = fakeTimers();
  const tracker = createNavTimingTracker({
    isActive: () => state.owner,
    record: (type, data, path) => events.push({ type, data, path }),
    getRecentTapAt: () => state.tapAt,
    now: () => state.clock,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    readyWaitMs: 5000
  });
  return { state, events, timers, tracker };
}

test('nav-timing: one compact event from tap to content-ready', () => {
  const { state, events, timers, tracker } = navSetup();
  state.tapAt = 9_950;
  tracker.start('nav');
  state.clock = 10_040;
  tracker.location('/comments/5?q=secret#c=1', 'PUSH');
  state.clock = 10_540;
  tracker.gate({ probe: 'timeout', probeMs: 500, result: 'current' });
  state.clock = 10_700;
  tracker.commit('/comments/5?q=secret');
  assert.equal(events.length, 0);
  state.clock = 11_200;
  tracker.contentReady();
  assert.deepEqual(events, [
    {
      type: 'nav-timing',
      path: '/comments/5',
      data: {
        to: '/comments/5',
        via: 'nav',
        nav: 'PUSH',
        url: 90,
        gate: 590,
        commit: 750,
        ready: 1250,
        total: 1250,
        probe: 'timeout',
        probeMs: 500
      }
    }
  ]);
  assert.equal(timers.live(), 0);
  // A second content-ready is not a second event.
  tracker.contentReady();
  assert.equal(events.length, 1);
});

test('nav-timing: back/link navigations, the ready wait, reloads and supersession', () => {
  const { state, events, timers, tracker } = navSetup();
  // A POP with no explicit start.
  tracker.location('/', 'POP');
  state.clock += 30;
  tracker.gate({ probe: 'throttled', probeMs: 0, result: 'current' });
  tracker.commit('/');
  state.clock += 5000;
  timers.fire();
  assert.deepEqual(events.pop()?.data, {
    to: '/',
    via: 'pop',
    nav: 'POP',
    url: 0,
    gate: 30,
    commit: 30,
    total: 30,
    probe: 'throttled'
  });

  // A link tap: the pointerdown is the start, and is used only once.
  state.tapAt = state.clock - 120;
  tracker.location('/users/mikey', 'PUSH');
  state.clock += 10;
  tracker.gate({ probe: 'armed', probeMs: 140, result: 'reloading' });
  assert.deepEqual(events.pop()?.data, {
    to: '/users/mikey',
    via: 'tap',
    nav: 'PUSH',
    url: 120,
    gate: 130,
    total: 130,
    probe: 'armed',
    probeMs: 140,
    result: 'reloading'
  });

  // Held gate then another navigation: the first is cut, the tap is not
  // reused for the second.
  tracker.location('/a', 'PUSH');
  state.clock += 3900;
  tracker.location('/b', 'PUSH');
  const cut = events.pop()?.data;
  assert.equal(cut.cut, 'next-nav');
  assert.equal(cut.total, 3900);
  assert.equal(cut.via, 'url');

  // A redirect before the destination committed stays the same navigation.
  tracker.location('/b2', 'REPLACE');
  tracker.commit('/b2');
  tracker.flush();
  assert.equal(events.length, 1);
  assert.equal(events[0].data.to, '/b2');
  assert.equal(events[0].data.cut, 'hidden');
});

test('nav-timing: nothing for non-owners and no event without a URL change', () => {
  const { state, events, timers, tracker } = navSetup({ owner: false });
  tracker.start('nav');
  tracker.location('/x', 'PUSH');
  tracker.gate({ probe: 'current' });
  tracker.commit('/x');
  tracker.contentReady();
  tracker.flush();
  assert.equal(events.length, 0);
  assert.equal(timers.timers.length, 0);

  state.owner = true;
  tracker.start('nav');
  tracker.start('nav');
  tracker.flush();
  assert.equal(events.length, 0);
});

test('slow-request: threshold, redacted path pattern, queue time', () => {
  assert.equal(describeSlowRequest({ url: '/x', ms: 999 }), null);
  assert.deepEqual(
    describeSlowRequest({
      method: 'get',
      url: 'https://api.twin-kle.com/content/comments?contentId=123&searchText=my%20secret&_retry=1&_ts=5',
      status: 200,
      ms: 1834.4,
      queuedMs: 640,
      attempts: 2
    }),
    {
      m: 'GET',
      api: '/content/comments?contentId&searchText',
      status: 200,
      ms: 1834,
      q: 640,
      tries: 2
    }
  );
  assert.deepEqual(
    describeSlowRequest({
      method: 'post',
      url: '/user/password/reset/abcdefabcdefabcdefabcdefabcdef/42',
      status: 'ECONNABORTED',
      ms: 5000,
      queuedMs: 3
    }),
    {
      m: 'POST',
      api: '/user/password/reset/*/42',
      status: 'ECONNABORTED',
      ms: 5000
    }
  );
  // 16+ character letter+digit segments are masked; numeric ids and plain
  // words stay.
  assert.equal(
    redactRequestPath('/user/verify/a1b2c3d4e5f6g7h8/1234567890123456789/username'),
    '/user/verify/*/1234567890123456789/username'
  );
  assert.equal(
    redactRequestPath('/content/abcdefghijklmnopq/x1'),
    '/content/abcdefghijklmnopq/x1'
  );
  // Usernames after a username-carrying segment are masked; ids stay.
  assert.equal(redactRequestPath('/users/mikey/posts'), '/users/*/posts');
  assert.equal(
    redactRequestPath('https://api.example.com/user/profile/jane_doe?x=1'),
    '/user/profile/*?x'
  );
  assert.equal(redactRequestPath('/user/username/someone'), '/user/username/*');
  assert.equal(redactRequestPath('/users/12345/feed'), '/users/12345/feed');
  // 'user' alone is the API namespace, not a username marker.
  assert.equal(redactRequestPath('/user/session'), '/user/session');
  assert.equal(redactRequestPath(''), '');
  assert.equal(redactRequestPath('/feed?#x=1'), '/feed');
});

function stallSetup({ owner = true, visible = true } = {}) {
  const state = { owner, visible, clock: 0 };
  let pending: (() => void) | null = null;
  let checks = 0;
  const stalls: any[] = [];
  const timers = fakeTimers();
  const monitor = createStallMonitor({
    isActive: () => state.owner,
    isVisible: () => state.visible,
    scheduleCheck: (callback, ms) => {
      assert.equal(ms, 500);
      checks += 1;
      pending = callback;
      return checks;
    },
    cancelCheck: () => {
      pending = null;
    },
    getPath: () => '/home?search=secret',
    onStall: (burst) => stalls.push(burst),
    now: () => state.clock,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer
  });
  // The drift timer fires `late` ms after it was due.
  const fire = (late = 0) => {
    state.clock += 500 + late;
    const callback = pending;
    pending = null;
    callback?.();
  };
  return {
    state,
    monitor,
    stalls,
    timers,
    fire,
    checks: () => checks,
    hasPending: () => pending !== null
  };
}

test('stall: timer lateness over 200 ms is a stall, bursts coalesced into one event', () => {
  const { monitor, stalls, timers, fire } = stallSetup();
  monitor.start();
  fire(5);
  fire(150);
  assert.equal(timers.live(), 0);
  fire(450);
  fire(0);
  fire(320);
  fire(0);
  assert.equal(stalls.length, 0);
  timers.fire();
  // 450 ms late ending at 2105 (start 1655); 320 ms late ending at 3425.
  assert.deepEqual(stalls, [
    { ms: 450, n: 2, total: 770, span: 1770, path: '/home' }
  ]);
  // A suspended page's huge lateness is not a stall.
  fire(45_000);
  fire(0);
  assert.equal(timers.live(), 0);
});

test('stall: owner and visible only; stops when hidden and flushes its burst', () => {
  const nonOwner = stallSetup({ owner: false });
  nonOwner.monitor.start();
  assert.equal(nonOwner.checks(), 0);
  const hidden = stallSetup({ visible: false });
  hidden.monitor.start();
  assert.equal(hidden.checks(), 0);

  const { state, monitor, stalls, fire, hasPending } = stallSetup();
  monitor.start();
  fire(600);
  state.visible = false;
  fire(0);
  assert.equal(monitor.isRunning(), false);
  assert.equal(hasPending(), false);
  assert.equal(stalls.length, 1);
  assert.equal(stalls[0].ms, 600);

  // Signing out stops the timer on its next check.
  state.visible = true;
  monitor.start();
  state.owner = false;
  fire(0);
  assert.equal(monitor.isRunning(), false);
  assert.equal(hasPending(), false);
});

test('page-load: Navigation Timing and first route ready, rounded', () => {
  assert.deepEqual(
    buildPageLoadTiming(
      {
        type: 'navigate',
        responseStart: 212.6,
        domContentLoadedEventEnd: 801.2,
        loadEventEnd: 1490.9,
        transferSize: 0
      },
      1204.4
    ),
    {
      type: 'navigate',
      ttfb: 213,
      dcl: 801,
      load: 1491,
      route: 1204,
      cached: true
    }
  );
  assert.deepEqual(buildPageLoadTiming(null, 950), { route: 950 });
});
