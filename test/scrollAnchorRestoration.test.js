import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../src/helpers/hooks/useScrollAnchorRestoration.ts', import.meta.url),
  'utf8'
);

assert.match(source, /scrollTop: number;/);
assert.match(source, /const scrollTop = getScrollTop\(scroller\);/);
assert.match(
  source,
  /if \(items\.length === 0\) \{[\s\S]*scrollTop[\s\S]*return;[\s\S]*\}/
);
assert.match(
  source,
  /if \(!anchorElement\) \{[\s\S]*restoreToSavedScrollTop\(anchorToRestore, scroller\);[\s\S]*attempts \+= 1;/
);
assert.match(
  source,
  /function restoreToSavedScrollTop\([\s\S]*suppressScrollAnchorSaves\(restoreSaveSuppressionDurationMs\);[\s\S]*setScrollTop\(scroller, Math\.max\(0, savedAnchor\.scrollTop\)\);/
);
assert.match(
  source,
  /return \(\) => \{[\s\S]*saveCurrentAnchor\(anchorKey, container, scroller\);[\s\S]*removeEventListener\('scroll', handleScroll\);/
);

console.log('Scroll anchor restoration verifier passed.');
