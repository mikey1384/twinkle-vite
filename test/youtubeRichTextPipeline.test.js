import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const embeddedComponentSource = readSource(
  'src/components/Texts/RichText/Markdown/EmbeddedComponent/index.tsx'
);
const stringHelpersSource = readSource('src/helpers/stringHelpers.tsx');
const feedSizingSource = readSource(
  'src/containers/Home/Stories/FeedCard/helpers/sizing.ts'
);
const compactCommentSource = readSource(
  'src/components/Comments/CompactCommentEmbedPreview.tsx'
);

assert.match(
  stringHelpersSource,
  /export function isValidYoutubeUrl[\s\S]*return isYouTubeVideoUrl\(url\);/
);
assert.match(
  stringHelpersSource,
  /export function fetchedVideoCodeFromURL[\s\S]*return getYouTubeVideoId\(url\);/
);
assert.match(
  embeddedComponentSource,
  /const isYouTube = useMemo\(\(\) => isValidYoutubeUrl\(src\), \[src\]\);/
);
assert.match(feedSizingSource, /if \(isYouTubeVideoUrl\(src\)\) \{/);
assert.doesNotMatch(feedSizingSource, /function isYoutubeUrl/);
assert.match(compactCommentSource, /if \(isValidYoutubeUrl\(src\)\) \{/);

console.log('Shared YouTube RichText pipeline guard passed.');
