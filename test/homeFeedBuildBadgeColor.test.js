import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const targetPreviewSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/TargetPreview.tsx'
);
const targetPreviewStylesSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/styles/targetPreviewStyles.ts'
);
const mainContentEmbedSource = readSource(
  '../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/MainContentComponent.tsx'
);
const mainPreviewStylesSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/styles/mainPreviewStyles.ts'
);

// The "Lumine App" chip and its build-badge were replaced by the shared
// BuildMiniCard in 9190fb1a2 ("refactor build list item"), so a build target
// now renders as a real build card instead of a labelled chip.
assert.match(
  targetPreviewSource,
  /function renderTargetBuildPreview\(target: any\) \{[\s\S]{0,400}<BuildMiniCard/
);
assert.match(
  targetPreviewSource,
  /className="home-feed-card__target-build-card"/
);
assert.match(
  targetPreviewStylesSource,
  /\.home-feed-card__target-build-card \{/
);
assert.match(
  mainContentEmbedSource,
  /&\.compact-main-content-embed--build \.compact-main-content-embed__label \{[^}]*border: 1px solid \$\{Color\.logoBlue\(0\.25\)\};[^}]*background: \$\{Color\.logoBlue\(0\.1\)\};[^}]*color: \$\{Color\.logoBlue\(\)\};/
);
assert.doesNotMatch(
  mainContentEmbedSource,
  /&\.compact-main-content-embed--build \.compact-main-content-embed__label \{[^}]*color: var\(--embed-accent\);/
);
// The badge moved into BuildMiniCard with the same blue treatment, now as
// literal values rather than Color.logoBlue() tokens.
const buildMiniCardSource = readSource(
  '../src/components/Build/Cards/BuildMiniCard.tsx'
);
assert.match(
  buildMiniCardSource,
  /const badgeClass = css`[\s\S]{0,400}background: rgba\(65, 140, 235, 0\.12\);[\s\S]{0,80}color: #1d4ed8;/
);
assert.match(buildMiniCardSource, /'build-mini-card__badge'/);

console.log('Home feed Lumine badge color verifier passed.');
