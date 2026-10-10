import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const componentSource = readSource(
  'src/components/DailyReflectionMetaBadges/index.tsx'
);
const mainContentSource = readSource(
  'src/components/ContentPanel/Body/MainContent/ContentDisplay/Content.tsx'
);
const targetContentSource = readSource(
  'src/components/ContentPanel/TargetDailyReflectionContent.tsx'
);
const feedBodySource = readSource(
  'src/containers/Home/Stories/FeedCard/Body/index.tsx'
);
const feedTargetPreviewSource = readSource(
  'src/containers/Home/Stories/FeedCard/Body/TargetPreview.tsx'
);

const reflectionSurfaces = [
  mainContentSource,
  targetContentSource,
  feedBodySource,
  feedTargetPreviewSource
];

assert.match(
  componentSource,
  /export default function DailyReflectionMetaBadges/
);
assert.match(componentSource, /XPAndStreakDisplay/);
assert.match(componentSource, /getDailyReflectionMasterpieceLabel/);
assert.match(componentSource, /formatDailyReflectionMasterpieceType/);
assert.match(
  componentSource,
  /Masterpiece \(\$\{formatDailyReflectionMasterpieceType/
);
assert.match(componentSource, /AI-polished/);
assert.match(componentSource, /linear-gradient\(135deg/);

for (const source of reflectionSurfaces) {
  assert.match(source, /DailyReflectionMetaBadges/);
  assert.doesNotMatch(source, /AI-polished/);
  assert.doesNotMatch(source, /grade === 'Masterpiece'/);
  assert.doesNotMatch(source, /home-feed-card__masterpiece-chip/);
  assert.doesNotMatch(source, /home-feed-card__refined-chip/);
  assert.doesNotMatch(source, /target-reflection-badge--masterpiece/);
  assert.doesNotMatch(source, /target-reflection-badge--refined/);
  assert.doesNotMatch(source, /XPAndStreakDisplay/);
}

assert.match(feedBodySource, /density="compact"/);
assert.match(feedTargetPreviewSource, /density="compact"/);
assert.match(mainContentSource, /style=\{\{ marginTop: '1rem' \}\}/);
assert.match(targetContentSource, /style=\{\{ marginTop: '1rem' \}\}/);

console.log('DailyReflectionMetaBadges guard passed.');

// 2026-10-10: an author's own edit of a shared reflection shows "Edited" in
// the AI-polished spot, and replaces it (never both): the wording is theirs.
assert.match(componentSource, /isEdited\?: boolean;/);
assert.match(
  componentSource,
  /const textLabel: 'edited' \| 'refined' \| null = isEdited\s*\?\s*'edited'\s*:\s*isRefined\s*\?\s*'refined'\s*:\s*null;/
);
assert.match(componentSource, /<span style=\{\{ fontStyle: 'italic' \}\}>Edited<\/span>/);
assert.match(
  componentSource,
  /textLabel === 'edited' \? \([\s\S]*daily-reflection-meta-badges__edited[\s\S]*\) : textLabel === 'refined' \? \(/
);
for (const source of reflectionSurfaces) {
  assert.match(source, /isEdited=\{[a-zA-Z]+\??\.isEdited\}/);
  assert.doesNotMatch(source, />Edited</);
}

const editorSource = readSource(
  'src/components/ContentPanel/Body/ContentEditor/index.tsx'
);
const bottomInterfaceSource = readSource(
  'src/components/ContentPanel/Body/BottomInterface.tsx'
);
const contentDisplaySource = readSource(
  'src/components/ContentPanel/Body/MainContent/ContentDisplay/index.tsx'
);
// Only the author gets Edit on a reflection (never a moderator by level).
assert.match(
  bottomInterfaceSource,
  /if \(contentType === 'dailyReflection'\) \{\s*return !!userId && userId === uploader\.id;\s*\}/
);
// Saving goes through the reflection's own route, and a failed save keeps the
// editor open with the reason shown inline.
assert.match(contentDisplaySource, /editDailyReflection\(\{/);
assert.match(editorSource, /setSubmitError\(\s*error\?\.message/);
assert.match(editorSource, /role="alert"/);
// The phone feed footer places Edited exactly where it places AI-polished.
const mobileFeedStyles = readSource(
  'src/containers/Home/Stories/FeedCard/Body/styles/mobilePreviewStyles.ts'
);
assert.match(
  mobileFeedStyles,
  /\.daily-reflection-meta-badges__refined,\s*\S+\s*\.daily-reflection-meta-badges__edited \{\s*grid-column: 2;/
);
