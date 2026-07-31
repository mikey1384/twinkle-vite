import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getBuildRuntimePath,
  resolveBuildWorkspaceViewAppTarget
} from '../src/helpers/buildRuntimeSource';

test('authorized branch workspaces expose the saved branch runtime', () => {
  const target = resolveBuildWorkspaceViewAppTarget({
    isBuildOwner: false,
    isContributionBranch: true,
    isPublic: false
  });

  assert.deepEqual(target, {
    source: 'workspace',
    visible: true
  });
  assert.equal(
    getBuildRuntimePath(812, target.source),
    '/app/812?runtimeSource=workspace'
  );
});

test('canonical build runtime visibility keeps its owner and public rules', () => {
  assert.deepEqual(
    resolveBuildWorkspaceViewAppTarget({
      isBuildOwner: true,
      isContributionBranch: false,
      isPublic: false
    }),
    { source: 'published', visible: true }
  );
  assert.deepEqual(
    resolveBuildWorkspaceViewAppTarget({
      isBuildOwner: false,
      isContributionBranch: false,
      isPublic: true
    }),
    { source: 'published', visible: true }
  );
  assert.deepEqual(
    resolveBuildWorkspaceViewAppTarget({
      isBuildOwner: false,
      isContributionBranch: false,
      isPublic: false
    }),
    { source: 'published', visible: false }
  );
});
