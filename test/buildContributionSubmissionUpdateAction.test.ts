import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCanonicalBuildContributionSubmissionUpdate,
  canUpdateAppFromBuildContributionSubmission,
  resolveCanonicalBuildContributionReleaseState,
  resolveCanonicalBuildContributionSubmissionState
} from '../src/helpers/buildContributionSubmissionHelpers';
import { isCachedCardStateFresher } from '../src/helpers/buildCardState';

const unpublishedPublicApp = {
  isOwner: true,
  isPublic: true,
  releaseStatus: { hasUnpublishedChanges: true },
  status: 'merged'
};

test('a merged public-app submission offers its owner Update App', () => {
  assert.equal(
    canUpdateAppFromBuildContributionSubmission(unpublishedPublicApp),
    true
  );
});

test('the action settles from the canonical published release status', () => {
  assert.equal(
    canUpdateAppFromBuildContributionSubmission({
      ...unpublishedPublicApp,
      releaseStatus: { hasUnpublishedChanges: false }
    }),
    false
  );
});

test('contributors never receive the owner publish action', () => {
  assert.equal(
    canUpdateAppFromBuildContributionSubmission({
      ...unpublishedPublicApp,
      isOwner: false
    }),
    false
  );
});

test('private, open, and conflict-merge cards keep their existing actions', () => {
  for (const candidate of [
    { ...unpublishedPublicApp, isPublic: false },
    { ...unpublishedPublicApp, status: 'open' },
    { ...unpublishedPublicApp, status: 'merging' }
  ]) {
    assert.equal(canUpdateAppFromBuildContributionSubmission(candidate), false);
  }
});

test('merge and publish responses advance independent branch and root state', () => {
  const merged = resolveCanonicalBuildContributionSubmissionState({
    contribution: { id: 901, contributionStatus: 'merged' },
    eventTimeMs: 2_000
  });
  assert.deepEqual(merged, {
    status: 'merged',
    __eventTime: 2_000
  });

  const published = resolveCanonicalBuildContributionReleaseState({
    build: {
      id: 884,
      isPublic: 1,
      releaseStatus: { hasUnpublishedChanges: false }
    },
    eventTimeMs: 3_000
  });
  assert.deepEqual(published, {
    isPublic: true,
    releaseStatus: { hasUnpublishedChanges: false },
    __eventTime: 3_000
  });
});

test('a root publish result settles every sibling card without changing branch lifecycle', () => {
  const state = {
    buildContributionSubmissionByBranchId: {
      901: { status: 'merged', __eventTime: 2_000 },
      902: { status: 'open', __eventTime: 2_500 }
    },
    buildContributionReleaseByRootBuildId: {
      884: {
        isPublic: true,
        releaseStatus: { hasUnpublishedChanges: true },
        __eventTime: 2_500
      }
    }
  };
  const nextState = applyCanonicalBuildContributionSubmissionUpdate({
    state,
    branchBuildId: 901,
    rootBuildId: 884,
    build: {
      id: 884,
      isPublic: 1,
      releaseStatus: { hasUnpublishedChanges: false }
    },
    eventTimeMs: 3_000
  });

  assert.equal(
    nextState.buildContributionSubmissionByBranchId,
    state.buildContributionSubmissionByBranchId
  );
  const sharedRelease = nextState.buildContributionReleaseByRootBuildId[884];
  assert.deepEqual(sharedRelease, {
    isPublic: true,
    releaseStatus: { hasUnpublishedChanges: false },
    __eventTime: 3_000
  });
  for (const branchBuildId of [901, 902]) {
    assert.equal(
      canUpdateAppFromBuildContributionSubmission({
        isOwner: true,
        ...state.buildContributionSubmissionByBranchId[branchBuildId],
        ...sharedRelease
      }),
      false
    );
  }
});

test('unstamped and stale root results cannot overwrite canonical release state', () => {
  const current = {
    isPublic: true,
    releaseStatus: { hasUnpublishedChanges: false },
    __eventTime: 3_000
  };
  assert.equal(
    resolveCanonicalBuildContributionReleaseState({
      current,
      build: {
        isPublic: 1,
        releaseStatus: { hasUnpublishedChanges: true }
      },
      eventTimeMs: 0
    }),
    current
  );
  assert.equal(
    resolveCanonicalBuildContributionReleaseState({
      current,
      build: {
        isPublic: 1,
        releaseStatus: { hasUnpublishedChanges: true }
      },
      eventTimeMs: 2_000
    }),
    current
  );
});

test('a newer reload payload wins over a root release cached in this tab', () => {
  assert.equal(
    isCachedCardStateFresher(
      { __eventTime: 3_000 },
      { eventTimeMs: 4_000 }
    ),
    false
  );
});
