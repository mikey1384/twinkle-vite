import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(
  new URL(
    '../src/containers/App/Header/MainNavs/TabStrip.tsx',
    import.meta.url
  ),
  'utf8'
);

test('manual tab-strip scrolling wins over deferred active-tab alignment', () => {
  assert.match(
    source,
    /function handleWheelNative[\s\S]*?cancelActiveScrollRef\.current\(\);[\s\S]*?el\.scrollLeft \+= event\.deltaY;/m
  );
  assert.match(source, /onPointerDownCapture=\{cancelPendingActiveScroll\}/);
  assert.match(
    source,
    /function cancelActiveScroll\(\)[\s\S]*?cancelAnimationFrame\(raf\);[\s\S]*?timers\.forEach\(clearTimeout\);/m
  );
  assert.match(
    source,
    /<ScrollableRow\s+key="main-tabs"\s+signature=\{mainSignature\}/m
  );
});

test('default-tab docking preserves the main row screen position', () => {
  assert.match(
    source,
    /pendingDockLayoutCompensationRef\.current = \{\s*scroller,\s*left: mainLeft\s*\};/m
  );
  assert.match(
    source,
    /useLayoutEffect\(\(\) => \{[\s\S]*?getBoundingClientRect\(\)\.left - pending\.left[\s\S]*?scroller\.scrollLeft \+= leftDelta;[\s\S]*?\}, \[collapsedLeadingCount, collapsedTrailingCount\]\);/m
  );
});

test('overflow caret transitions preserve the scroll viewport position', () => {
  assert.match(
    source,
    /scrollStateRef\.current\.overflowing !== overflowing[\s\S]*?pendingControlLayoutCompensationRef\.current =[\s\S]*?getBoundingClientRect\(\)\.left;/m
  );
  assert.match(
    source,
    /useLayoutEffect\(\(\) => \{[\s\S]*?pendingControlLayoutCompensationRef\.current[\s\S]*?getBoundingClientRect\(\)\.left - previousLeft[\s\S]*?el\.scrollLeft \+= leftDelta;[\s\S]*?\}, \[scrollState\.overflowing\]\);/m
  );
});

test('a new pin lands last and the pinned row scrolls to it', () => {
  const navSource = readFileSync(
    new URL('../src/containers/App/Header/MainNavs/index.tsx', import.meta.url),
    'utf8'
  );
  assert.match(
    navSource,
    /function handleToggleTabPinned[\s\S]*?nextPinned\s*\?\s*\[\s*\.\.\.base\.customTabs\.filter\(\(tab\) => tab\.id !== id\),\s*\{ \.\.\.target, pinned: true \}\s*\]/m
  );
  assert.match(
    source,
    /const added = keys\.filter\(\(key\) => !seen\.has\(key\)\);[\s\S]*?setJustPinnedKey\(added\[0\]\);/m
  );
  assert.match(source, /revealKey=\{justPinnedKey\}/);
  // the row rests at its end through the load-time re-layouts, until the
  // user scrolls it
  assert.match(
    source,
    /function restAtEnd\(\)[\s\S]*?userMovedRef\.current[\s\S]*?el\.scrollLeft = el\.scrollWidth;/m
  );
  assert.match(source, /\}, \[scrollToEndOnLoad, signature, capWidth\]\);/);
  assert.doesNotMatch(source, /didInitialEndScrollRef/);
  assert.match(source, /data-tab-key=\{tab\.key\}/);
});
