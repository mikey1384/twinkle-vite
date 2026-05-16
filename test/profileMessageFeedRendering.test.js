import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const feedCardSource = readSource(
  '../src/containers/Home/Stories/FeedCard/index.tsx'
);
const bodySource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/index.tsx'
);
const targetPreviewSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/TargetPreview.tsx'
);
const sizingSource = readSource(
  '../src/containers/Home/Stories/FeedCard/helpers/sizing.ts'
);

assert.match(feedCardSource, /function mergePreviewTargetSecretState/);
assert.match(
  feedCardSource,
  /normalizeRootType\(rootType\) === 'user'[\s\S]*return mergeProfileTargetObj/
);
assert.match(feedCardSource, /function mergeProfileTargetObj/);
assert.doesNotMatch(
  feedCardSource.match(/function mergeProfileTargetObj[\s\S]*?function getProfileTargetObj/)?.[0] || '',
  /comment:/
);
assert.match(feedCardSource, /const HOME_FEED_CARD_TAP_SCROLL_THRESHOLD_PX = 2;/);
assert.match(feedCardSource, /function getHomeFeedScrollDelta/);
assert.match(feedCardSource, /getHomeFeedScrollDelta\(tapNavigation\)/);

assert.match(bodySource, /const targetUser = getTargetUser\(content\?\.targetObj\);/);
assert.match(bodySource, /targetUser={targetUser}/);

assert.match(targetPreviewSource, /import ProfilePanelPreview/);
assert.match(
  targetPreviewSource,
  /contentType === 'comment' && normalizedRootType === 'user'[\s\S]*<ProfilePanelPreview/
);
assert.match(targetPreviewSource, /targetComment && !targetComment\.notFound/);
assert.ok(
  targetPreviewSource.indexOf("normalizedRootType === 'user'") <
    targetPreviewSource.indexOf('targetComment && !targetComment.notFound'),
  'profile target branch must run before target comment branch'
);
assert.match(targetPreviewSource, /targetContentType === 'user'/);
assert.match(targetPreviewSource, /`\/users\/\$\{target\.username\}`/);

assert.match(
  sizingSource,
  /content\?\.contentType === 'comment' && normalizedRootType === 'user'[\s\S]*buildTargetSizing\('standard'\)/
);
assert.doesNotMatch(
  sizingSource,
  /if \(normalizedRootType === 'user'\) \{\s*return null;\s*\}/
);

console.log('Profile message feed rendering verifier passed.');
