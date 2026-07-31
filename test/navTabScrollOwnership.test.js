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
