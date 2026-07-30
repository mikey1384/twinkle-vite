import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateMobileKeyboardInset,
  createSettledInsetPublisher
} from '../src/containers/App/hooks/useMobileKeyboardInset';

test('does not publish resize geometry before the caret-reveal pan catches up', () => {
  let measuredInset = 350;
  const publishedInsets: number[] = [];
  const frames = createFrameHarness();
  const publisher = createSettledInsetPublisher({
    readInset: () => measuredInset,
    publishInset: (inset) => publishedInsets.push(inset),
    requestFrame: frames.request,
    cancelFrame: frames.cancel
  });

  publisher.schedule();
  frames.runNext();

  measuredInset = 250;
  publisher.schedule();
  frames.runNext();
  frames.runNext();
  assert.deepEqual(publishedInsets, []);

  frames.runNext();
  assert.deepEqual(publishedInsets, [250]);
});

test('publishes a no-pan keyboard inset after the viewport is stable', () => {
  const publishedInsets: number[] = [];
  const frames = createFrameHarness();
  const publisher = createSettledInsetPublisher({
    readInset: () => 300,
    publishInset: (inset) => publishedInsets.push(inset),
    requestFrame: frames.request,
    cancelFrame: frames.cancel
  });

  publisher.schedule();
  frames.runNext();
  frames.runNext();
  assert.deepEqual(publishedInsets, []);

  frames.runNext();
  assert.deepEqual(publishedInsets, [300]);
});

test('uses the visual viewport bottom edge when the browser pans to a focused input', () => {
  assert.equal(
    calculateMobileKeyboardInset({
      layoutHeight: 800,
      visualViewportHeight: 450,
      visualViewportOffsetTop: 100
    }),
    250
  );
});

test('preserves the full keyboard inset when the visual viewport has not panned', () => {
  assert.equal(
    calculateMobileKeyboardInset({
      layoutHeight: 800,
      visualViewportHeight: 500,
      visualViewportOffsetTop: 0
    }),
    300
  );
});

test('does not shrink the shell again when the layout viewport already resized', () => {
  assert.equal(
    calculateMobileKeyboardInset({
      layoutHeight: 500,
      visualViewportHeight: 500,
      visualViewportOffsetTop: 0
    }),
    0
  );
});

test('does not mistake negative rubber-band offset for keyboard coverage', () => {
  assert.equal(
    calculateMobileKeyboardInset({
      layoutHeight: 800,
      visualViewportHeight: 500,
      visualViewportOffsetTop: -40
    }),
    300
  );
});

function createFrameHarness() {
  let nextFrameId = 1;
  const callbacks = new Map<number, () => void>();

  return {
    request(callback: () => void) {
      const frameId = nextFrameId;
      nextFrameId += 1;
      callbacks.set(frameId, callback);
      return frameId;
    },
    cancel(frameId: number) {
      callbacks.delete(frameId);
    },
    runNext() {
      const next = callbacks.entries().next().value as
        | [number, () => void]
        | undefined;
      assert.ok(next, 'Expected a scheduled animation frame.');
      const [frameId, callback] = next;
      callbacks.delete(frameId);
      callback();
    }
  };
}
