import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const buildRequestHelpersSource = readFileSync(
  new URL('../src/contexts/requestHelpers/build.ts', import.meta.url),
  'utf8'
);
const collaborationPanelSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/CollaborationPanel/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const forumSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/CollaborationPanel/Forum.tsx',
    import.meta.url
  ),
  'utf8'
);
const buildSocketSource = readFileSync(
  new URL(
    '../src/containers/App/Header/hooks/useAPISocket/useBuildSocket.ts',
    import.meta.url
  ),
  'utf8'
);
const buildReducerSource = readFileSync(
  new URL('../src/contexts/Build/reducer.ts', import.meta.url),
  'utf8'
);

test('main forum requests aggregate scope while branch forums stay scoped', () => {
  assert.match(buildRequestHelpersSource, /scope\?: 'all';/);
  assert.match(
    buildRequestHelpersSource,
    /scope === 'all' \? \{ scope: 'all' \} : \{\}/
  );
  assert.match(
    collaborationPanelSource,
    /scope:\s*!isContributionFork && !nextContributionBuildId\s*\? 'all'\s*: undefined/
  );
});

test('main forum composer posts to Main and branch tags open branches', () => {
  assert.match(
    collaborationPanelSource,
    /contributionBuildId: isContributionFork \? contributionBuildId : null/
  );
  assert.match(
    collaborationPanelSource,
    /function handleOpenForumThreadBranch\(thread: BuildForumThread\)/
  );
  assert.match(
    collaborationPanelSource,
    /getBuildWorkspacePath\(\{[\s\S]*?contributionRootBuildId: rootBuildId,[\s\S]*?contributionBranchNumber: branchNumber[\s\S]*?\}\)/
  );
  assert.match(forumSource, /function ForumScopeTag/);
  assert.match(forumSource, /aria-label=\{`Open \$\{label\}`\}/);
  assert.match(
    forumSource,
    /const branchTitle = getForumThreadBranchTitle\(thread\);[\s\S]*?if \(branchTitle\) return branchTitle;[\s\S]*?if \(branchNumber > 0\) return `Branch \$\{branchNumber\}`;/
  );
});

test('confirmed forum socket updates refresh both Main and branch scopes', () => {
  assert.match(
    buildSocketSource,
    /function handleBuildActivityUpdated\(\{[\s\S]*?forumUpdated[\s\S]*?onInvalidateBuildForum\(\{ rootBuildId: Number\(buildId\) \}\)/
  );
  assert.match(
    buildReducerSource,
    /case 'INVALIDATE_BUILD_FORUM':[\s\S]*?forumInvalidationVersions:[\s\S]*?\[key\]: Number\(state\.forumInvalidationVersions\?\.\[key\] \|\| 0\) \+ 1/
  );
  assert.match(
    collaborationPanelSource,
    /v\.state\.forumInvalidationVersions\[String\(rootBuildId\)\]/
  );
  assert.match(
    collaborationPanelSource,
    /refreshForumScopeFromServer\(\{ force: true \}\);[\s\S]*?refreshForumThreadFromServer\(selectedThreadId, \{ force: true \}\);/
  );
});
