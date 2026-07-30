import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateMobileKeyboardInset } from '../src/containers/App/hooks/useMobileKeyboardInset';

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
