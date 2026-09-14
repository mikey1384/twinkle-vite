import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBlockPreviewClampLines } from '../src/components/Texts/RichText/helpers/previewClamp';

const line = (top: number, height = 20) => ({ top, bottom: top + height });

test('content ending within the available space keeps its base clamp', () => {
  assert.equal(
    resolveBlockPreviewClampLines({
      rects: [line(0), line(26), line(71)],
      budget: 100,
      maxLines: 5
    }),
    null
  );
  assert.equal(
    resolveBlockPreviewClampLines({
      rects: [],
      budget: 100,
      maxLines: 5
    }),
    null
  );
});

test('list and paragraph gaps reduce the number of complete lines that fit', () => {
  assert.equal(
    resolveBlockPreviewClampLines({
      rects: [line(0), line(26), line(72), line(98), line(144)],
      budget: 110,
      maxLines: 5
    }),
    3
  );
});

test('inline links and emphasis count as one line, including a raised fragment', () => {
  assert.equal(
    resolveBlockPreviewClampLines({
      rects: [line(0), line(0), line(-4, 14), line(26), line(26), line(52)],
      budget: 60,
      maxLines: 10
    }),
    2
  );
});

test('tight line-heights do not merge consecutive lines whose glyphs overlap', () => {
  assert.equal(
    resolveBlockPreviewClampLines({
      rects: [line(0, 22), line(20, 22), line(40, 22)],
      budget: 50,
      maxLines: 5
    }),
    2
  );
});

test('heading and nested prose lines use their actual heights', () => {
  assert.equal(
    resolveBlockPreviewClampLines({
      rects: [line(0, 28), line(40, 18), line(62, 18)],
      budget: 70,
      maxLines: 5
    }),
    2
  );
});

test('honors a smaller ancestor budget and never exceeds the line limit', () => {
  assert.equal(
    resolveBlockPreviewClampLines({
      rects: [line(0), line(26), line(52)],
      budget: 40,
      maxLines: 5
    }),
    1
  );
  assert.equal(
    resolveBlockPreviewClampLines({
      rects: [line(0), line(26), line(52), line(78)],
      budget: 80,
      maxLines: 2
    }),
    2
  );
  assert.equal(
    resolveBlockPreviewClampLines({
      rects: [line(0)],
      budget: 5,
      maxLines: 3
    }),
    1
  );
});
