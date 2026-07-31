import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildRuntimeCommentsAreAvailable } from '../src/containers/Build/Runtime/helpers/runtimeComments';

const runtimeSource = readFileSync(
  new URL('../src/containers/Build/Runtime/index.tsx', import.meta.url),
  'utf8'
);

test('runtime comments are unavailable on every contribution branch state', () => {
  for (const contributionStatus of ['draft', 'merging', 'merged'] as const) {
    assert.equal(
      buildRuntimeCommentsAreAvailable({ contributionStatus }),
      false,
      contributionStatus
    );
  }
});

test('runtime comments remain available on canonical builds', () => {
  assert.equal(buildRuntimeCommentsAreAvailable({}), true);
  assert.equal(
    buildRuntimeCommentsAreAvailable({ contributionStatus: 'none' }),
    true
  );
  assert.equal(buildRuntimeCommentsAreAvailable(null), false);
});

test('the runtime gates both the comment button and drawer', () => {
  assert.match(
    runtimeSource,
    /\{runtimeCommentsAvailable \? \(\s*<GameCTAButton[\s\S]*?icon="comments"/
  );
  assert.match(
    runtimeSource,
    /\{runtimeCommentsAvailable \? \(\s*<CommentsDrawer/
  );
});
