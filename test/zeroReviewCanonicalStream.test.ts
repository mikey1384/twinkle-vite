import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const rewriteSource = readFileSync(
  new URL(
    '../src/components/Buttons/ZeroButton/ZeroModal/Rewrite/index.tsx',
    import.meta.url
  ),
  'utf8'
);

test('Zero Review replacement snapshots preserve streaming until completion', () => {
  assert.match(
    rewriteSource,
    /function handleZeroReviewUpdated\([\s\S]*?isComplete[\s\S]*?setResponseStreaming\(isComplete === false\)/
  );
  assert.match(
    rewriteSource,
    /function handleZeroReviewDelta\([\s\S]*?startOffset[\s\S]*?applyCanonicalTextStreamUpdate\([\s\S]*?startOffset/
  );
});
