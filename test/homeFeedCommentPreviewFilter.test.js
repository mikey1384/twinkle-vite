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

assert.match(
  bodySource,
  /export function getRenderableHomeFeedPreviewComments/
);
assert.match(bodySource, /!comment\.isNotification/);
assert.match(bodySource, /!comment\.isDeleteNotification/);
assert.doesNotMatch(bodySource, /viewed the secret message/);
assert.doesNotMatch(bodySource, /this comment was deleted/);

assert.match(feedCardSource, /getRenderableHomeFeedPreviewComments/);
assert.match(
  feedCardSource,
  /const hasPreviewCommentSlot =\s*!secretHiddenForPreview && renderablePreviewComments\.length > 0;/
);
assert.match(
  feedCardSource,
  /__homeFeedHasCommentPreview: hasPreviewCommentSlot/
);
assert.match(
  feedCardSource,
  /contentShown &&\s*!secretHiddenForPreview[\s\S]*renderablePreviewComments\.length === 0;/
);
assert.match(feedCardSource, /limit: 5/);
assert.match(feedCardSource, /function getHomeFeedSecretHidden/);
assert.match(feedCardSource, /hasHomeFeedSubjectSecret\(content\)/);
assert.match(feedCardSource, /hasHomeFeedSubjectSecret\(targetObj\?\.subject\)/);
assert.match(feedCardSource, /hasHomeFeedSubjectSecret\(rootObj\)/);

console.log('Home feed comment preview filter verifier passed.');
