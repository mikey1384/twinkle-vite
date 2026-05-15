import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const compactCommentEmbedSource = readSource(
  'src/components/Comments/CompactCommentEmbedPreview.tsx'
);
const aiCardEmbedHelpersSource = readSource('src/helpers/aiCardEmbedHelpers.ts');
const mainContentComponentSource = readSource(
  'src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/MainContentComponent.tsx'
);
const internalComponentSource = readSource(
  'src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/index.tsx'
);
const previewPrimitivesSource = readSource(
  'src/containers/Home/Stories/FeedCard/Body/PreviewPrimitives.tsx'
);
const targetPreviewSource = readSource(
  'src/containers/Home/Stories/FeedCard/Body/TargetPreview.tsx'
);
const feedCardBodySource = readSource(
  'src/containers/Home/Stories/FeedCard/Body/index.tsx'
);
const commentPreviewStylesSource = readSource(
  'src/containers/Home/Stories/FeedCard/Body/styles/commentPreviewStyles.ts'
);
const contentPanelCommentSource = readSource(
  'src/components/ContentPanel/TargetContent/Comment.tsx'
);
const stringHelpersSource = readSource('src/helpers/stringHelpers.tsx');

assert.match(
  compactCommentEmbedSource,
  /export default function CompactCommentEmbedPreview/
);
assert.match(compactCommentEmbedSource, /ProfilePic/);
assert.match(compactCommentEmbedSource, /UsernameText/);
assert.match(compactCommentEmbedSource, /RichText/);
assert.match(compactCommentEmbedSource, /ContentFileViewer/);
assert.match(compactCommentEmbedSource, /CardThumb/);
assert.match(compactCommentEmbedSource, /data-compact-comment-embed="true"/);
assert.match(compactCommentEmbedSource, /getInternalEmbedPreviewInfo/);
assert.match(compactCommentEmbedSource, /getInternalEmbedCommentLabel/);
assert.match(compactCommentEmbedSource, /targetRootUsernameTextStyle/);
assert.match(compactCommentEmbedSource, /showTypeLabel = true/);
assert.match(compactCommentEmbedSource, /variant\?: 'compact' \| 'targetRoot'/);
assert.match(compactCommentEmbedSource, /variant = 'compact'/);
assert.match(
  compactCommentEmbedSource,
  /{showTypeLabel \? <span>Comment<\/span> : null}/
);

assert.match(compactCommentEmbedSource, /getAttachmentInfo\(comment\)/);
assert.match(compactCommentEmbedSource, /actualFilePath \|\| comment\?\.filePath/);
assert.match(compactCommentEmbedSource, /thumbUrl/);
assert.match(compactCommentEmbedSource, /contentType="comment"/);
assert.match(compactCommentEmbedSource, /compactMode/);

assert.match(compactCommentEmbedSource, /getMarkdownMediaEmbeds\(rawContent\)/);
assert.match(compactCommentEmbedSource, /removeMarkdownMediaEmbeds\(rawContent\)/);
assert.match(compactCommentEmbedSource, /type: 'image' \| 'internal' \| 'link' \| 'video'/);
assert.match(compactCommentEmbedSource, /const internalInfo = getInternalEmbedPreviewInfo\(src\) \|\| undefined/);
assert.match(compactCommentEmbedSource, /if \(internalInfo\) \{[\s\S]*return 'internal';/);
assert.match(compactCommentEmbedSource, /hei\[cf\]/);
assert.match(compactCommentEmbedSource, /if \(embed\.type === 'internal'\) \{/);
assert.match(compactCommentEmbedSource, /embed\.internalInfo\?\.label \|\| 'Twinkle content'/);
assert.match(compactCommentEmbedSource, /return getInternalEmbedCommentLabel\(item\.embed\.internalInfo \|\| null\)/);
assert.match(compactCommentEmbedSource, /function MarkdownAICardPreview/);
assert.match(compactCommentEmbedSource, /function MarkdownBuildPreview/);
assert.match(compactCommentEmbedSource, /<CardThumb card={card as any} \/>/);
assert.match(compactCommentEmbedSource, /contentType: 'build'/);
assert.match(compactCommentEmbedSource, /compact-comment-embed__media-tile ai-card/);
assert.match(compactCommentEmbedSource, /compact-comment-embed__media-tile build/);
assert.match(
  compactCommentEmbedSource,
  /shownMediaItems = mediaItems\.slice\(0, isTargetRoot \? 1 : 2\)/
);
assert.match(compactCommentEmbedSource, /extraMediaCount/);
assert.match(compactCommentEmbedSource, /getEmbedSvgRepairImageUrl/);
assert.match(compactCommentEmbedSource, /fetchedVideoCodeFromURL/);
assert.match(compactCommentEmbedSource, /compact-comment-embed--target-root/);
assert.match(compactCommentEmbedSource, /MarkdownLinkPreview/);
assert.match(compactCommentEmbedSource, /width: isTargetRoot \? '5\.45rem'/);
assert.match(compactCommentEmbedSource, /var\(--home-feed-target-accent/);
assert.match(compactCommentEmbedSource, /box-shadow: 0 0\.12rem/);
assert.match(
  compactCommentEmbedSource,
  /&\.compact-comment-embed--target-root \{[\s\S]*grid-template-columns: 6rem minmax\(0, 1fr\);/
);
assert.match(
  compactCommentEmbedSource,
  /&\.compact-comment-embed--target-root \{[\s\S]*grid-template-columns: 5rem minmax\(0, 1fr\);/
);
assert.match(compactCommentEmbedSource, /font-size: max\(1\.78rem, 17\.8px\);/);
assert.match(compactCommentEmbedSource, /font-size: max\(1\.72rem, 17\.2px\);/);
assert.match(compactCommentEmbedSource, /font-weight: 650;/);
assert.match(compactCommentEmbedSource, /font-weight: 500;/);
assert.match(
  compactCommentEmbedSource,
  /textStyle={isTargetRoot \? targetRootUsernameTextStyle : undefined}/
);
assert.doesNotMatch(compactCommentEmbedSource, /font-weight: 720;/);
assert.doesNotMatch(compactCommentEmbedSource, /font-weight: 760;/);
assert.match(compactCommentEmbedSource, /compact-main-content-embed__copy strong/);
assert.match(compactCommentEmbedSource, /compact-main-content-embed__attachment/);

assert.match(
  mainContentComponentSource,
  /if \(contentType === 'comment'\)[\s\S]*<CompactCommentEmbedPreview/
);
assert.match(
  targetPreviewSource,
  /function renderTargetCommentPreview[\s\S]*<CompactCommentEmbedPreview/
);
assert.match(targetPreviewSource, /className="home-feed-card__target-comment-preview"/);
assert.match(targetPreviewSource, /showTypeLabel={false}/);
assert.match(targetPreviewSource, /variant="targetRoot"/);
assert.doesNotMatch(
  targetPreviewSource,
  /className="home-feed-card__target-comment"/
);
assert.match(mainContentComponentSource, /showCompactCommentTypeLabel = true/);
assert.match(mainContentComponentSource, /showTypeLabel={showCompactCommentTypeLabel}/);
assert.match(internalComponentSource, /showCompactCommentTypeLabel = true/);
assert.match(
  internalComponentSource,
  /showCompactCommentTypeLabel={showCompactCommentTypeLabel}/
);
assert.match(previewPrimitivesSource, /showCompactCommentTypeLabel={false}/);
assert.match(aiCardEmbedHelpersSource, /export function isAICardEmbedSrc/);
assert.match(aiCardEmbedHelpersSource, /export function getInternalEmbedPreviewInfo/);
assert.match(aiCardEmbedHelpersSource, /kind: 'aiCard'/);
assert.match(aiCardEmbedHelpersSource, /kind: 'build'/);
assert.match(aiCardEmbedHelpersSource, /kind: 'profile'/);
assert.match(aiCardEmbedHelpersSource, /kind: 'subject'/);
assert.match(aiCardEmbedHelpersSource, /kind: 'comment'/);
assert.match(aiCardEmbedHelpersSource, /kind: 'url'/);
assert.match(aiCardEmbedHelpersSource, /return 'shared an app'/);
assert.match(aiCardEmbedHelpersSource, /return 'shared a profile'/);
assert.match(aiCardEmbedHelpersSource, /return 'shared a subject'/);
assert.match(aiCardEmbedHelpersSource, /return 'shared a comment'/);
assert.match(aiCardEmbedHelpersSource, /return 'shared a link'/);
assert.match(feedCardBodySource, /getInternalEmbedPreviewInfo/);
assert.match(feedCardBodySource, /PreviewCommentBuildMedia/);
assert.match(feedCardBodySource, /PreviewCommentAICardMedia/);
assert.match(feedCardBodySource, /const commentTextIsMessage = hasPreviewCommentMessageText\(comment\)/);
assert.match(feedCardBodySource, /home-feed-card__comment-preview-text--message/);
assert.match(feedCardBodySource, /function hasPreviewCommentMessageText/);
assert.match(feedCardBodySource, /kind: 'aiCard'/);
assert.match(feedCardBodySource, /kind: 'build'/);
assert.match(feedCardBodySource, /const card = useMemo\(\(\) => \(\{ id: cardId \}\), \[cardId\]\)/);
assert.match(feedCardBodySource, /<CardThumb card={card as any} \/>/);
assert.match(feedCardBodySource, /contentType: 'build'/);
assert.match(feedCardBodySource, /getInternalEmbedCommentLabel\(internalInfo\)/);
assert.match(feedCardBodySource, /getInternalEmbedCommentLabel\(getInternalEmbedPreviewInfo\(embed\.src\)\)/);
assert.doesNotMatch(
  feedCardBodySource,
  /if \(embed\.type === 'internal'\) return 'shared a link'/
);
assert.match(commentPreviewStylesSource, /home-feed-card__comment-preview-media--ai-card/);
assert.match(commentPreviewStylesSource, /home-feed-card__comment-preview-media--build/);
assert.match(commentPreviewStylesSource, /home-feed-card__comment-preview-text--message/);
assert.match(commentPreviewStylesSource, /font-weight: 500;/);
assert.match(stringHelpersSource, /'heic'/);
assert.match(stringHelpersSource, /'heif'/);
assert.match(stringHelpersSource, /export function stripTextSizeMarkers/);
assert.match(feedCardBodySource, /stripTextSizeMarkers\(text\)/);
assert.doesNotMatch(
  feedCardBodySource,
  /return text\s*\n\s*\.replace\(\s*\/\\\[\(\[\^\\\]\]\+\)\\\]\\\(\(\[\^\)\]\+\)\\\)\/g/
);

assert.match(contentPanelCommentSource, /ContentFileViewer/);
assert.match(contentPanelCommentSource, /ProfilePic/);
assert.match(contentPanelCommentSource, /UsernameText/);

console.log('CompactCommentEmbedPreview guard passed.');
