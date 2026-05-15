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
