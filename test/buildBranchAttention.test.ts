import assert from 'node:assert/strict';
import test from 'node:test';
import { hasUnseenBuildBranchChanges } from '../src/containers/Build/Editor/helpers/branches';

test('branch attention is driven by the exact revision the owner opened', () => {
  assert.equal(
    hasUnseenBuildBranchChanges({
      id: 1,
      contributionRevisionHash: 'revision-a',
      ownerLastOpenedRevisionHash: ''
    }),
    true
  );
  assert.equal(
    hasUnseenBuildBranchChanges({
      id: 1,
      contributionRevisionHash: 'revision-a',
      ownerLastOpenedRevisionHash: 'revision-a'
    }),
    false
  );
  assert.equal(
    hasUnseenBuildBranchChanges({
      id: 1,
      contributionRevisionHash: 'revision-b',
      ownerLastOpenedRevisionHash: 'revision-a'
    }),
    true
  );
});

test('empty branches never demand owner attention', () => {
  assert.equal(
    hasUnseenBuildBranchChanges({
      id: 1,
      contributionRevisionHash: '',
      ownerLastOpenedRevisionHash: ''
    }),
    false
  );
});
