import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCanonicalBuildContributionSubmissionUpdate,
  canUpdateAppFromBuildContributionSubmission,
  resolveBuildContributionLumineFixSocketUpdate,
  resolveCanonicalBuildContributionReleaseState,
  resolveCanonicalBuildContributionSubmissionState,
  upsertBuildContributionSubmissionState
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

test('standalone canonical Lumine responses advance and clear branch fix state', () => {
  const state = {
    buildContributionSubmissionByBranchId: {
      901: {
        status: 'merged',
        lumineFix: { status: 'needs_resolution' },
        __eventTime: 1_700_000_001_000
      }
    },
    buildContributionReleaseByRootBuildId: {}
  };
  const runningState = upsertBuildContributionSubmissionState({
    state,
    branchBuildId: 901,
    rootBuildId: 884,
    lumineFix: { status: 'running', model: 'gpt-5.6-terra' },
    eventTimeMs: 1_700_000_002_000
  });

  assert.deepEqual(runningState.buildContributionSubmissionByBranchId[901], {
    status: 'merged',
    lumineFix: { status: 'running', model: 'gpt-5.6-terra' },
    __eventTime: 1_700_000_002_000
  });

  const clearedState = upsertBuildContributionSubmissionState({
    state: runningState,
    branchBuildId: 901,
    rootBuildId: 884,
    lumineFix: null,
    eventTimeMs: 1_700_000_003_000
  });
  assert.equal(
    clearedState.buildContributionSubmissionByBranchId[901].lumineFix,
    null
  );
  assert.equal(
    clearedState.buildContributionSubmissionByBranchId[901].__eventTime,
    1_700_000_003_000
  );
});

test('standalone Lumine responses still reject stale and payload-less events', () => {
  const state = {
    buildContributionSubmissionByBranchId: {
      901: {
        status: 'merged',
        lumineFix: { status: 'ready' },
        __eventTime: 1_700_000_003_000
      }
    },
    buildContributionReleaseByRootBuildId: {}
  };
  const staleState = upsertBuildContributionSubmissionState({
    state,
    branchBuildId: 901,
    rootBuildId: 884,
    lumineFix: { status: 'running' },
    eventTimeMs: 1_700_000_002_000
  });
  assert.equal(staleState, state);

  const payloadlessState = upsertBuildContributionSubmissionState({
    state,
    branchBuildId: 901,
    rootBuildId: 884,
    eventTimeMs: 1_700_000_004_000
  });
  assert.equal(payloadlessState, state);
});

test('canonical Lumine socket updates preserve terminal and applied payloads', () => {
  const readyUpdate = resolveBuildContributionLumineFixSocketUpdate({
    rootBuildId: 884,
    branchBuildId: 901,
    lumineFix: {
      status: 'ready',
      changedPaths: ['/index.html']
    },
    eventTimeMs: 1_700_000_004_000
  });
  assert.deepEqual(readyUpdate, {
    rootBuildId: 884,
    branchBuildId: 901,
    lumineFix: {
      status: 'ready',
      changedPaths: ['/index.html']
    },
    eventTimeMs: 1_700_000_004_000
  });

  const readyState = upsertBuildContributionSubmissionState({
    state: {
      buildContributionSubmissionByBranchId: {
        901: {
          status: 'merged',
          lumineFix: { status: 'running' },
          __eventTime: 1_700_000_003_000
        }
      },
      buildContributionReleaseByRootBuildId: {}
    },
    ...readyUpdate!
  });
  assert.equal(
    readyState.buildContributionSubmissionByBranchId[901].lumineFix.status,
    'ready'
  );

  assert.deepEqual(
    resolveBuildContributionLumineFixSocketUpdate({
      rootBuildId: 884,
      branchBuildId: 901,
      lumineFix: null,
      eventTimeMs: 1_700_000_005_000
    }),
    {
      rootBuildId: 884,
      branchBuildId: 901,
      lumineFix: null,
      eventTimeMs: 1_700_000_005_000
    }
  );
});

test('a conflict-merge socket atomically advances the peer card and exposes Lumine sponsorship', () => {
  const update = resolveBuildContributionLumineFixSocketUpdate({
    rootBuildId: 884,
    branchBuildId: 901,
    contribution: {
      id: 901,
      contributionStatus: 'merged'
    },
    lumineFix: {
      status: 'needs_resolution',
      conflictPaths: ['/index.html']
    },
    eventTimeMs: 1_700_000_004_000
  });
  assert.deepEqual(update, {
    rootBuildId: 884,
    branchBuildId: 901,
    contribution: {
      id: 901,
      contributionStatus: 'merged'
    },
    lumineFix: {
      status: 'needs_resolution',
      conflictPaths: ['/index.html']
    },
    eventTimeMs: 1_700_000_004_000
  });

  const state = upsertBuildContributionSubmissionState({
    state: {
      buildContributionSubmissionByBranchId: {
        901: {
          status: 'open',
          __eventTime: 1_700_000_003_000
        }
      },
      buildContributionReleaseByRootBuildId: {}
    },
    ...update!
  });
  assert.deepEqual(state.buildContributionSubmissionByBranchId[901], {
    status: 'merged',
    lumineFix: {
      status: 'needs_resolution',
      conflictPaths: ['/index.html']
    },
    __eventTime: 1_700_000_004_000
  });
});

test('malformed Lumine socket events cannot mutate shared card state', () => {
  for (const payload of [
    null,
    {},
    {
      rootBuildId: 884,
      branchBuildId: 901,
      eventTimeMs: 1_700_000_005_000
    },
    {
      rootBuildId: 884,
      branchBuildId: 901,
      lumineFix: 'ready',
      eventTimeMs: 1_700_000_005_000
    },
    {
      rootBuildId: 884,
      branchBuildId: 901,
      contribution: 'merged',
      lumineFix: null,
      eventTimeMs: 1_700_000_005_000
    },
    {
      rootBuildId: 0,
      branchBuildId: 901,
      lumineFix: null,
      eventTimeMs: 1_700_000_005_000
    }
  ]) {
    assert.equal(resolveBuildContributionLumineFixSocketUpdate(payload), null);
  }
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
    isCachedCardStateFresher({ __eventTime: 3_000 }, { eventTimeMs: 4_000 }),
    false
  );
});
