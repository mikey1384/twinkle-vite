import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const compactCommentEmbedSource = readSource(
  'src/components/Comments/CompactCommentEmbedPreview.tsx'
);
const aiCardEmbedHelpersSource = readSource(
  'src/helpers/aiCardEmbedHelpers.ts'
);
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
const richTextMarkerHelpersSource = readSource(
  'src/helpers/richTextMarkerHelpers.ts'
);

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
assert.match(
  compactCommentEmbedSource,
  /onClick={interactive \? handleOpen : undefined}/
);
assert.doesNotMatch(compactCommentEmbedSource, /onClick={stopNestedClick}/);
assert.doesNotMatch(compactCommentEmbedSource, /function stopNestedClick/);
assert.match(compactCommentEmbedSource, /getInternalEmbedPreviewInfo/);
assert.match(compactCommentEmbedSource, /getInternalEmbedCommentLabel/);
assert.match(compactCommentEmbedSource, /targetRootUsernameTextStyle/);
assert.match(compactCommentEmbedSource, /showTypeLabel = true/);
assert.match(
  compactCommentEmbedSource, // A 'column' variant was added later; compact and targetRoot both survive.
  /variant\?: 'column' \| 'compact' \| 'targetRoot'/
);
assert.match(compactCommentEmbedSource, /variant = 'compact'/);
// The "this is a comment" cue is a small muted icon beside the author in the
// meta line (2026-10-12): the old "Comment" label and the icon-only
// "Comment" media tile for nested comments sat apart from, or over, the text.
assert.doesNotMatch(compactCommentEmbedSource, /<span>Comment<\/span>/);
assert.match(
  compactCommentEmbedSource,
  /{showTypeLabel \? \([\s\S]*?className="compact-comment-embed__type-cue"[\s\S]*?<Icon icon="comment" \/>/
);
// Nested comments (and other icon-only embeds) read as a one-line reference
// under the text instead of a media tile.
assert.match(
  compactCommentEmbedSource,
  /if \(kind === 'comment'\) return false;/
);
assert.match(compactCommentEmbedSource, /function CommentReferenceLine/);
assert.match(compactCommentEmbedSource, /compact-comment-embed__reference/);
// Each reference opens what it names (not the outer comment), and a
// deleted or failed nested comment says so instead of an empty chip.
assert.match(compactCommentEmbedSource, /to={`\/comments\/\$\{commentId\}`}/);
assert.match(compactCommentEmbedSource, /'Comment unavailable'/);
// Round 3 (2026-10-12): a reference's tap target is its own box only (an
// overlay reaching past it stole taps from the comment text above); plain
// left clicks go through the surface's nested-navigation handler (the feed
// card's), modified clicks are left to the browser, bare "www." links are
// read as https and only http(s) gets an href, and a preview holding links
// is not role="button" (it gets a hidden "Open comment" button instead).
assert.doesNotMatch(
  compactCommentEmbedSource,
  /compact-comment-embed__reference--link::after/
);
assert.match(compactCommentEmbedSource, /useNestedNavigate\(\)/);
assert.match(
  compactCommentEmbedSource,
  /if \(!to \|\| isModifiedClick\(event\)\) return;/
);
// link safety (http(s) only, one leading slash) lives in referenceLinkHelpers
// and is exercised in test/referenceLinkHelpers.test.ts
assert.match(
  compactCommentEmbedSource,
  /from '~\/helpers\/referenceLinkHelpers'/
);
assert.match(compactCommentEmbedSource, /getInternalPath\(embed\.src/);
assert.match(
  compactCommentEmbedSource,
  /const outerIsButton = interactive && !hasReferences;/
);
assert.match(
  compactCommentEmbedSource,
  /role={outerIsButton \? 'button' : undefined}/
);
assert.match(
  feedCardBodySource,
  /<NestedNavigationContext\.Provider value={onNavigate}>/
);
assert.match(compactCommentEmbedSource, /'Loading comment…'/);
assert.match(
  compactCommentEmbedSource,
  /function handleClick\(event[\s\S]*?event\.stopPropagation\(\);[\s\S]*?navigate\(to\)/
);
// The stacked media layout is for the home feed's fixed slots only; every
// other surface keeps the side-by-side row and its narrow-container rule.
assert.match(compactCommentEmbedSource, /@container \(max-width: 28rem\)/);
assert.match(
  compactCommentEmbedSource,
  /\.home-feed-card__body\s*&\.compact-comment-embed--has-media/
);
assert.doesNotMatch(
  compactCommentEmbedSource,
  /\n  &\.compact-comment-embed--has-media:not\(\s*\.compact-comment-embed--target-root\s*\):not\(\.compact-comment-embed--column\),\n  &\.compact-comment-embed--media-only:not\(\s*\.compact-comment-embed--target-root\s*\):not\(\.compact-comment-embed--column\) \{\n    grid-template-columns: 4\.2rem minmax\(0, 1fr\);\n    grid-template-rows: auto/
);

// The snapshot the preview is handed is overlaid with the canonical comment
// state before anything is read off it.
assert.match(compactCommentEmbedSource, /getAttachmentInfo\(liveComment\)/);
assert.match(
  compactCommentEmbedSource,
  /actualFilePath \|\| comment\?\.filePath/
);
assert.match(compactCommentEmbedSource, /thumbUrl/);
assert.match(compactCommentEmbedSource, /contentType="comment"/);
assert.match(compactCommentEmbedSource, /compactMode/);

assert.match(compactCommentEmbedSource, /getMarkdownMediaEmbeds\(rawContent\)/);
assert.match(
  compactCommentEmbedSource,
  /removeMarkdownMediaEmbeds\(rawContent\)/
);
assert.match(
  compactCommentEmbedSource,
  /type: 'image' \| 'internal' \| 'link' \| 'video'/
);
assert.match(
  compactCommentEmbedSource,
  /const internalInfo = getInternalEmbedPreviewInfo\(src\) \|\| undefined/
);
assert.match(
  compactCommentEmbedSource,
  /if \(internalInfo\) \{[\s\S]*return 'internal';/
);
assert.match(compactCommentEmbedSource, /hei\[cf\]/);
assert.match(compactCommentEmbedSource, /if \(embed\.type === 'internal'\) \{/);
assert.match(
  compactCommentEmbedSource,
  // The brand name moved to SITE_NAME (lumine.network rebrand).
  /embed\.internalInfo\?\.label \|\| `\$\{SITE_NAME\} content`/
);
assert.match(
  compactCommentEmbedSource,
  /return getInternalEmbedCommentLabel\(item\.embed\.internalInfo \|\| null\)/
);
assert.match(compactCommentEmbedSource, /function MarkdownAICardPreview/);
assert.match(compactCommentEmbedSource, /function MarkdownBuildPreview/);
assert.match(compactCommentEmbedSource, /<CardThumb card={card as any} \/>/);
assert.match(compactCommentEmbedSource, /contentType: 'build'/);
assert.match(
  compactCommentEmbedSource,
  /compact-comment-embed__media-tile ai-card/
);
assert.match(
  compactCommentEmbedSource,
  /compact-comment-embed__media-tile build/
);
assert.match(
  compactCommentEmbedSource,
  // The column variant shows a single tile too.
  /shownMediaItems = mediaItems\.slice\(0, isTargetRoot \|\| isColumn \? 1 : 2\)/
);
assert.match(compactCommentEmbedSource, /extraMediaCount/);
assert.match(compactCommentEmbedSource, /getEmbedSvgRepairImageUrl/);
assert.match(compactCommentEmbedSource, /fetchedVideoCodeFromURL/);
assert.match(compactCommentEmbedSource, /compact-comment-embed--target-root/);
assert.match(compactCommentEmbedSource, /MarkdownLinkPreview/);
assert.match(compactCommentEmbedSource, /width: isTargetRoot\s*\? '5\.45rem'/);
assert.match(compactCommentEmbedSource, /var\(--home-feed-target-accent/);
// The raised card treatment was flattened in df993b8ec ("more home feed card
// layout fixes"); the embed is deliberately shadowless now.
assert.match(compactCommentEmbedSource, /box-shadow: none;/);
assert.doesNotMatch(compactCommentEmbedSource, /box-shadow: 0 0\.12rem/);
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
assert.match(
  compactCommentEmbedSource,
  /compact-main-content-embed__copy\s*strong/
);
assert.match(
  compactCommentEmbedSource,
  /compact-main-content-embed__attachment/
);

assert.match(
  mainContentComponentSource,
  /if \(contentType === 'comment'\)[\s\S]*<CompactCommentEmbedPreview/
);
assert.match(
  targetPreviewSource,
  /function renderTargetCommentPreview[\s\S]*<CompactCommentEmbedPreview/
);
assert.match(
  targetPreviewSource,
  /className="home-feed-card__target-comment-preview"/
);
assert.match(targetPreviewSource, /showTypeLabel={false}/);
assert.match(targetPreviewSource, /variant="targetRoot"/);
assert.doesNotMatch(
  targetPreviewSource,
  /className="home-feed-card__target-comment"/
);
assert.match(mainContentComponentSource, /showCompactCommentTypeLabel = true/);
assert.match(
  mainContentComponentSource,
  /showTypeLabel={showCompactCommentTypeLabel}/
);
assert.match(internalComponentSource, /showCompactCommentTypeLabel = true/);
assert.match(
  internalComponentSource,
  /showCompactCommentTypeLabel={showCompactCommentTypeLabel}/
);
// Feed embeds keep the quiet comment cue; only the target-root comment (whose
// card header already says "X's comment") hides it.
assert.doesNotMatch(
  previewPrimitivesSource,
  /showCompactCommentTypeLabel={false}/
);
// The latest-comment strip already says "replied"/"commented"; its separate
// trailing comment icon is gone.
assert.doesNotMatch(feedCardBodySource, /home-feed-card__comment-preview-icon/);
assert.match(aiCardEmbedHelpersSource, /export function isAICardEmbedSrc/);
assert.match(
  aiCardEmbedHelpersSource,
  /export function getInternalEmbedPreviewInfo/
);
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
assert.match(
  feedCardBodySource,
  // An AI-energy placeholder now suppresses the message treatment.
  /const commentTextInfo = aiEnergyPlaceholderName[\s\S]*?getPreviewCommentTextInfo\(comment\)/
);
assert.match(
  feedCardBodySource,
  /home-feed-card__comment-preview-text--message/
);
assert.match(
  feedCardBodySource,
  /const commentTextIsMessage = commentTextInfo\.isMessage/
);
assert.match(feedCardBodySource, /function getPreviewCommentTextInfo/);
assert.match(feedCardBodySource, /kind: 'aiCard'/);
assert.match(feedCardBodySource, /kind: 'build'/);
assert.match(
  feedCardBodySource,
  /const card = useMemo\(\(\) => \(\{ id: cardId \}\), \[cardId\]\)/
);
assert.match(feedCardBodySource, /<CardThumb card={card as any} \/>/);
assert.match(feedCardBodySource, /contentType: 'build'/);
assert.match(
  feedCardBodySource,
  /getInternalEmbedCommentLabel\(internalInfo\)/
);
assert.match(
  feedCardBodySource,
  /getInternalEmbedCommentLabel\(getInternalEmbedPreviewInfo\(embed\.src\)\)/
);
assert.doesNotMatch(
  feedCardBodySource,
  /if \(embed\.type === 'internal'\) return 'shared a link'/
);
assert.match(
  commentPreviewStylesSource,
  /home-feed-card__comment-preview-media--ai-card/
);
assert.match(
  commentPreviewStylesSource,
  /home-feed-card__comment-preview-media--build/
);
assert.match(
  commentPreviewStylesSource,
  /home-feed-card__comment-preview-text--message/
);
assert.match(commentPreviewStylesSource, /font-weight: 500;/);
assert.match(stringHelpersSource, /'heic'/);
assert.match(stringHelpersSource, /'heif'/);
assert.match(
  richTextMarkerHelpersSource,
  /export function stripTextSizeMarkers/
);
assert.match(feedCardBodySource, /getCommentPreviewPlainText\(rawContent/);
assert.doesNotMatch(feedCardBodySource, /\[`\*_>#~\]\+/);
assert.doesNotMatch(
  feedCardBodySource,
  /return text\s*\n\s*\.replace\(\s*\/\\\[\(\[\^\\\]\]\+\)\\\]\\\(\(\[\^\)\]\+\)\\\)\/g/
);

assert.match(contentPanelCommentSource, /ContentFileViewer/);
assert.match(contentPanelCommentSource, /ProfilePic/);
assert.match(contentPanelCommentSource, /UsernameText/);

console.log('CompactCommentEmbedPreview guard passed.');
