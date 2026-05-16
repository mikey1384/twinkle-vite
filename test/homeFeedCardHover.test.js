import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../src/containers/Home/Stories/FeedCard/index.tsx', import.meta.url),
  'utf8'
);

const cardClassMatch = source.match(/const cardClass = css`([\s\S]*?)`;/);
assert.ok(cardClassMatch, 'Expected home feed card styles to be present.');

const cardStyles = cardClassMatch[1];
const hoverBlockMatch = cardStyles.match(
  /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?&:hover \{([\s\S]*?)\n    \}/
);
assert.ok(hoverBlockMatch, 'Expected home feed card hover styles.');

const hoverBlock = hoverBlockMatch[1];
assert.match(hoverBlock, /border-color: var\(--ui-border-strong\);/);
assert.doesNotMatch(hoverBlock, /background\s*:/);
assert.doesNotMatch(cardStyles, /background 0\.18s ease/);

console.log('Home feed card hover verifier passed.');
