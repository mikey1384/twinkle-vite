import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  createTopPinNavigationGate,
  createTopPinWindow,
  elementIsEditableField,
  topPinHardCapMs,
  topPinMaxRepins,
  topPinWindowMs
} from '../src/helpers/scrollTopPin';

// A fake document scroller with WebKit's behaviour from the 2026-10-06 owner
// trace: the old offset (869) comes back once the new page grows.
function setup() {
  const state = {
    time: 0,
    scrollTop: 0,
    userInputAt: 0,
    repins: [] as Array<{ stray: number; trigger: string; count: number }>,
    ended: [] as Array<{ reason: string; repins: number }>
  };
  const pin = createTopPinWindow({
    now: () => state.time,
    readScrollTop: () => state.scrollTop,
    userInputSince: (time) =>
      state.userInputAt > 0 && state.userInputAt >= time,
    repin(stray, trigger, count) {
      state.repins.push({ stray, trigger, count });
      state.scrollTop = 0;
    },
    onEnd(reason, repins) {
      state.ended.push({ reason, repins });
    }
  });
  return { pin, state };
}

test('a browser re-applied old offset is put back to the top', () => {
  const { pin, state } = setup();
  state.time = 27;
  state.scrollTop = 869;
  assert.equal(pin.check('scroll'), true);
  assert.equal(state.scrollTop, 0);
  assert.deepEqual(state.repins, [{ stray: 869, trigger: 'scroll', count: 1 }]);
  assert.equal(pin.isActive(), true);
});

test('a document resize that moved the offset re-pins without a scroll event', () => {
  const { pin, state } = setup();
  state.time = 30;
  state.scrollTop = 761; // clamped to the grown document's max scroll
  assert.equal(pin.check('resize'), true);
  assert.equal(state.repins[0].trigger, 'resize');
  assert.equal(state.scrollTop, 0);
});

test('staying at the top (or subpixel settling) is not re-pinned', () => {
  const { pin, state } = setup();
  state.time = 10;
  assert.equal(pin.check('scroll'), false);
  state.scrollTop = 0.5;
  assert.equal(pin.check('resize'), false);
  assert.equal(state.repins.length, 0);
});

test('user scroll input ends the window for good', () => {
  const { pin, state } = setup();
  state.time = 100;
  state.userInputAt = 100;
  state.scrollTop = 400;
  assert.equal(pin.check('scroll'), false);
  assert.equal(state.scrollTop, 400);
  assert.deepEqual(state.ended, [{ reason: 'user-input', repins: 0 }]);
  assert.equal(pin.isActive(), false);
  state.userInputAt = 0;
  state.scrollTop = 869;
  assert.equal(pin.check('scroll'), false);
});

test('an explicit stop (input listener, release, restore, teardown) is final', () => {
  const { pin, state } = setup();
  pin.stop('released');
  pin.stop('teardown');
  state.scrollTop = 869;
  assert.equal(pin.check('scroll'), false);
  assert.deepEqual(state.ended, [{ reason: 'released', repins: 0 }]);
});

test('the window expires, and an extension never passes the hard cap', () => {
  const { pin, state } = setup();
  state.time = topPinWindowMs + 1;
  state.scrollTop = 869;
  assert.equal(pin.check('scroll'), false);
  assert.equal(state.ended[0].reason, 'expired');

  const extended = setup();
  for (let time = 1000; time <= topPinHardCapMs; time += 1000) {
    extended.state.time = time;
    extended.pin.extend();
  }
  extended.state.time = topPinHardCapMs + 1;
  extended.state.scrollTop = 869;
  assert.equal(extended.pin.check('scroll'), false);
  assert.equal(extended.state.ended[0].reason, 'expired');
});

test('extending keeps a window open past its first deadline', () => {
  const { pin, state } = setup();
  state.time = 1200;
  pin.extend();
  state.time = topPinWindowMs + 500;
  state.scrollTop = 869;
  assert.equal(pin.check('scroll'), true);
});

test('a position that keeps coming back is fought only up to the cap', () => {
  const { pin, state } = setup();
  for (let index = 0; index < topPinMaxRepins; index += 1) {
    state.time = index + 1;
    state.scrollTop = 869;
    assert.equal(pin.check('scroll'), true);
  }
  state.scrollTop = 869;
  assert.equal(pin.check('scroll'), false);
  assert.equal(state.scrollTop, 869);
  assert.deepEqual(state.ended, [
    { reason: 'repin-cap', repins: topPinMaxRepins }
  ]);
});

test('only a new location opens a pin, not an anchor key change on the same location', () => {
  const gate = createTopPinNavigationGate();
  // PUSH to People: a new location key.
  assert.equal(gate.consume('loc-a'), true);
  // Each search keystroke re-keys the anchor on the same location.
  assert.equal(gate.consume('loc-a'), false);
  assert.equal(gate.consume('loc-a'), false);
  // The next real navigation opens one again.
  assert.equal(gate.consume('loc-b'), true);
});

test('a focused text field blocks the pin; buttons and read-only fields do not', () => {
  assert.equal(
    elementIsEditableField({ tagName: 'INPUT', type: 'text' }),
    true
  );
  assert.equal(
    elementIsEditableField({ tagName: 'INPUT', type: 'search' }),
    true
  );
  assert.equal(elementIsEditableField({ tagName: 'INPUT', type: '' }), true);
  assert.equal(elementIsEditableField({ tagName: 'TEXTAREA' }), true);
  assert.equal(
    elementIsEditableField({ tagName: 'DIV', isContentEditable: true }),
    true
  );
  assert.equal(
    elementIsEditableField({ tagName: 'INPUT', type: 'checkbox' }),
    false
  );
  assert.equal(
    elementIsEditableField({ tagName: 'INPUT', type: 'text', readOnly: true }),
    false
  );
  assert.equal(
    elementIsEditableField({ tagName: 'TEXTAREA', readOnly: true }),
    false
  );
  assert.equal(elementIsEditableField({ tagName: 'A' }), false);
  assert.equal(elementIsEditableField({ tagName: 'BODY' }), false);
  assert.equal(elementIsEditableField(null), false);
});

const read = (file: string) =>
  readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');

test('the hook opens the pin only for forward top navigations in document-scroller mode', () => {
  const source = read('helpers/hooks/useScrollAnchorRestoration.ts');
  // Forward-nav mount: opens even when scrollTop already reads a clamped 0.
  assert.match(
    source,
    /if \(navigationType === 'POP'\) return;[\s\S]{0,700}if \(opensTopPin\) forwardNavTopPinKeyRef\.current = anchorKey;[\s\S]{0,300}if \(scrollTop <= 0\) \{\s*if \(!opensTopPin\) return;\s*startTopPinWindow\(/
  );
  // No-saved-anchor initial top scroll only after that forward-nav gate.
  assert.match(
    source,
    /initialScrollType === 'top' &&\s*forwardNavTopPinKeyRef\.current === anchorKey\s*\) \{\s*startTopPinWindow\(/
  );
  // Saved-anchor restores end any pin before restoring.
  assert.match(
    source,
    /topPinRef\.current\?\.stop\('saved-anchor-restore'\);\s*const anchorToRestore = savedAnchor;/
  );
  // The gate is consumed per key change; only a new location opens the pin.
  assert.match(
    source,
    /arrivedByNavigationRef\.current =\s*initialScrollType === 'top' && topPinNavigationGate\.consume\(locationKey\);/
  );
  assert.match(
    source,
    /const opensTopPin = arrivedByNavigationRef\.current;\s*if \(opensTopPin\) forwardNavTopPinKeyRef\.current = anchorKey;/
  );
  const start = source.slice(source.indexOf('function startTopPinWindow('));
  assert.match(
    start,
    /if \(getActiveScroller\(\)\) return;\s*if \(elementIsEditableField\(document\.activeElement/
  );
  assert.match(start, /if \(getActiveScroller\(\)\) return;/);
  // Re-pins use the programmatic-scroll bookkeeping and leave a trace event.
  assert.match(
    start,
    /repin\([\s\S]*applyInitialScroll\([\s\S]*restoreAppliedAt\.current = nowMs\(\);[\s\S]*nonUserScrollTainted\.current = false;[\s\S]*lastAppliedScrollTop\.current =[\s\S]*type: 'top-repin'/
  );
  // Any touch / wheel / key input ends the window: never fight the user.
  const inputEvents = source.slice(
    source.indexOf('const topPinUserInputEvents = ['),
    source.indexOf('] as const;')
  );
  for (const eventName of ['wheel', 'touchmove', 'keydown', 'focusin']) {
    assert.match(inputEvents, new RegExp(`'${eventName}'`));
  }
  // A bare tap must not end the pin (WebKit's stale offset would win later).
  assert.doesNotMatch(inputEvents, /'touchstart'|'pointerdown'/);
  assert.match(
    start,
    /function handleUserInput\(event: Event\) \{[\s\S]{0,300}restoreCancelKeys\.has\(keyEvent\.key\)[\s\S]{0,80}pin\.stop\('user-input'\)/
  );
  assert.match(
    start,
    /for \(const eventName of topPinUserInputEvents\) \{\s*window\.addEventListener\(eventName, handleUserInput/
  );
  assert.match(start, /addScrollAnchorTopPinReleaseListener\(/);
  assert.match(start, /new ResizeObserver\(/);
});

test('deliberate app scrolls release the pin before scrolling', () => {
  for (const file of [
    'containers/Home/Earn/index.tsx',
    'containers/Management/Tools/index.tsx',
    'containers/Management/Main/BuildRewardApprovals.tsx',
    'containers/Management/AiCosts/Content.tsx',
    'containers/Profile/Cover.tsx',
    'containers/VideoPage/QuestionsBuilder/index.tsx'
  ]) {
    const callerSource = read(file);
    const scrolls = callerSource.match(/scrollIntoView\(/g) || [];
    const releases =
      callerSource.match(
        /releaseScrollAnchorTopPin\(\);[\s\S]{0,160}scrollIntoView\(/g
      ) || [];
    assert.equal(releases.length, scrolls.length, file);
  }
  const agentSource = read('helpers/websiteAgentPage.ts');
  assert.equal(
    (
      agentSource.match(
        /releaseScrollAnchorTopPin\(\);\s*element\.scrollIntoView/g
      ) || []
    ).length,
    2
  );
  assert.match(
    read('helpers/index.ts'),
    /export function scrollElementToCenter\([^)]*\): void \{\s*if \(!element\) return;[\s\S]{0,120}releaseScrollAnchorTopPin\(\);/
  );
  assert.match(
    read('containers/App/WebsiteAgentSpotlight.tsx'),
    /releaseScrollAnchorTopPin\(\);\s*element\.scrollIntoView\(\{ block: 'center' \}\);/
  );
});
