import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../src/helpers/hooks/useScrollAnchorRestoration.ts', import.meta.url),
  'utf8'
);
const mainNavSource = readFileSync(
  new URL('../src/containers/App/Header/MainNavs/Nav.tsx', import.meta.url),
  'utf8'
);
const homeMenuItemsSource = readFileSync(
  new URL('../src/components/HomeMenuItems/index.tsx', import.meta.url),
  'utf8'
);
const commentSource = readFileSync(
  new URL(
    '../src/components/Comments/Container/Comment.tsx',
    import.meta.url
  ),
  'utf8'
);
const pinnedCommentSource = readFileSync(
  new URL(
    '../src/components/Comments/Container/PinnedComment/Comment.tsx',
    import.meta.url
  ),
  'utf8'
);
const searchedCommentSource = readFileSync(
  new URL(
    '../src/components/Comments/Container/Searched/Comment.tsx',
    import.meta.url
  ),
  'utf8'
);
const replySource = readFileSync(
  new URL(
    '../src/components/Comments/Container/Replies/Reply.tsx',
    import.meta.url
  ),
  'utf8'
);
const handleNavClickSource = mainNavSource.slice(
  mainNavSource.indexOf('function handleNavClick(')
);
const handleStoryClickSource = homeMenuItemsSource.slice(
  homeMenuItemsSource.indexOf('function handleStoryClick()')
);

assert.match(source, /scrollTop: number;/);
assert.match(source, /const scrollTop = getScrollTop\(scroller\);/);
assert.match(source, /restoreSettledSignatureRef/);
assert.match(source, /ignoredSavedAnchorSignaturesRef/);
assert.match(source, /function savedAnchorHasElementIdentity/);
assert.match(source, /function getSavedAnchorRestoreSignature/);
assert.match(source, /function saveShouldWaitForPendingRestore\(\)/);
assert.match(
  source,
  /if \(activeAnchorKeyRef\.current !== anchorKey\) \{[\s\S]*restoreAttemptedRef\.current = '';[\s\S]*restoreSettledSignatureRef\.current = '';[\s\S]*\}/
);
assert.match(
  source,
  /!!restoreSignature &&[\s\S]*restoreSettledSignatureRef\.current !== restoreSignature/
);
assert.match(
  source,
  /ignoredSavedAnchorSignaturesRef\.current\[anchorKey\] ===[\s\S]*restoreSignature[\s\S]*return false;/
);
assert.match(
  source,
  /const savedAnchorIsIgnored =[\s\S]*activeIgnoredSavedAnchorKeyRef\.current === anchorKey[\s\S]*ignoredSavedAnchorSignaturesRef\.current\[anchorKey\] ===[\s\S]*savedAnchorRestoreSignature/
);
assert.match(
  source,
  /const savedAnchor =[\s\S]*savedAnchorIsIgnored \? undefined : savedScrollAnchors\[anchorKey\];/
);
assert.match(source, /!saveShouldWaitForPendingRestore\(\)/);
assert.match(source, /function markSavedAnchorRestoreSettled\(\)/);
assert.match(
  source,
  /if \(scrollAnchorRestoresAreSuppressed\(\)\) \{[\s\S]*markSavedAnchorRestoreSettled\(\);[\s\S]*return;[\s\S]*\}/
);
assert.match(
  source,
  /if \(userCancelledRestoreRef\.current === anchorKey\) \{[\s\S]*markSavedAnchorRestoreSettled\(\);[\s\S]*return;[\s\S]*\}/
);
assert.match(
  source,
  /if \(restoreAttemptedRef\.current === restoreKey\) \{[\s\S]*markSavedAnchorRestoreSettled\(\);[\s\S]*return;[\s\S]*\}/
);
assert.match(
  source,
  /function markRestoreSettledIfNoAnchorIdentity\(\) \{[\s\S]*!savedAnchorHasElementIdentity\(anchorToRestore\)[\s\S]*markRestoreSettled\(\);[\s\S]*\}/
);
assert.match(source, /const scrollableOverflowValues = new Set/);
assert.match(
  source,
  /function getActiveScroller\(\) \{[\s\S]*elementUsesOwnScroll\(scroller\)[\s\S]*: null;[\s\S]*\}/
);
assert.match(
  source,
  /function elementUsesOwnScroll\(element: HTMLElement\) \{[\s\S]*window\.getComputedStyle\(element\)[\s\S]*scrollableOverflowValues\.has\(overflowY\);[\s\S]*\}/
);
assert.match(
  source,
  /if \(type === 'top'\) \{[\s\S]*suppressScrollAnchorSaves\(restoreSaveSuppressionDurationMs\);[\s\S]*setScrollTop\(scroller, 0\);[\s\S]*\}/
);
assert.match(source, /export function saveScrollAnchorForElement/);
assert.match(
  source,
  /sourceElement\.closest<HTMLElement>\([\s\S]*'\[data-content-page="true"\]'/
);
assert.match(
  source,
  /contentPagePanel\?\.closest<HTMLElement>\([\s\S]*'\[data-scroll-anchor-id\^="content:"\]'/
);
assert.match(
  source,
  /saveAnchorElement\(contentAnchorKey, anchorElement, getActiveScroller\(\)\);[\s\S]*suppressScrollAnchorSaves\(restoreSaveSuppressionDurationMs\);[\s\S]*return;[\s\S]*saveCurrentAnchor\([\s\S]*contentAnchorKey,[\s\S]*contentAnchorContainer,[\s\S]*getActiveScroller\(\)[\s\S]*\);[\s\S]*suppressScrollAnchorSaves\(restoreSaveSuppressionDurationMs\);/
);
assert.match(source, /anchorElement !== contentAnchorContainer/);
assert.match(
  source,
  /function saveAnchorElement\([\s\S]*savedScrollAnchors\[anchorKey\] = \{[\s\S]*primaryId: anchorElement\.dataset\.scrollAnchorId[\s\S]*scrollTop: getScrollTop\(scroller\)[\s\S]*\}/
);
assert.match(
  source,
  /const targetElement = targetRef\?\.current;[\s\S]*if \(!targetElement\) return;[\s\S]*suppressScrollAnchorSaves\(restoreSaveSuppressionDurationMs\);[\s\S]*scrollElementToTop/
);
assert.match(
  source,
  /function getViewportTop\(scroller: HTMLElement \| null\) \{[\s\S]*return scroller \? scroller\.getBoundingClientRect\(\)\.top : 0;[\s\S]*\}/
);
assert.match(
  source,
  /function getViewportBottom\(scroller: HTMLElement \| null\) \{[\s\S]*return scroller \? scroller\.getBoundingClientRect\(\)\.bottom : window\.innerHeight;[\s\S]*\}/
);
assert.match(
  source,
  /return scroller \? scroller\.scrollTop : bodyRef\?\.scrollTop \|\| 0;/
);
assert.doesNotMatch(
  source,
  /Math\.max\(scroller\?\.scrollTop \|\| 0, bodyRef\?\.scrollTop \|\| 0\)/
);
assert.match(
  source,
  /if \(!container\.isConnected\) \{[\s\S]*if \(savedScrollAnchors\[anchorKey\]\) return;[\s\S]*savedScrollAnchors\[anchorKey\] = \{[\s\S]*scrollTop[\s\S]*return;[\s\S]*\}/
);
assert.match(
  source,
  /if \(items\.length === 0\) \{[\s\S]*scrollTop[\s\S]*return;[\s\S]*\}/
);
assert.match(
  source,
  /if \(!anchorElement\) \{[\s\S]*restoreToSavedScrollTop\(anchorToRestore, scroller\);[\s\S]*markRestoreSettledIfNoAnchorIdentity\(\);[\s\S]*attempts \+= 1;/
);
assert.match(
  source,
  /function restoreToSavedScrollTop\([\s\S]*suppressScrollAnchorSaves\(restoreSaveSuppressionDurationMs\);[\s\S]*setScrollTop\(scroller, Math\.max\(0, savedAnchor\.scrollTop\)\);/
);
assert.match(
  source,
  /return \(\) => \{[\s\S]*saveCurrentAnchor\(anchorKey, container, getActiveScroller\(\)\);[\s\S]*removeEventListener\('scroll', handleScroll\);/
);
assert.match(
  mainNavSource,
  /import \{ resetAppShellScroll \} from '~\/helpers\/appShellScroll';/
);
assert.match(
  handleNavClickSource,
  /function handleNavClick\(event: React\.MouseEvent<HTMLAnchorElement>\)/
);
assert.doesNotMatch(handleNavClickSource, /suppressScrollAnchorRestores/);
assert.match(
  handleNavClickSource,
  /if \(navClickShouldKeepCurrentScroll\(event\)\) return;/
);
assert.match(
  handleNavClickSource,
  /if \(navClickTargetsCurrentLocation\(to, pathname, search\)\) \{[\s\S]*resetAppShellScroll\(\);[\s\S]*\}/
);
assert.match(
  handleNavClickSource,
  /function navClickTargetsCurrentLocation\([\s\S]*targetLocation\.pathname === currentPathname[\s\S]*targetLocation\.search === currentSearch/
);
assert.match(handleStoryClickSource, /function handleStoryClick\(\)/);
assert.doesNotMatch(handleStoryClickSource, /scrollTop = 0/);
assert.match(
  commentSource,
  /import \{ saveScrollAnchorForElement \} from '~\/helpers\/hooks\/useScrollAnchorRestoration';/
);
assert.match(commentSource, /onClick=\{handleTimestampClick\}/);
assert.match(
  commentSource,
  /function handleTimestampClick\(event: React\.MouseEvent<HTMLElement>\) \{[\s\S]*saveScrollAnchorForElement\(event\.currentTarget\);[\s\S]*navigate\(`\/comments\/\$\{comment\.id\}`\);[\s\S]*\}/
);
assert.match(pinnedCommentSource, /onClick=\{handleTimestampClick\}/);
assert.match(pinnedCommentSource, /onClick=\{handleCommentDetailClick\}/);
assert.match(
  pinnedCommentSource,
  /data-scroll-anchor-id=\{`pinned-comment:\$\{comment\.id\}`\}/
);
assert.match(
  pinnedCommentSource,
  /data-scroll-anchor-secondary-id=\{`pinned-comment:\$\{comment\.id\}`\}/
);
assert.match(
  pinnedCommentSource,
  /data-scroll-anchor-content-key=\{`pinned-comment:\$\{comment\.id\}`\}/
);
assert.doesNotMatch(
  pinnedCommentSource,
  /data-scroll-anchor-id=\{`comment:\$\{comment\.id\}`\}/
);
assert.match(
  pinnedCommentSource,
  /function handleCommentDetailClick\(event: React\.MouseEvent<HTMLElement>\) \{[\s\S]*saveScrollAnchorForElement\(event\.currentTarget\);[\s\S]*navigate\(`\/comments\/\$\{comment\.id\}`\);[\s\S]*\}/
);
assert.match(searchedCommentSource, /onClick=\{handleTimestampClick\}/);
assert.match(searchedCommentSource, /onClick=\{handleCommentDetailClick\}/);
assert.match(
  searchedCommentSource,
  /function handleCommentDetailClick\(event: React\.MouseEvent<HTMLElement>\) \{[\s\S]*saveScrollAnchorForElement\(event\.currentTarget\);[\s\S]*navigate\(`\/comments\/\$\{comment\.id\}`\);[\s\S]*\}/
);
assert.match(replySource, /onClick=\{handleCommentDetailClick\}/);
assert.match(
  replySource,
  /function handleCommentDetailClick\(event: React\.MouseEvent<HTMLElement>\) \{[\s\S]*saveScrollAnchorForElement\(event\.currentTarget\);[\s\S]*\}/
);

console.log('Scroll anchor restoration verifier passed.');
