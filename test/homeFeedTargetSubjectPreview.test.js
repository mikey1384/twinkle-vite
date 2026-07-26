import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

// The "Posted by" attribution moved out of TargetPreview into this shared
// subject preview component (commit 4ba5877dc), and getTargetUploaderName
// became getSubjectUploaderName. The guarded behaviour is unchanged.
const subjectTargetPreviewSource = readSource(
  '../src/components/Subjects/HomeFeedSubjectTargetPreview.tsx'
);
const targetStylesSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/styles/targetPreviewStyles.ts'
);

assert.match(
  subjectTargetPreviewSource,
  /const resolvedUploaderName =/
);
assert.match(
  subjectTargetPreviewSource,
  /<span className="home-feed-card__target-subject-meta">[\s\S]*Posted by \{resolvedUploaderName\}[\s\S]*<\/span>/
);
assert.match(subjectTargetPreviewSource, /function getSubjectUploaderName/);
assert.match(subjectTargetPreviewSource, /uploader\?\.username/);
assert.match(subjectTargetPreviewSource, /uploaderUsername/);
assert.match(targetStylesSource, /home-feed-card__target-subject-meta/);
assert.match(targetStylesSource, /font-size: max\(1\.12rem, 11\.2px\);/);
assert.match(targetStylesSource, /text-overflow: ellipsis;/);

console.log('Home feed target subject preview verifier passed.');
