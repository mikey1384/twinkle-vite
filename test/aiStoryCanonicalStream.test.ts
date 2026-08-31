import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { applyCanonicalTextStreamUpdate } from '../src/helpers/canonicalTextStream';

const readingSource = readFileSync(
  new URL(
    '../src/containers/Home/AIStoriesModal/Game/Reading/index.tsx',
    import.meta.url
  ),
  'utf8'
);

test('AI Story deltas append while canonical snapshots replace without duplicating words', () => {
  let rendered = '';
  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    delta: 'same ',
    startOffset: 0
  });
  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    delta: 'word',
    startOffset: 5
  });
  assert.equal(rendered, 'same word');

  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    delta: 'word',
    startOffset: 5
  });
  assert.equal(rendered, 'same word');

  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    snapshot: 'same word'
  });
  assert.equal(rendered, 'same word');

  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    snapshot: ''
  });
  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    delta: 'confirmed retry'
  });
  assert.equal(rendered, 'confirmed retry');
});

test('AI Story rendered props cannot roll an active stream projection backward', () => {
  assert.doesNotMatch(
    readingSource,
    /streamedStoryRef\.current = story;\s*\}, \[story\]\);/
  );
  assert.doesNotMatch(
    readingSource,
    /streamedExplanationRef\.current = explanation;\s*\}, \[explanation\]\);/
  );
  assert.match(readingSource, /streamedStoryRef\.current = storyObj\.story;/);
  assert.match(
    readingSource,
    /streamedExplanationRef\.current = storyObj\.explanation;/
  );
  assert.match(
    readingSource,
    /streamedStoryRef\.current = applyCanonicalTextStreamUpdate\(\{/
  );
  assert.match(
    readingSource,
    /streamedExplanationRef\.current = applyCanonicalTextStreamUpdate\(\{/
  );
});
