import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('inline close controls are restricted to unpinned extra tabs', () => {
  const tabStripSource = readSource(
    'src/containers/App/Header/MainNavs/TabStrip.tsx'
  );
  const mainNavSource = readSource(
    'src/containers/App/Header/MainNavs/index.tsx'
  );
  const pinnedDescriptorBlock =
    mainNavSource.match(
      /const pinnedNavTabs = useMemo[\s\S]*?(?=\n\s*useEffect\()/
    )?.[0] || '';

  assert.match(
    tabStripSource,
    /zone === 'extra' && tab\.closable && onCloseTab/
  );
  assert.match(mainNavSource, /if \(!tab \|\| tab\.pinned\) return;/);
  assert.doesNotMatch(pinnedDescriptorBlock, /closable:/);
});

test('closing an active captured page suppresses its dynamic replacement', () => {
  const mainNavSource = readSource(
    'src/containers/App/Header/MainNavs/index.tsx'
  );

  assert.match(
    mainNavSource,
    /if \(removedTab\) \{\s*dismissDynamicReplacementForRemovedTab\(removedTab\)/
  );
  assert.match(
    mainNavSource,
    /function dismissDynamicReplacementForRemovedTab[\s\S]*?dismissedDynamicContentTabRef\.current[\s\S]*?dismissedDynamicProfileTabRef\.current/m
  );
  assert.match(
    mainNavSource,
    /profileNav && !profileCaptured && !profileDynamicTargetDismissed/
  );
  assert.match(
    mainNavSource,
    /profileNav &&[\s\S]*?!mobileProfileCaptured &&[\s\S]*?!mobileProfileDynamicTargetDismissed/m
  );
  assert.match(
    mainNavSource,
    /contentTabShown &&[\s\S]*?!mobileContentCaptured &&[\s\S]*?!mobileContentDynamicTargetDismissed/m
  );
});

test('guest layout migration preserves stored customization as one snapshot', () => {
  const helperSource = readSource('src/helpers/navTabOrder.ts');
  const mainNavSource = readSource(
    'src/containers/App/Header/MainNavs/index.tsx'
  );

  assert.match(
    helperSource,
    /function loadStoredNavLayout[\s\S]*?const order = sanitizeNavTabOrder[\s\S]*?const minimized = sanitizeMinimizedNavTabKeys/m
  );
  assert.doesNotMatch(helperSource, /shouldAdoptGuestDefaultLayout/);
  assert.match(
    mainNavSource,
    /Guests have no server-owned nav row[\s\S]*?if \(!userId\) \{[\s\S]*?return;/m
  );
});
