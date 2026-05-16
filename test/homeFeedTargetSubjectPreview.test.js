import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const targetPreviewSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/TargetPreview.tsx'
);
const targetStylesSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/styles/targetPreviewStyles.ts'
);

assert.match(targetPreviewSource, /const uploaderName = getTargetUploaderName\(target\);/);
assert.match(
  targetPreviewSource,
  /<span className="home-feed-card__target-subject-meta">[\s\S]*Posted by \{uploaderName\}[\s\S]*<\/span>/
);
assert.match(targetPreviewSource, /function getTargetUploaderName/);
assert.match(targetPreviewSource, /uploader\?\.username/);
assert.match(targetPreviewSource, /target\?\.uploaderUsername/);
assert.match(targetStylesSource, /home-feed-card__target-subject-meta/);
assert.match(targetStylesSource, /font-size: max\(1\.12rem, 11\.2px\);/);
assert.match(targetStylesSource, /text-overflow: ellipsis;/);

console.log('Home feed target subject preview verifier passed.');
