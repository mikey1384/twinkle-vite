import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';

// A probe of a 90-card Home feed (work/content-paint-20261006/notes) counted
// every card rendering ~5 times on each return to Home and once more on the way
// out: react-intersection-observer's useInView kept the node and each observer
// entry in state, useNavigate re-rendered each card whenever <Routes>
// re-rendered, and the placeholder-height effect stored a fresh object on
// mount. These pin the cheaper replacements.
const cardSource = readFileSync(
  new URL('../src/containers/Home/Stories/FeedCard/index.tsx', import.meta.url),
  'utf8'
);
const stableNavigatePath = fileURLToPath(
  new URL('../src/helpers/hooks/useStableNavigate.ts', import.meta.url)
);
const inViewSource = readFileSync(
  new URL('../src/helpers/hooks/useInViewFlag.ts', import.meta.url),
  'utf8'
);
// Since 10-28 a card's mounting and measured height live in the shared card
// window (one boolean of state, sizes in a module cache).
const cardWindowSource = readFileSync(
  new URL('../src/containers/Home/Stories/hooks/useCardWindow.ts', import.meta.url),
  'utf8'
);

test('feed cards avoid hooks that re-render every row', () => {
  assert.doesNotMatch(cardSource, /from 'react-intersection-observer'/);
  assert.doesNotMatch(cardSource, /= useNavigate\(/);
  assert.match(
    cardSource,
    /const \{ navigate, routeNavigateRef \} = useStableNavigate\(\);/
  );
  assert.match(
    cardSource,
    /<RouteNavigateBridge navigateRef=\{routeNavigateRef\} \/>/
  );
  assert.match(
    cardSource,
    /\} = useCardWindow\(\{ cacheKey: placeholderHeightKey, alwaysShow: showcase \}\);/
  );
  // The window observes with a callback (no per-entry hook state) and keeps
  // one boolean; a near-viewport change is a ref, not a render.
  assert.doesNotMatch(cardWindowSource, /useInView\b/);
  assert.match(cardWindowSource, /const \[mounted, setMounted\] = useState\(measureBeforeHide\);/);
  assert.match(cardWindowSource, /nearViewportRef\.current = near;/);
  assert.match(cardSource, /export default memo\(HomeFeedCard\);/);
});

test('the in-view flag stores only the boolean', () => {
  assert.match(inViewSource, /useState\(false\)/);
  assert.doesNotMatch(inViewSource, /useState\(\{/);
  assert.match(inViewSource, /setInView\(nextInView\)/);
});

test('placeholder height updates keep the state object when unchanged', () => {
  // An unchanged measured size returns before any state update; a change
  // stores the new size in the module cache and one measurement object.
  const panelRef = cardWindowSource.slice(
    cardWindowSource.indexOf('const panelRef = useCallback('),
    cardWindowSource.indexOf('return {', cardWindowSource.indexOf('const panelRef = useCallback('))
  );
  assert.match(
    panelRef,
    /if \(previous\?\.height === next\.height && previous\.width === next\.width\) return;[\s\S]{0,300}?setMeasurement\(\{ key: cacheKey, size: next \}\);/
  );
  assert.equal((cardWindowSource.match(/setMeasurement\(/g) || []).length, 2);
  assert.doesNotMatch(cardSource, /setPlaceholderHeightState/);
});

test('only absolute paths bypass the router hook', () => {
  const output = buildSync({
    bundle: true,
    entryPoints: [stableNavigatePath],
    external: ['react', 'react-router-dom'],
    format: 'cjs',
    platform: 'node',
    write: false
  }).outputFiles[0].text;
  const mod: { exports: any } = { exports: {} };
  new Function('require', 'module', 'exports', output)(
    createRequire(stableNavigatePath),
    mod,
    mod.exports
  );
  const { isAbsolutePathTarget } = mod.exports;

  assert.equal(isAbsolutePathTarget('/subjects/5'), true);
  assert.equal(isAbsolutePathTarget({ pathname: '/app/3', search: '?a=1' }), true);
  for (const relative of [
    'subjects/5',
    './subjects/5',
    '../x',
    '?tab=1',
    '#top',
    '//evil.example/x',
    { search: '?a=1' }
  ]) {
    assert.equal(isAbsolutePathTarget(relative), false, String(relative));
  }
});
