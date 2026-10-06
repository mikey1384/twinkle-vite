import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  GHOST_TAP_WINDOW_MS,
  suppressGhostTapAfterNavigation
} from '../src/containers/Home/Stories/FeedCard/helpers/ghostTap';

function mouseEvent(type: string, clientX: number, clientY: number) {
  return Object.assign(new Event(type, { cancelable: true }), {
    clientX,
    clientY
  });
}

// The guard listens on the document in the capture phase, so in a real page it
// always runs before the content page's own handlers. A bare EventTarget has no
// capture phase and calls listeners in the order they were added, so the page's
// Reply-button listener is added after the guard is armed.
function addReplyButton(target: EventTarget) {
  const pressed: string[] = [];
  for (const type of ['mousedown', 'mouseup', 'click']) {
    target.addEventListener(type, () => pressed.push(type));
  }
  return pressed;
}

test('the leftover tap after a feed card opens never reaches the new page', () => {
  const target = new EventTarget();
  let time = 1000;
  suppressGhostTapAfterNavigation({ x: 200, y: 400, target, now: () => time });
  const pressed = addReplyButton(target);
  time += 80;
  for (const type of ['mousedown', 'mouseup', 'click']) {
    const event = mouseEvent(type, 202, 398);
    target.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true, `${type} is cancelled`);
  }
  assert.deepEqual(pressed, []);
  // the guard is gone after the leftover click: the next real tap works
  target.dispatchEvent(mouseEvent('click', 202, 398));
  assert.deepEqual(pressed, ['click']);
});

test('a tap somewhere else, or after the window, is left alone', () => {
  const target = new EventTarget();
  let time = 1000;
  suppressGhostTapAfterNavigation({ x: 200, y: 400, target, now: () => time });
  const pressed = addReplyButton(target);
  target.dispatchEvent(mouseEvent('click', 200, 600));
  assert.deepEqual(pressed, ['click'], 'far from the tap point');
  time += GHOST_TAP_WINDOW_MS + 1;
  target.dispatchEvent(mouseEvent('click', 200, 400));
  assert.deepEqual(pressed, ['click', 'click'], 'too late to be the leftover');
});

test('the guard removes itself when nothing arrives', async () => {
  const target = new EventTarget();
  suppressGhostTapAfterNavigation({ x: 10, y: 10, target });
  const pressed = addReplyButton(target);
  await new Promise((resolve) => setTimeout(resolve, GHOST_TAP_WINDOW_MS + 30));
  target.dispatchEvent(mouseEvent('click', 10, 10));
  assert.deepEqual(pressed, ['click']);
});

test('the feed card arms the guard before opening a post on finger-up', () => {
  const source = readFileSync(
    new URL('../src/containers/Home/Stories/FeedCard/index.tsx', import.meta.url),
    'utf8'
  );
  const pointerUp = source.slice(
    source.indexOf('function handleCardPointerUp('),
    source.indexOf('async function handleLikeActionClick(')
  );
  assert.match(
    pointerUp,
    /suppressGhostTapAfterNavigation\(\{ x: event\.clientX, y: event\.clientY \}\);\s*navigateToContentPageFromHomeFeed\(event\.currentTarget\);/
  );
});
