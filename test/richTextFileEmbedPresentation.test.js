import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const fileDownloadSource = readSource(
  '../src/components/Texts/RichText/Markdown/EmbeddedComponent/FileDownload.tsx'
);
const embeddedComponentSource = readSource(
  '../src/components/Texts/RichText/Markdown/EmbeddedComponent/index.tsx'
);
const previewPrimitivesSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/PreviewPrimitives.tsx'
);
const mainStylesSource = readSource(
  '../src/containers/Home/Stories/FeedCard/Body/styles/mainPreviewStyles.ts'
);

assert.match(fileDownloadSource, /className=.*rich-text-file-card/);
assert.match(
  fileDownloadSource,
  /grid-template-columns: 3\.6rem minmax\(0, 1fr\) auto;/
);
assert.match(fileDownloadSource, /width: min\(100%, 42rem\);/);
assert.match(fileDownloadSource, /max-width: 42rem;/);
assert.match(fileDownloadSource, /min-height: 5\.35rem;/);
assert.match(fileDownloadSource, /font-size: 1\.65rem;/);
assert.doesNotMatch(fileDownloadSource, /font-size: 6rem;/);
assert.doesNotMatch(fileDownloadSource, /height: '100%'/);

assert.match(
  embeddedComponentSource,
  /const \{ ext, fileNameFromSrc, fileType \} = useMemo/
);
assert.match(embeddedComponentSource, /getFileInfoFromUrl\(src\)/);
assert.match(
  embeddedComponentSource,
  /const shouldAttemptImage = fileType === 'image' \|\| !ext;/
);
assert.match(
  embeddedComponentSource,
  /src && shouldAttemptImage && !errorLoadingImage/
);
assert.doesNotMatch(fileDownloadSource, /font-size: 0\.[0-9]+rem/);
assert.equal(
  (embeddedComponentSource.match(/extension=\{ext\}/g) || []).length,
  2
);

assert.match(
  previewPrimitivesSource,
  /const shouldAttemptImage = shouldAttemptMarkdownImagePreview\(imageEmbed\)/
);
assert.match(
  previewPrimitivesSource,
  /!shouldAttemptImage \|\| \(failed && fileType !== 'image'\)/
);
assert.match(
  previewPrimitivesSource,
  /data-rich-text-embed-kind="file"[\s\S]*?<FileDownload[\s\S]*?openFile=\{false\}/
);

assert.match(
  mainStylesSource,
  /\.home-feed-card__rich-embed-image\.home-feed-card__rich-file-embed \{[\s\S]*?height: auto;[\s\S]*?border: 0;[\s\S]*?background: transparent;/
);
assert.match(
  mainStylesSource,
  /\.home-feed-card__subject-embed-preview\.home-feed-card__rich-file-embed \{[\s\S]*?flex: 0 0 auto;[\s\S]*?height: auto;[\s\S]*?border: 0;/
);
assert.match(
  mainStylesSource,
  /\.home-feed-card__attachment-preview\.home-feed-card__rich-file-embed \{[\s\S]*?aspect-ratio: auto;[\s\S]*?height: auto;[\s\S]*?border: 0;/
);

console.log('RichText file embed presentation guard passed.');
