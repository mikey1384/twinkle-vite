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
    navigationSource,
    /\(hover: none\), \(pointer: coarse\), \(max-width: \$\{mobileMaxWidth\}\)/
  );
  assert.match(
    navigationSource,
    /currentTarget\.contains\(nestedInteractiveElement\)/
  );
});
