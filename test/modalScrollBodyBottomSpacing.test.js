import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const modalSource = readFileSync(
  new URL('../src/components/Modal/index.tsx', import.meta.url),
  'utf8'
);

// The modal body is a flex container that scrolls. Chrome/WebKit exclude a flex
// scroll container's bottom padding (and its items' bottom margin/padding) from
// the scrollable overflow region, so with `padding-bottom` alone the last row of
// a scrolled body sits flush against the modal edge — measured in the real Fork
// History modal: gap below the last card = 0 with padding, 12px with a border.
// The border lives outside the scrollport, which is why it survives.
test('the scrolling modal body renders its bottom spacing as a border', () => {
  assert.match(
    modalSource,
    /const resolvedBodyPadding =\s*bodyPadding !== undefined/
  );
  assert.match(
    modalSource,
    /padding-bottom: 0; border-bottom: \$\{resolvedBodyPadding\} solid transparent;/
  );
  // The body must stay a flex container; switching it to block would change
  // how every modal centers its content.
  assert.match(modalSource, /overflow-y: \$\{allowOverflow \? 'visible' : 'auto'\}/);
  assert.match(modalSource, /display: flex;\s*justify-content: center;/);
});

test('a shorthand bodyPadding keeps plain padding', () => {
  // Only a single length can become a border width. Every current caller passes
  // 0 or nothing, but a shorthand must not silently lose its bottom spacing.
  assert.match(
    modalSource,
    /const bodyBottomSpacingIsBorder = !resolvedBodyPadding\.trim\(\)\.includes\(' '\);/
  );
  assert.match(
    modalSource,
    /\$\{bodyBottomSpacingIsBorder\s*\?\s*`padding-bottom: 0;/
  );
});
