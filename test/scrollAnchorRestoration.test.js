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
const handleNavClickSource = mainNavSource.slice(
  mainNavSource.indexOf('function handleNavClick()')
);
const handleStoryClickSource = homeMenuItemsSource.slice(
  homeMenuItemsSource.indexOf('function handleStoryClick()')
);

assert.match(source, /scrollTop: number;/);
assert.match(source, /const scrollTop = getScrollTop\(scroller\);/);
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
  /if \(!anchorElement\) \{[\s\S]*restoreToSavedScrollTop\(anchorToRestore, scroller\);[\s\S]*attempts \+= 1;/
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
  /import \{[\s\S]*cancelScrollAnchorRestores,[\s\S]*suppressScrollAnchorSaves[\s\S]*\} from '~\/helpers\/scrollAnchorRestorationCoordinator';/
);
assert.match(
  mainNavSource,
  /const sameRouteNavScrollSaveSuppressionMs = 250;/
);
assert.match(
  mainNavSource,
  /function scrollCurrentPageToTop\(\) \{[\s\S]*document\.getElementById\('App'\)[\s\S]*document\.scrollingElement \|\| document\.documentElement[\s\S]*cancelScrollAnchorRestores\(\);[\s\S]*suppressScrollAnchorSaves\(sameRouteNavScrollSaveSuppressionMs\);[\s\S]*setScrollSurfaceTop\(appElement\);[\s\S]*setScrollSurfaceTop\(bodyRef\);[\s\S]*window\.dispatchEvent\(new Event\('scroll'\)\);[\s\S]*\}/
);
assert.match(
  mainNavSource,
  /function setScrollSurfaceTop\(element: Element \| null\) \{[\s\S]*if \(!element\) return;[\s\S]*element\.scrollTop = 0;[\s\S]*element\.dispatchEvent\(new Event\('scroll'\)\);[\s\S]*\}/
);
assert.match(handleNavClickSource, /function handleNavClick\(\)/);
assert.doesNotMatch(handleNavClickSource, /suppressScrollAnchorRestores/);
assert.match(handleNavClickSource, /scrollCurrentPageToTop\(\);/);
assert.match(
  handleNavClickSource,
  /if \(navTargetIsCurrentLocation\(\)\) \{[\s\S]*scrollCurrentPageToTop\(\);[\s\S]*\}/
);
assert.match(
  handleNavClickSource,
  /function navTargetIsCurrentLocation\(\) \{[\s\S]*return to === pathname \|\| to === `\$\{pathname\}\$\{search \|\| ''\}`;[\s\S]*\}/
);
assert.match(handleStoryClickSource, /function handleStoryClick\(\)/);
assert.doesNotMatch(handleStoryClickSource, /scrollTop = 0/);

console.log('Scroll anchor restoration verifier passed.');
