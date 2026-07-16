import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('primary nav order is fixed and the active tab is rendered last', () => {
  const helperSource = readSource('src/helpers/navTabOrder.ts');
  const mainNavSource = readSource(
    'src/containers/App/Header/MainNavs/index.tsx'
  );

  assert.match(
    helperSource,
    /SACRED_DEFAULT_KEYS = \[\s*'home',\s*'explore',\s*'missions',\s*'chat',\s*'build'\s*\]/m
  );
  assert.match(
    helperSource,
    /return \[\.\.\.fixedOrder\.filter\(\(key\) => key !== activeKey\), activeKey\]/
  );
  assert.match(helperSource, /return normalizePrimaryNavTabOrder\(order\)/);
  assert.match(
    mainNavSource,
    /const displayedPrimaryKey =\s*currentActivePrimaryKey \|\| lastActivePrimaryKey[\s\S]*?getPrimaryNavTabOrder\(displayedPrimaryKey\)[\s\S]*?minimized: entry !== displayedPrimaryKey/m
  );
  assert.match(
    mainNavSource,
    /setLastActivePrimaryKey\([\s\S]*?currentActivePrimaryKey/m
  );
});

test('primary nav reordering and label controls are disabled', () => {
  const mainNavSource = readSource(
    'src/containers/App/Header/MainNavs/index.tsx'
  );
  const tabStripSource = readSource(
    'src/containers/App/Header/MainNavs/TabStrip.tsx'
  );
  const mobileSwitcherSource = readSource(
    'src/containers/App/Header/MainNavs/MobileTabSwitcher.tsx'
  );

  assert.match(mainNavSource, /if \(kind !== 'pinned'\) return;/);
  assert.match(
    mainNavSource,
    /function handleGetTabMenuItems[\s\S]*?if \(!renderedTab \|\| isSacredDefaultKey\(key\)\) return null;/m
  );
  assert.match(
    mainNavSource,
    /function handleToggleTabMinimized[\s\S]*?if \(!tabSupportsLabelControl\(key\)\) return;/m
  );
  assert.match(
    tabStripSource,
    /onContextMenu=\{\s*zone === 'default'\s*\? undefined/m
  );
  assert.match(
    mobileSwitcherSource,
    /section\.kind === 'pinned' && section\.items\.length > 1/
  );
});

test('a new tab press cannot inherit stale long-press suppression', () => {
  const tabStripSource = readSource(
    'src/containers/App/Header/MainNavs/TabStrip.tsx'
  );

  assert.match(
    tabStripSource,
    /onPointerDown=\{\(event\) =>\s*handlePointerDown\(event, tab\.key, index, zone\)/m
  );
  assert.match(
    tabStripSource,
    /function handlePointerDown[\s\S]*?didDragRef\.current = false;[\s\S]*?didLongPressRef\.current = false;[\s\S]*?if \(zone === 'default'\) return;/m
  );
  assert.match(
    tabStripSource,
    /function handleClickCapture[\s\S]*?didDragRef\.current = false;[\s\S]*?didLongPressRef\.current = false;/m
  );
});

test('label controls only appear when the rendered tab can show a label', () => {
  const mainNavSource = readSource(
    'src/containers/App/Header/MainNavs/index.tsx'
  );

  assert.match(
    mainNavSource,
    /function tabSupportsLabelControl[\s\S]*?!isTabletPortrait[\s\S]*?!isSacredDefaultKey\(key\)[\s\S]*?renderedTab\.label[\s\S]*?!customTab\?\.pinned/m
  );
  assert.match(
    mainNavSource,
    /function handleGetTabMenuItems[\s\S]*?const renderedTab = getRenderedTab\(key\);[\s\S]*?if \(!renderedTab \|\| isSacredDefaultKey\(key\)\) return null;/m
  );
  assert.match(
    mainNavSource,
    /renderedTab\.minimized[\s\S]*?label: 'Expand'[\s\S]*?label: 'Minimize'/m
  );
});

test('unpinned extras use most-recently-opened order across nav surfaces', () => {
  const mainNavSource = readSource(
    'src/containers/App/Header/MainNavs/index.tsx'
  );
  const tabStripSource = readSource(
    'src/containers/App/Header/MainNavs/TabStrip.tsx'
  );

  assert.match(
    mainNavSource,
    /currentActiveExtraTabKey[\s\S]*?recentExtraTabKeys\.filter[\s\S]*?recentExtraNavTabs[\s\S]*?baseExtraNavTabs\.filter/m
  );
  assert.match(
    mainNavSource,
    /const addedItems = extraNavTabs\.flatMap/
  );
  assert.match(
    mainNavSource,
    /mobileExtraTabKeys\.map\(\(key\) => renderMobileExtraNav\(key\)\)/
  );
  assert.match(tabStripSource, /if \(zone !== 'pinned'\) return;/);
  assert.doesNotMatch(tabStripSource, /\bonMove:/);
});
