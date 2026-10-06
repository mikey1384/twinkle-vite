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
  assert.match(cardSource, /const \[VisibilityRef, inView\] = useInViewFlag\(\);/);
  assert.match(cardSource, /export default memo\(HomeFeedCard\);/);
});

test('the in-view flag stores only the boolean', () => {
  assert.match(inViewSource, /useState\(false\)/);
  assert.doesNotMatch(inViewSource, /useState\(\{/);
  assert.match(inViewSource, /setInView\(nextInView\)/);
});

test('placeholder height updates keep the state object when unchanged', async () => {
  const match = cardSource.match(
    /export function getNextPlaceholderHeightState\([\s\S]*?\n\}/
  );
  assert.ok(match, 'expected getNextPlaceholderHeightState');
  const body = match[0]
    .replace(/^export /, '')
    .replace(/prev: \{ height: number; key: string \}/, 'prev')
    .replace(/height: number/, 'height')
    .replace(/key: string\n/, 'key\n');
  const getNext = new Function(`${body}; return getNextPlaceholderHeightState;`)();
  const prev = { height: 320, key: 'home-feed-a' };

  assert.equal(getNext(prev, 320, 'home-feed-a'), prev);
  assert.deepEqual(getNext(prev, 340, 'home-feed-a'), {
    height: 340,
    key: 'home-feed-a'
  });
  assert.deepEqual(getNext(prev, 320, 'home-feed-b'), {
    height: 320,
    key: 'home-feed-b'
  });
  assert.equal(
    (cardSource.match(/setPlaceholderHeightState\(\(prev\) =>/g) || []).length,
    2,
    'both the mount effect and the resize report go through the bail-out'
  );
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
