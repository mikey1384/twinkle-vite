import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createOwnerLumineReviewAction,
  getBuildVersionLoadRouteState,
  hasUnseenBuildBranchChanges,
  isBuildContributionOwnerReview
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
  let openedPeoplePanel = false;
  const action = createOwnerLumineReviewAction({
    mergingBranches: [mergingBranch],
    onLoadVersion: (version, options) => {
      openedBranchId = version.id;
      openedPeoplePanel = options?.openPeoplePanel === true;
    }
  });

  assert.equal(action?.actionLabel, 'Review');
  assert.equal(
    action?.detail,
    'Review the branch and sponsor Lumine to finish safely.'
  );
  action?.onClick();
  assert.equal(openedPeoplePanel, true);
  assert.equal(openedBranchId, 42);
});

test('project-owner review identity survives terminal branch transitions', () => {
  for (const contributionStatus of ['draft', 'merging', 'merged']) {
    assert.equal(
      isBuildContributionOwnerReview({
        rootBuildUserId: 554,
        userId: 554
      }),
      true,
      contributionStatus
    );
  }
  assert.equal(
    isBuildContributionOwnerReview({
      rootBuildUserId: 554,
      userId: 263
    }),
    false
  );
});

test('Lumine repair navigation opens Team while ordinary branch navigation opens Branches', () => {
  assert.deepEqual(getBuildVersionLoadRouteState(), {
    openVersionsPanel: true
  });
  assert.deepEqual(
    getBuildVersionLoadRouteState({ openPeoplePanel: true }),
    { openPeoplePanel: true }
  );
});
