import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../src/components/XPVideoPlayer/XPBar/Bar.tsx', import.meta.url),
  'utf8'
);
const trackStyles = source.match(
  /const trackCls = useMemo\([\s\S]*?const fillCls = useMemo/
)?.[0];
const fillStyles = source.match(
  /const fillCls = useMemo\([\s\S]*?const labelCls = useMemo/
)?.[0];

assert.ok(trackStyles);
assert.ok(fillStyles);
assert.match(trackStyles, /border-radius: 9999px;/);
assert.match(fillStyles, /border-radius: 9999px;/);
assert.match(
  trackStyles,
  /@media \(max-width: \$\{mobileMaxWidth\}\) \{[\s\S]*?border-top-left-radius: 0;[\s\S]*?border-bottom-left-radius: 0;[\s\S]*?border-left: 0;/
);
assert.match(
  fillStyles,
  /@media \(max-width: \$\{mobileMaxWidth\}\) \{[\s\S]*?border-top-left-radius: 0;[\s\S]*?border-bottom-left-radius: 0;/
);

console.log('XP video progress bar layout guard passed.');
