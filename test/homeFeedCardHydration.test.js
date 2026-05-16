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

assert.match(
  source,
  /const contentShown = useMemo\(\(\) => inView \|\| isVisible, \[inView, isVisible\]\);/
);
assert.match(
  source,
  /\{contentShown \? \([\s\S]*?<div ref=\{PanelRef\}[\s\S]*?\) : \([\s\S]*?<div className=\{placeholderClass\}/
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
assert.match(source, /feedPreviewContent = feed\?\.previewContent \|\| \{\}/);

console.log('Home feed card hydration verifier passed.');
