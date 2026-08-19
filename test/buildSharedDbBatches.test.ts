import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';

test('sharedDb batch writes are interaction-gated while targeted reads are not', () => {
  assert.equal(isMutatingPreviewRequestType('shared-db:add-entries'), true);
  assert.equal(isMutatingPreviewRequestType('shared-db:delete-entries'), true);
  assert.equal(
    isMutatingPreviewRequestType('shared-db:get-entries-by-ids'),
    false
  );
});

test('host bridge forwards all sharedDb batch operations through scoped helpers', () => {
  const source = fs.readFileSync(
    path.resolve(
      process.cwd(),
      'src/containers/Build/PreviewPanel/hooks/useHostBridge.ts'
    ),
    'utf8'
  );
  assert.match(source, /case 'shared-db:get-entries-by-ids'/);
  assert.match(source, /getSharedDbEntriesByIdsRef\.current/);
  assert.match(source, /case 'shared-db:add-entries'/);
  assert.match(source, /addSharedDbEntriesRef\.current/);
  assert.match(source, /case 'shared-db:delete-entries'/);
  assert.match(source, /deleteSharedDbEntriesRef\.current/);
});
