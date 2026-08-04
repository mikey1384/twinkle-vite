import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createOwnerLumineReviewAction,
  hasUnseenBuildBranchChanges
} from '../src/containers/Build/Editor/helpers/branches';

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

test('a waiting Lumine repair takes the owner straight to that branch', () => {
  const mergingBranch = {
    id: 42,
    contributionStatus: 'merging' as const
  };
  let openedBranchId = 0;
  const action = createOwnerLumineReviewAction({
    mergingBranches: [mergingBranch],
    onLoadVersion: (version) => {
      openedBranchId = version.id;
    }
  });

  assert.equal(action?.actionLabel, 'Review');
  assert.equal(
    action?.detail,
    'Review the branch and sponsor Lumine to finish safely.'
  );
  action?.onClick();
  assert.equal(openedBranchId, 42);
});
