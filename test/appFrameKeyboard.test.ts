import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateAppFrameKeyboard,
  getDriftedScrollPositions
} from '../src/containers/Build/PreviewPanel/helpers/appFrameKeyboard';

// A phone page 800 px tall with the app frame filling y 60..800.
const base = {
  editing: true,
  layoutHeight: 800,
  visualViewportHeight: 800,
  visualViewportOffsetTop: 0,
  visualViewportScale: 1,
  frameTop: 60,
  frameBottom: 800,
  frameCssHeight: 740
};

test('no keyboard information while no text field in the app has focus', () => {
  assert.deepEqual(
    calculateAppFrameKeyboard({ ...base, editing: false, visualViewportHeight: 450 }),
    { open: false, height: 0 }
  );
  assert.deepEqual(calculateAppFrameKeyboard(base), { open: false, height: 0 });
});

test('reports the part of the frame below the visible bottom edge', () => {
  assert.deepEqual(
    calculateAppFrameKeyboard({ ...base, visualViewportHeight: 450 }),
    { open: true, height: 350 }
  );
});

test('counts the browser pan to the focused field once, not as more keyboard', () => {
  // iOS panned the visual viewport down 150 px to show the field: the frame
  // now has 200 px under the keyboard, not 350.
  assert.deepEqual(
    calculateAppFrameKeyboard({
      ...base,
      visualViewportHeight: 450,
      visualViewportOffsetTop: 150
    }),
    { open: true, height: 200 }
  );
  // Panned all the way: open, but nothing of the frame is covered.
  assert.deepEqual(
    calculateAppFrameKeyboard({
      ...base,
      visualViewportHeight: 450,
      visualViewportOffsetTop: 350
    }),
    { open: true, height: 0 }
  );
  // A collapsing browser toolbar shrinks the visual viewport a little: not a
  // keyboard.
  assert.deepEqual(
    calculateAppFrameKeyboard({
      ...base,
      visualViewportHeight: 720,
      visualViewportOffsetTop: 80
    }),
    { open: false, height: 0 }
  );
});

test('converts to the app frame CSS px and stays inside the frame', () => {
  // A frame drawn at half size: 350 page px is 700 app px.
  assert.deepEqual(
    calculateAppFrameKeyboard({
      ...base,
      visualViewportHeight: 450,
      frameCssHeight: 1480
    }),
    { open: true, height: 700 }
  );
  // A small frame high on the page above the keyboard is not covered.
  assert.deepEqual(
    calculateAppFrameKeyboard({
      ...base,
      visualViewportHeight: 450,
      frameTop: 100,
      frameBottom: 400,
      frameCssHeight: 300
    }),
    { open: true, height: 0 }
  );
});

test('pinch zoom is not a keyboard', () => {
  assert.deepEqual(
    calculateAppFrameKeyboard({
      ...base,
      visualViewportHeight: 400,
      visualViewportScale: 2
    }),
    { open: false, height: 0 }
  );
});

test('restores only the positions the keyboard moved', () => {
  const positions = new Map([
    ['window', { left: 0, top: 380 }],
    ['feed', { left: 0, top: 1200.5 }],
    ['gone', null]
  ]);
  const drifted = getDriftedScrollPositions(
    [
      { target: 'window', left: 0, top: 0 },
      { target: 'feed', left: 0, top: 1200 },
      { target: 'gone', left: 0, top: 10 }
    ],
    (target: string) => positions.get(target) || null
  );
  assert.deepEqual(
    drifted.map((position) => position.target),
    ['window']
  );
});
