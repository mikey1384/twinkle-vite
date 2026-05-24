import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../src/components/ContentListItem/RootContent.tsx', import.meta.url),
  'utf8'
);
const buildDetailsSource = readFileSync(
  new URL(
    '../src/components/ContentListItem/ContentDetails/BuildDetails.tsx',
    import.meta.url
  ),
  'utf8'
);
const buildWideCardSource = readFileSync(
  new URL('../src/components/Build/Cards/BuildWideCard.tsx', import.meta.url),
  'utf8'
);

assert.equal(
  source.includes("if (contentType === 'build')"),
  false,
  'Build root previews must not bypass the RootContent wrapper.'
);
assert.match(source, /contentType === 'build' \? ' is-build' : ''/);
assert.match(source, /hideSideBordersOnMobile \? ' hideSideBordersOnMobile' : ''/);
assert.match(source, /borderTopLeftRadius: 0, borderTopRightRadius: 0/);
assert.match(source, /buildCardEmbedded=\{contentType === 'build'\}/);
assert.match(buildDetailsSource, /clickable = false/);
assert.match(buildDetailsSource, /<div className="build-details">/);
assert.match(buildDetailsSource, /embedded=\{embedded\}/);
assert.match(buildWideCardSource, /embedded = false/);
assert.match(buildWideCardSource, /embedded && 'embedded'/);
assert.match(buildWideCardSource, /&\.embedded \{[\s\S]*?border: 0;[\s\S]*?box-shadow: none;/);

console.log('RootContent build wrapper verifier passed.');
