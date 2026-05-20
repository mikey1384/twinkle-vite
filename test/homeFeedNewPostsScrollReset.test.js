import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const storiesSource = readFileSync(
  new URL('../src/containers/Home/Stories/index.tsx', import.meta.url),
  'utf8'
);
const appShellScrollSource = readFileSync(
  new URL('../src/helpers/appShellScroll.ts', import.meta.url),
  'utf8'
);
const handleFetchNewFeedsSource = storiesSource.slice(
  storiesSource.indexOf('async function handleFetchNewFeeds()'),
  storiesSource.indexOf('async function handleRefreshOutdatedFeed()')
);

assert.ok(
  handleFetchNewFeedsSource.includes("onChangeSubFilter('all')"),
  'Expected new-post banner flow to switch into All posts.'
);
assert.ok(
  handleFetchNewFeedsSource.includes("onChangeCategory('uploads')"),
  'Expected new-post banner flow to switch into the uploads category when needed.'
);
assert.equal(
  (handleFetchNewFeedsSource.match(/scrollToNewestHomeFeed\(\);/g) || [])
    .length,
  2,
  'Expected both new-post refresh branches to reset scroll to the newest feed.'
);
assert.match(
  storiesSource,
  /function scrollToNewestHomeFeed\(\) \{[\s\S]*resetAppShellScroll\(\{[\s\S]*suppressAnchorRestoresMs: homeFeedNewPostsScrollResetSuppressionMs[\s\S]*\}\);[\s\S]*\}/,
  'Expected new-post scroll reset to suppress saved feed-anchor restores.'
);
assert.match(
  appShellScrollSource,
  /suppressAnchorRestoresMs = 0/,
  'Expected app-shell scroll reset to support optional anchor-restore suppression.'
);
assert.match(
  appShellScrollSource,
  /suppressScrollAnchorRestores\(suppressAnchorRestoresMs\);/,
  'Expected app-shell scroll reset to suppress future anchor restores when requested.'
);

console.log('Home feed new-post scroll reset verifier passed.');
