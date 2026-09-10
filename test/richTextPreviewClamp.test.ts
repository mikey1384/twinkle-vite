import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBlockPreviewClampLines } from '../src/components/Texts/RichText/helpers/previewClamp';

const lineHeight = 25.84;
const paragraph = (top: number, lines: number) => ({
  top,
  height: lines * lineHeight,
  lineHeight
});

test('content that ends within the budget keeps the base clamp', () => {
  assert.equal(
    resolveBlockPreviewClampLines({
      blocks: [paragraph(0, 3), paragraph(3 * lineHeight + 19, 2)],
      budget: 10 * lineHeight,
      maxLines: 10
    }),
    null
  );
  assert.equal(
    resolveBlockPreviewClampLines({ blocks: [], budget: 100, maxLines: 5 }),
    null
  );
});

test('a paragraph gap that pushes the last line past the budget drops that line', () => {
  // Ten lines fit by height alone, but the 19px gap between the paragraphs
  // means only nine whole lines end above the max-height.
  const lines = resolveBlockPreviewClampLines({
    blocks: [paragraph(0, 6), paragraph(6 * lineHeight + 19, 20)],
    budget: 10 * lineHeight,
    maxLines: 10
  });
  assert.equal(lines, 9);
});

test('a slot shorter than the max-height clamps to the lines the slot shows', () => {
  // Nested subject description: root max-height allows ~2.5 paragraph lines
  // (root line-height 30.6 vs paragraph 24.12), so only two whole lines fit.
  const lines = resolveBlockPreviewClampLines({
    blocks: [{ top: 0, height: 24.12 * 8, lineHeight: 24.12 }],
    budget: 61.2,
    maxLines: 2
  });
  assert.equal(lines, 2);
});

test('an overflow-hidden ancestor budget smaller than the panel is honored', () => {
  // Mobile 'tall' comment: eleven lines are allowed but the panel ends 4.5px
  // before the eleventh line, so the clamp lands on line ten.
  const lines = resolveBlockPreviewClampLines({
    blocks: [paragraph(0, 30)],
    budget: 11 * lineHeight - 4.5,
    maxLines: 11
  });
  assert.equal(lines, 10);
});

test('never clamps below one line or above the base clamp', () => {
  assert.equal(
    resolveBlockPreviewClampLines({
      blocks: [paragraph(0, 4)],
      budget: 5,
      maxLines: 3
    }),
    1
  );
  assert.equal(
    resolveBlockPreviewClampLines({
      blocks: [{ top: 0, height: 200, lineHeight: 10 }],
      budget: 120,
      maxLines: 5
    }),
    5
  );
});
