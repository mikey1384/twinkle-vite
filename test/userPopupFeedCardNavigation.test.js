import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('User popup portal stops events before feed-card navigation can intercept actions', () => {
  const popupSource = readFileSync(
    new URL('../src/components/UserPopup/Popup.tsx', import.meta.url),
    'utf8'
  );
  const feedCardSource = readFileSync(
    new URL(
      '../src/containers/Home/Stories/FeedCard/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const navigationSource = readFileSync(
    new URL(
      '../src/containers/Home/Stories/FeedCard/helpers/navigation.ts',
      import.meta.url
    ),
    'utf8'
  );
  const hooksSource = readFileSync(
    new URL('../src/helpers/hooks/index.tsx', import.meta.url),
    'utf8'
  );
  const popupDismissNavigationSource = readFileSync(
    new URL('../src/helpers/popupDismissNavigation.ts', import.meta.url),
    'utf8'
  );

  assert.match(popupSource, /createPortal\(/);
  assert.match(
    popupSource,
    /function stopPopupEventPropagation\(event: React\.SyntheticEvent\) \{\s*event\.stopPropagation\(\);\s*\}/
  );
  assert.match(
    popupSource,
    /function stopPopupKeyboardEventPropagation\(event: React\.KeyboardEvent\) \{\s*if \(event\.key === 'Escape'\) return;\s*event\.stopPropagation\(\);\s*\}/
  );

  const popupBoundary = popupSource.match(
    /<div\s+ref=\{MenuRef\}[\s\S]*?>/
  )?.[0];
  assert.ok(popupBoundary, 'User popup boundary wrapper must exist');

  for (const handlerName of [
    'onClick',
    'onMouseDown',
    'onMouseUp',
    'onPointerCancel',
    'onPointerDown',
    'onPointerMove',
    'onPointerUp',
    'onTouchEnd',
    'onTouchStart'
  ]) {
    assert.match(
      popupBoundary,
      new RegExp(`${handlerName}=\\{stopPopupEventPropagation\\}`),
      `${handlerName} must stay local to the portaled popup`
    );
  }
  for (const handlerName of ['onKeyDown', 'onKeyUp']) {
    assert.match(
      popupBoundary,
      new RegExp(`${handlerName}=\\{stopPopupKeyboardEventPropagation\\}`),
      `${handlerName} must let Escape bubble for popup-launched modals`
    );
  }

  assert.doesNotMatch(
    popupBoundary,
    /preventDefault/,
    'Popup propagation guard must not block Link navigation defaults'
  );
  assert.match(
    feedCardSource,
    /onPointerDown=\{handleCardPointerDown\}[\s\S]*onPointerUp=\{handleCardPointerUp\}/
  );
  assert.match(
    popupDismissNavigationSource,
    /popupDismissNavigationFeedCardTargetProps/
  );
  assert.match(
    popupDismissNavigationSource,
    /'data-popup-dismiss-navigation-target': 'feed-card'/
  );
  assert.match(
    popupDismissNavigationSource,
    /function eventTargetsPopupDismissNavigationFeedCard/
  );
  assert.match(
    popupDismissNavigationSource,
    /function addSuppressionEndListeners/
  );
  assert.match(
    popupDismissNavigationSource,
    /window\.setTimeout\([\s\S]*clearPopupDismissNavigationSuppression\(\);[\s\S]*\}, 0\);/
  );
  assert.match(
    popupDismissNavigationSource,
    /function suppressionHasActiveEndListeners\(\) \{[\s\S]*return removeSuppressionEndListeners !== null;[\s\S]*\}/
  );
  assert.match(
    popupDismissNavigationSource,
    /Date\.now\(\) - suppressedAt > POPUP_DISMISS_NAVIGATION_SUPPRESSION_MS &&[\s\S]*!suppressionHasActiveEndListeners\(\)/
  );
  assert.match(
    hooksSource,
    /eventTargetsPopupDismissNavigationFeedCard\(event\)[\s\S]*markPopupDismissNavigationSuppressed\(event\)/
  );
  assert.match(
    feedCardSource,
    /\{\.\.\.popupDismissNavigationFeedCardTargetProps\}/
  );
  const cardPointerUpSource = feedCardSource.slice(
    feedCardSource.indexOf('function handleCardPointerUp('),
    feedCardSource.indexOf('async function handleLikeActionClick(')
  );
  assert.match(
    cardPointerUpSource,
    /consumePopupDismissNavigationSuppression\(event\.nativeEvent\)[\s\S]*if \(!tapNavigation \|\| tapNavigation\.pointerId !== event\.pointerId\)/
  );
  assert.match(
    navigationSource,
    /\(hover: none\), \(pointer: coarse\), \(max-width: \$\{mobileMaxWidth\}\)/
  );
  assert.match(
    navigationSource,
    /currentTarget\.contains\(nestedInteractiveElement\)/
  );
});
