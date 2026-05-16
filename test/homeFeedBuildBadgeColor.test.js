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

assert.match(
  targetPreviewSource,
  /<span className="home-feed-card__target-chip build">[\s\S]*Lumine App[\s\S]*<\/span>/
);
assert.match(
  targetPreviewStylesSource,
  /\.home-feed-card__target-chip\.build \{[\s\S]*border-color: \$\{Color\.logoBlue\(0\.25\)\};[\s\S]*background: \$\{Color\.logoBlue\(0\.1\)\};[\s\S]*color: \$\{Color\.logoBlue\(\)\};/
);
assert.match(
  mainContentEmbedSource,
  /&\.compact-main-content-embed--build \.compact-main-content-embed__label \{[^}]*border: 1px solid \$\{Color\.logoBlue\(0\.25\)\};[^}]*background: \$\{Color\.logoBlue\(0\.1\)\};[^}]*color: \$\{Color\.logoBlue\(\)\};/
);
assert.doesNotMatch(
  mainContentEmbedSource,
  /&\.compact-main-content-embed--build \.compact-main-content-embed__label \{[^}]*color: var\(--embed-accent\);/
);
assert.match(
  mainPreviewStylesSource,
  /\.home-feed-card__build-badge \{[\s\S]*background: \$\{Color\.logoBlue\(0\.12\)\};[\s\S]*color: \$\{Color\.logoBlue\(\)\};/
);

console.log('Home feed Lumine badge color verifier passed.');
