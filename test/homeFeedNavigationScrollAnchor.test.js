import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const storiesSource = readFileSync(
  new URL('../src/containers/Home/Stories/index.tsx', import.meta.url),
  'utf8'
);
const feedCardSource = readFileSync(
  new URL(
    '../src/containers/Home/Stories/FeedCard/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const scrollAnchorSource = readFileSync(
  new URL('../src/helpers/hooks/useScrollAnchorRestoration.ts', import.meta.url),
  'utf8'
);
const bodySource = readFileSync(
  new URL(
    '../src/containers/Home/Stories/FeedCard/Body/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const targetPreviewSource = readFileSync(
  new URL(
    '../src/containers/Home/Stories/FeedCard/Body/TargetPreview.tsx',
    import.meta.url
  ),
  'utf8'
);
const previewPrimitivesSource = readFileSync(
  new URL(
    '../src/containers/Home/Stories/FeedCard/Body/PreviewPrimitives.tsx',
    import.meta.url
  ),
  'utf8'
);

const navigateSource = feedCardSource.slice(
  feedCardSource.indexOf('function navigateToContentPageFromHomeFeed('),
  feedCardSource.indexOf('function mergeLoadedFeedContentWithPreviewState(')
);
const pointerUpSource = feedCardSource.slice(
  feedCardSource.indexOf('function handleCardPointerUp('),
  feedCardSource.indexOf('async function handleLikeActionClick(')
);
const actionNavigationSource = feedCardSource.slice(
  feedCardSource.indexOf('function handleNavigationActionClick('),
  feedCardSource.indexOf('function handleCardKeyDown(')
);

assert.match(
  storiesSource,
  /<HomeFeedCard[\s\S]*homeFeedAnchorKey=\{homeFeedAnchorKey\}/,
  'Feed cards must receive the active feed-list anchor key used by useScrollAnchor.'
);
assert.match(
  feedCardSource,
  /import \{ saveScrollAnchorForElement \} from '~\/helpers\/hooks\/useScrollAnchorRestoration';/,
  'Home feed card navigation must be able to save the tapped feed item before route change.'
);
assert.match(
  feedCardSource,
  /homeFeedAnchorKey[\s\S]*homeFeedAnchorKey\?: string;/,
  'Home feed card props must include the active feed-list anchor key.'
);
assert.match(
  scrollAnchorSource,
  /export function saveScrollAnchorForElement\([\s\S]*anchorKey\?: string/,
  'saveScrollAnchorForElement must support explicit non-content-page anchor keys.'
);
assert.match(
  scrollAnchorSource,
  /if \(anchorKey && anchorElement\) \{[\s\S]*saveAnchorElement\(anchorKey, anchorElement, getActiveScroller\(\)\);[\s\S]*suppressScrollAnchorSaves\(restoreSaveSuppressionDurationMs\);[\s\S]*return;/,
  'Explicit anchor-key saves must write the selected element before navigation.'
);
assert.match(
  navigateSource,
  /sourceElement: HTMLElement \| null/,
  'Home feed navigation must accept the concrete source element that was tapped.'
);
assert.match(
  navigateSource,
  /saveScrollAnchorForElement\(sourceElement, homeFeedAnchorKey\);[\s\S]*navigate\(contentPath,/,
  'Home feed navigation must save the tapped feed anchor before calling navigate.'
);
assert.match(
  feedCardSource,
  /function handleCardClick\(event: React\.MouseEvent<HTMLElement>\)[\s\S]*navigateToContentPageFromHomeFeed\(event\.currentTarget\);/,
  'Desktop card clicks must save the clicked feed card before navigation.'
);
assert.match(
  pointerUpSource,
  /navigateToContentPageFromHomeFeed\(event\.currentTarget\);/,
  'Mobile pointer-up card taps must save the tapped feed card before navigation.'
);
assert.match(
  feedCardSource,
  /function handleOpenButtonClick\(event: React\.MouseEvent<HTMLButtonElement>\)[\s\S]*navigateToContentPageFromHomeFeed\(event\.currentTarget\);/,
  'Open button navigation must save the containing feed card before navigation.'
);
assert.match(
  actionNavigationSource,
  /navigateToContentPageFromHomeFeed\(event\.currentTarget, action\);/,
  'Comment/reward/recommend navigation must save the containing feed card before navigation.'
);
assert.match(
  feedCardSource,
  /function handleCardKeyDown\(event: React\.KeyboardEvent<HTMLElement>\)[\s\S]*navigateToContentPageFromHomeFeed\(event\.currentTarget\);/,
  'Keyboard card navigation must save the focused feed card before navigation.'
);
assert.match(
  feedCardSource,
  /function handleNestedNavigate\([\s\S]*path: string,[\s\S]*sourceElement: HTMLElement \| null[\s\S]*saveScrollAnchorForElement\(sourceElement, homeFeedAnchorKey\);[\s\S]*navigate\(path\);/,
  'Nested feed-card navigation must save the clicked feed anchor before routing.'
);
assert.match(
  feedCardSource,
  /<Body[\s\S]*onNavigate=\{handleNestedNavigate\}/,
  'Home feed body must route nested navigation through the save-before-navigate helper.'
);
assert.match(
  feedCardSource,
  /<HomeFeedCommentPreview[\s\S]*onNavigate=\{handleNestedNavigate\}/,
  'Home feed comment preview must route nested navigation through the save-before-navigate helper.'
);
for (const [name, source] of [
  ['Body/index.tsx', bodySource],
  ['Body/TargetPreview.tsx', targetPreviewSource],
  ['Body/PreviewPrimitives.tsx', previewPrimitivesSource]
]) {
  assert.doesNotMatch(
    source,
    /useNavigate/,
    `${name} must not own direct router navigation inside a feed card.`
  );
  assert.doesNotMatch(
    source,
    /\bnavigate\(/,
    `${name} must not bypass the feed-card anchor save with direct navigate().`
  );
}
assert.match(
  bodySource,
  /<TargetPreview[\s\S]*onNavigate=\{onNavigate\}/,
  'Target preview must receive the shared nested navigation helper.'
);
assert.match(
  targetPreviewSource,
  /onNavigate\(targetPath, event\.currentTarget\);/,
  'Target preview clicks must save their source element before navigation.'
);
assert.match(
  bodySource,
  /onNavigate\(`\/comments\/\$\{commentId\}`, event\.currentTarget\);/,
  'Home feed preview-comment clicks must save their source element before navigation.'
);
assert.match(
  previewPrimitivesSource,
  /onNavigate\(internalSrc, event\.currentTarget\);/,
  'Internal embedded previews must save their source element before navigation.'
);
assert.match(
  bodySource,
  /onBuild=\{[\s\S]*onNavigate\(`\/build\/\$\{contentId\}`, BodyRef\.current\)[\s\S]*\}/,
  'Build preview edit navigation must save the surrounding feed card before routing.'
);
assert.match(
  bodySource,
  /onOpen=\{\(\) => onNavigate\(`\/app\/\$\{contentId\}`, BodyRef\.current\)\}/,
  'Build preview app navigation must save the surrounding feed card before routing.'
);

console.log('Home feed navigation scroll-anchor verifier passed.');
