import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const projectFileDraftsSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/hooks/useProjectFileDrafts.ts',
    import.meta.url
  ),
  'utf8'
);
const useBranchesSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/hooks/useBranches.ts',
    import.meta.url
  ),
  'utf8'
);
const collaborationPanelSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/CollaborationPanel/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const draftActionModalSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/ProjectFileDraftActionModal.tsx',
    import.meta.url
  ),
  'utf8'
);
const previewPanelSource = readFileSync(
  new URL('../src/containers/Build/PreviewPanel/index.tsx', import.meta.url),
  'utf8'
);

test('merge actions prompt before unsaved drafts can affect requests', () => {
  assert.match(
    projectFileDraftsSource,
    /const choice = await waitForDraftActionChoice\(action\);[\s\S]*?if \(choice === 'discard'\) \{[\s\S]*?discardProjectFilesDraftRef\.current\(\)[\s\S]*?return \{ ready: true \};[\s\S]*?const saved = await ensureProjectFilesPersisted\(/m
  );
  assert.doesNotMatch(projectFileDraftsSource, /files:\s*pendingFiles/);
  assert.match(
    draftActionModalSource,
    /saveLabel: 'Save and merge'[\s\S]*?discardLabel: 'Discard draft and merge'/m
  );
  assert.match(
    draftActionModalSource,
    /saveLabel: 'Save and continue'[\s\S]*?discardLabel: 'Discard draft and continue'/m
  );
});

test('merge request bodies no longer include prepared draft file arrays', () => {
  const mergeUiSource = `${useBranchesSource}\n${collaborationPanelSource}`;
  assert.doesNotMatch(mergeUiSource, /preparedFiles\.files/);
  assert.doesNotMatch(mergeUiSource, /rootProjectFiles:\s*preparedFiles/);
  assert.doesNotMatch(mergeUiSource, /projectFiles:\s*preparedFiles/);
});

test('all contribution actions run through the draft preflight', () => {
  assert.match(useBranchesSource, /handleBeforeContributionAction\('merge'\)/);
  assert.match(useBranchesSource, /handleBeforeContributionAction\('replace'\)/);
  assert.match(
    collaborationPanelSource,
    /onBeforeContributionAction\('merge'\)/
  );
  assert.match(
    collaborationPanelSource,
    /onBeforeContributionAction\('replace'\)/
  );
  assert.match(
    collaborationPanelSource,
    /onBeforeContributionAction\('update-from-main'\)/
  );
  assert.match(
    collaborationPanelSource,
    /onBeforeContributionAction\('complete-merge'\)[\s\S]*?if \(!preparedFiles\.ready\) return;[\s\S]*?completeBuildContributionMerge/m
  );
});

test('discard choice resets the preview editor draft before continuing', () => {
  assert.match(previewPanelSource, /function discardProjectFileDraft\(\)/);
  assert.match(
    previewPanelSource,
    /discardProjectFileDraft\(\)[\s\S]*?setEditableProjectFiles\(nextFiles\);[\s\S]*?setHasLocalEditableProjectFileChanges\(false\);/m
  );
});
