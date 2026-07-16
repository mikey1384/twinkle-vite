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
  assert.doesNotMatch(mainNavSource, /kind: 'default'/);
  assert.doesNotMatch(
    mobileSwitcherSource,
    /SwitcherKind = [^;]*'default'/
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

test('tab navigation reports pending intent without claiming the route is active', () => {
  const navSource = readSource(
    'src/containers/App/Header/MainNavs/Nav.tsx'
  );
  const feedbackSource = readSource(
    'src/containers/App/navigationFeedback.tsx'
  );
  const appSource = readSource('src/containers/App/index.tsx');
  const mainSource = readSource('src/main.tsx');

  assert.match(
    feedbackSource,
    /activeLocation: pendingNavigation \? readyLocation : currentLocation[\s\S]*?pendingTarget: pendingNavigation\?\.targetLocation/m
  );
  assert.match(
    feedbackSource,
    /requestAnimationFrame[\s\S]*?paint the urgent pending state[\s\S]*?navigate\(pendingNavigation\.target\)/m
  );
  assert.match(
    feedbackSource,
    /destinationCommitted \|\| redirectedDestinationCommitted/
  );
  assert.match(
    navSource,
    /if \(onNavigationStart\(to\)\) \{[\s\S]*?event\.preventDefault\(\);/m
  );
  assert.match(
    navSource,
    /<Icon[\s\S]*?icon=\{navigationLoading \? 'spinner'/m
  );
  assert.match(navSource, /aria-busy=\{navigationLoading \|\| undefined\}/);
  assert.match(
    navSource,
    /const tabVariantClass = css`[\s\S]*?touch-action: manipulation;/m
  );
  assert.match(navSource, /> a\.pending:not\(\.active\)/);
  assert.match(
    navSource,
    /navTargetIsActive\(\{[\s\S]*?pathname: activeLocation\.pathname[\s\S]*?search: activeLocation\.search/m
  );
  assert.match(
    mainSource,
    /<NavigationFeedbackProvider>[\s\S]*?<App \/>[\s\S]*?<\/NavigationFeedbackProvider>/m
  );
  assert.match(
    appSource,
    /<Suspense fallback=\{<Loading \/>\}>[\s\S]*?<NavigationRouteReadyObserver \/>[\s\S]*?<Routes>/m
  );
});

test('fast tab navigation finishes before its loading spinner delay', () => {
  const feedbackSource = readSource(
    'src/containers/App/navigationFeedback.tsx'
  );
  const navSource = readSource(
    'src/containers/App/Header/MainNavs/Nav.tsx'
  );

  assert.match(
    feedbackSource,
    /const NAVIGATION_LOADING_INDICATOR_DELAY_MS = 200;/
  );
  assert.match(
    feedbackSource,
    /setLoadingRequestId\(pendingNavigationId\)[\s\S]*?NAVIGATION_LOADING_INDICATOR_DELAY_MS[\s\S]*?clearTimeout\(loadingIndicatorTimer\)/m
  );
  assert.match(
    feedbackSource,
    /loadingTarget:[\s\S]*?pendingNavigation\?\.id === loadingRequestId[\s\S]*?pendingNavigation\.targetLocation/m
  );
  assert.match(
    navSource,
    /className=\{`\$\{navClassName\} \$\{navigationPending \? 'pending' : ''\}[\s\S]*?icon=\{navigationLoading \? 'spinner'/m
  );
});

test('pending tab navigation dispatches each request id only once', () => {
  const feedbackSource = readSource(
    'src/containers/App/navigationFeedback.tsx'
  );

  assert.match(
    feedbackSource,
    /const dispatchedRequestIdRef = useRef<number \| null>\(null\)/
  );
  assert.match(
    feedbackSource,
    /dispatchedRequestIdRef\.current === pendingNavigation\.id[\s\S]*?dispatchedRequestIdRef\.current = pendingNavigation\.id[\s\S]*?dispatchState: 'dispatched'[\s\S]*?navigate\(pendingNavigation\.target\)/m
  );
});

test('route readiness cannot consume a newer scheduled tab request', () => {
  const feedbackSource = readSource(
    'src/containers/App/navigationFeedback.tsx'
  );

  assert.match(
    feedbackSource,
    /if \(!current \|\| current\.dispatchState !== 'dispatched'\) return current;/
  );
  assert.match(
    feedbackSource,
    /current\.expectsLocationChange &&[\s\S]*?nextLocation\.key !== current\.sourceRouteKey/m
  );
  assert.match(feedbackSource, /sourceRouteKey: currentLocation\.key/);
});

test('returning to the dispatched tab navigation source cancels feedback', () => {
  const feedbackSource = readSource(
    'src/containers/App/navigationFeedback.tsx'
  );

  assert.match(
    feedbackSource,
    /const routerIsAtSource =[\s\S]*?currentLocation\.key === current\.sourceRouteKey[\s\S]*?currentLocationKey === current\.sourceLocation/m
  );
  assert.match(
    feedbackSource,
    /if \(!current\.sourceWasExited\)[\s\S]*?sourceWasExited: true[\s\S]*?return routerIsAtSource \? null : current;/m
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
