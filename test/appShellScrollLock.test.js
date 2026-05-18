import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../src/helpers/appShellScroll.ts', import.meta.url),
  'utf8'
);
const appSource = readFileSync(
  new URL('../src/containers/App/index.tsx', import.meta.url),
  'utf8'
);

assert.match(source, /overflowX: string;/);
assert.match(
  source,
  /const previousAppStyle = snapshotScrollLockStyle\(appElement\);/
);
assert.match(source, /applyScrollLockStyle\(appElement\);/);
assert.match(source, /restoreScrollLockStyle\(appElement, previousAppStyle\);/);
assert.match(
  source,
  /function scheduleScrollReset\(\) \{[\s\S]*if \(resettingScroll\) return;[\s\S]*runScrollReset\(\);[\s\S]*window\.requestAnimationFrame/
);
assert.match(
  source,
  /function applyScrollLockStyle\([\s\S]*element\.style\.overflow = 'hidden';[\s\S]*element\.style\.overflowX = 'hidden';[\s\S]*element\.style\.overflowY = 'hidden';/
);
assert.match(
  source,
  /function restoreScrollLockStyle\([\s\S]*element\.style\.overflow = snapshot\.overflow;[\s\S]*element\.style\.overflowX = snapshot\.overflowX;[\s\S]*element\.style\.overflowY = snapshot\.overflowY;/
);
assert.match(source, /setScrollSurfaceOrigin\(document\.getElementById\('App'\)\);/);
assert.match(
  source,
  /function setScrollSurfaceOrigin\(element: Element \| null\) \{[\s\S]*element\.scrollTop = 0;[\s\S]*element\.scrollLeft = 0;[\s\S]*element\.dispatchEvent\(new Event\('scroll'\)\);[\s\S]*\}/
);
assert.match(
  appSource,
  /height: \$\{usingBuildRuntime[\s\S]*width: 100%;[\s\S]*display: flow-root;/
);

console.log('App shell scroll lock verifier passed.');
