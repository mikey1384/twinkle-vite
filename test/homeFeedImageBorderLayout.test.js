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
const subjectMediaPreviewSource = readSource(
  '../src/components/Subjects/SubjectMediaPreview.tsx'
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
  subjectMediaPreviewSource,
  /data-attachment-preview-kind=\{fileType\}/
);
assert.match(
  subjectMediaPreviewSource,
  /fillPreview=\{fileType === 'image'\}[\s\S]*?previewObjectFit=\{fileType === 'image' \? 'contain' : undefined\}/
);
assert.match(
  mainStylesSource,
  /\.home-feed-card__attachment-preview--subject-image \{[\s\S]*?border: 0;[\s\S]*?background: \$\{Color\.whiteGray\(\)\};/
);
assert.match(
  targetStylesSource,
  /\.home-feed-card__target-media-wrap\[data-attachment-preview-kind='image'\] \{[\s\S]*?border: 0;[\s\S]*?background: \$\{Color\.whiteGray\(\)\};/
);

console.log('Home feed image border layout guard passed.');
