import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../src/containers/Home/Stories/FeedCard/index.tsx', import.meta.url),
  'utf8'
);

const shouldHydrateMatch = source.match(
  /const shouldHydrate =([\s\S]*?);/
);
assert.ok(shouldHydrateMatch, 'Expected a HomeFeedCard hydration guard.');

const shouldHydrateBlock = shouldHydrateMatch[1];
assert.match(shouldHydrateBlock, /contentId > 0/);
assert.match(shouldHydrateBlock, /Boolean\(contentType\)/);
assert.match(shouldHydrateBlock, /!contentState\.loaded/);
assert.doesNotMatch(shouldHydrateBlock, /contentShown|inView|isVisible/);

// Mounting is owned by the shared card window (10-28): content shows when
// the card is near the viewport (or always, for showcase cards), otherwise a
// sized placeholder stands in.
const cardWindowSource = readFileSync(
  new URL('../src/containers/Home/Stories/hooks/useCardWindow.ts', import.meta.url),
  'utf8'
);
assert.match(
  source,
  /contentShown,\s*placeholderHeight\s*\} = useCardWindow\(\{ cacheKey: placeholderHeightKey, alwaysShow: showcase \}\);/
);
assert.match(cardWindowSource, /const contentShown =\s*alwaysShow \|\|\s*mounted \|\|/);
assert.match(
  source,
  /\{contentShown \? \(\s*<div\s*ref=\{measurePanel\}[\s\S]*?\) : \(\s*<div\s*className=\{`\$\{placeholderClass\}/
);

assert.match(
  source,
  /const homeFeedContentHydrationRequests = new Set<string>\(\);/
);
assert.match(
  source,
  /const hydrationRequestKey = getHomeFeedContentHydrationKey\([\s\S]*?contentType,[\s\S]*?contentId[\s\S]*?\);/
);
assert.match(
  source,
  /homeFeedContentHydrationRequests\.has\(hydrationRequestKey\)/
);
assert.match(
  source,
  /homeFeedContentHydrationRequests\.add\(hydrationRequestKey\)/
);
assert.match(
  source,
  /homeFeedContentHydrationRequests\.delete\(hydrationRequestKey\)/
);
// a stable empty object, so memoized consumers do not see a new {} each render
assert.match(source, /feedPreviewContent = feed\?\.previewContent \|\| EMPTY_PREVIEW_CONTENT;/);

console.log('Home feed card hydration verifier passed.');
