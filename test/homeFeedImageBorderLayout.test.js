import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const bodySource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/index.tsx'
);
const mainStylesSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/styles/mainPreviewStyles.ts'
);
const previewPrimitivesSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/PreviewPrimitives.tsx'
);
const targetStylesSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/styles/targetPreviewStyles.ts'
);

assert.match(
  bodySource,
  /isImageEmbed \? ' home-feed-card__rich-embed-preview--image'/
);
assert.match(
  mainStylesSource,
  /\.home-feed-card__rich-embed-preview--with-text\.home-feed-card__rich-embed-preview--image[\s\S]*?> \.home-feed-card__rich-embed-image \{[\s\S]*?border: 0;[\s\S]*?background: transparent;/
);
assert.match(
  previewPrimitivesSource,
  /data-attachment-preview-kind=\{fileType\}/
);
assert.match(
  targetStylesSource,
  /\.home-feed-card__target-media-wrap\[data-attachment-preview-kind='image'\] \{[\s\S]*?border: 0;[\s\S]*?background: transparent;/
);

console.log('Home feed image border layout guard passed.');
