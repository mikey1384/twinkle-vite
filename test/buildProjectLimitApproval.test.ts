import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareBuildProjectLimitRequestVersions,
  getBuildProjectLimitRequestOpenPath,
  mergeBuildPolicyPreservingNewerProjectLimits,
  shouldApplyBuildProjectLimitApproval
} from '../src/helpers/buildProjectLimitApproval';

test('project-limit request versions follow canonical request, revision, then event time', () => {
  assert.ok(
    compareBuildProjectLimitRequestVersions(
      { requestId: 8, revision: 1, eventTimeMs: 1 },
      { requestId: 7, revision: 99, eventTimeMs: 99 }
    ) > 0
  );
  assert.ok(
    compareBuildProjectLimitRequestVersions(
      { requestId: 8, revision: 3, eventTimeMs: 1 },
      { requestId: 8, revision: 2, eventTimeMs: 99 }
    ) > 0
  );
  assert.ok(
    compareBuildProjectLimitRequestVersions(
      { requestId: 8, revision: 3, eventTimeMs: 101 },
      { requestId: 8, revision: 3, eventTimeMs: 100 }
    ) > 0
  );
});

test('a stale HTTP policy cannot replace a newer socket-delivered limit state', () => {
  const current = {
    limits: { maxFilesPerProject: 500 },
    usage: { fileCount: 101 },
    projectLimitApproval: {
      canonicalBuildId: 42,
      latestRequest: { requestId: 9, revision: 2, eventTimeMs: 2_000 }
    }
  };
  const stale = {
    limits: { maxFilesPerProject: 100 },
    usage: { fileCount: 100 },
    projectLimitApproval: {
      canonicalBuildId: 42,
      latestRequest: { requestId: 9, revision: 1, eventTimeMs: 1_000 }
    }
  };

  assert.equal(
    shouldApplyBuildProjectLimitApproval(
      stale.projectLimitApproval,
      current.projectLimitApproval
    ),
    false
  );
  assert.deepEqual(
    mergeBuildPolicyPreservingNewerProjectLimits(stale, current),
    {
      ...stale,
      limits: current.limits,
      usage: current.usage,
      projectLimitApproval: current.projectLimitApproval
    }
  );
});

test('project-limit versions do not leak across different canonical builds', () => {
  assert.equal(
    shouldApplyBuildProjectLimitApproval(
      {
        canonicalBuildId: 44,
        latestRequest: { requestId: 1, revision: 1, eventTimeMs: 1 }
      },
      {
        canonicalBuildId: 42,
        latestRequest: { requestId: 99, revision: 99, eventTimeMs: 99 }
      }
    ),
    true
  );
  assert.equal(shouldApplyBuildProjectLimitApproval(null, null), true);
  assert.equal(
    shouldApplyBuildProjectLimitApproval(null, {
      canonicalBuildId: 42,
      latestRequest: null
    }),
    false
  );
});

test('private project review links exist only for requester or active reviewer', () => {
  const base = {
    buildId: 42,
    requestedByUserId: 7,
    reviewerUserId: 9
  };
  assert.equal(
    getBuildProjectLimitRequestOpenPath({
      ...base,
      myId: 7,
      status: 'approved'
    }),
    '/build/42'
  );
  assert.equal(
    getBuildProjectLimitRequestOpenPath({
      ...base,
      myId: 9,
      status: 'pending'
    }),
    '/build/42'
  );
  assert.equal(
    getBuildProjectLimitRequestOpenPath({
      ...base,
      myId: 9,
      status: 'approved'
    }),
    null
  );
});
