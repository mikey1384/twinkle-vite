import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

const socketSource = readSource(
  'src/containers/App/Header/hooks/useAPISocket/useBuildSocket.ts'
);
const reducerSource = readSource('src/contexts/Build/reducer.ts');
const terminalActionsSource = readSource(
  'src/containers/Build/Editor/hooks/useRunTerminalActions.ts'
);
const sharedTerminalReconciliationSource = readSource(
  'src/containers/Build/Editor/hooks/useSharedTerminalRunReconciliation.ts'
);
const projectFilesSource = readSource(
  'src/containers/Build/Editor/hooks/useProjectFiles.ts'
);
const projectFileDraftsSource = readSource(
  'src/containers/Build/Editor/hooks/useProjectFileDrafts.ts'
);
const editorSource = readSource('src/containers/Build/Editor/index.tsx');
const chatSyncSource = readSource(
  'src/containers/Build/Editor/hooks/useChatSync.ts'
);
const projectFileActionsSource = readSource(
  'src/containers/Build/PreviewPanel/hooks/useProjectFileActions.ts'
);
const projectFileUploadsSource = readSource(
  'src/containers/Build/PreviewPanel/hooks/useProjectFileUploads.ts'
);
const previewPanelSource = readSource(
  'src/containers/Build/PreviewPanel/index.tsx'
);
const previewPanelTypesSource = readSource(
  'src/containers/Build/PreviewPanel/types/index.ts'
);

test('post-run canonical file hashes reach the draft save base', () => {
  assert.match(socketSource, /projectFilesHash: projectFilesHash\.trim\(\)/);
  assert.match(
    reducerSource,
    /'projectFilesHash'[\s\S]*?action\.buildRun\.projectFilesHash\.trim\(\)/m
  );
  assert.match(
    terminalActionsSource,
    /hasCanonicalProjectFilesHash[\s\S]*?\{ projectFilesHash: payloadProjectFilesHash \}/m
  );
  assert.match(
    terminalActionsSource,
    /const completionRequiresCanonicalProjectFilesResync = Boolean\([\s\S]*?!hasCanonicalProjectFilesHash[\s\S]*?\);/m
  );
  assert.match(
    terminalActionsSource,
    /if \(hasCanonicalProjectFilesHash && payloadProjectFiles\)/
  );
  assert.match(
    terminalActionsSource,
    /completionRequiresCanonicalProjectFilesResync[\s\S]*?Keep the last verified build intact[\s\S]*?setRequiresProjectFilesResyncBeforeSave\(true\)/m
  );
  assert.doesNotMatch(
    terminalActionsSource,
    /completionUsedFallbackProjectFiles/
  );
});

test('shared code-only completions load a canonical save base before applying workspace state', () => {
  assert.match(
    sharedTerminalReconciliationSource,
    /const hasSharedTerminalWorkspaceSnapshot =[^;]*sharedArtifactCode !== null[^;]*;/m
  );
  assert.match(
    sharedTerminalReconciliationSource,
    /const sharedHasCanonicalProjectFilesSnapshot = Boolean\([\s\S]*?normalizedBaseProjectFiles\.length > 0 && sharedProjectFilesHash/m
  );

  const unknownSnapshotGuardIndex =
    sharedTerminalReconciliationSource.indexOf(
      'hasSharedTerminalWorkspaceSnapshot &&\n      !sharedHasCanonicalProjectFilesSnapshot'
    );
  const writerSyncIndex = sharedTerminalReconciliationSource.indexOf(
    'syncChatMessagesFromServer(undefined, true',
    unknownSnapshotGuardIndex
  );
  const localWorkspaceApplyIndex = sharedTerminalReconciliationSource.indexOf(
    'applyBuildUpdate(appliedBuild)',
    unknownSnapshotGuardIndex
  );
  assert.ok(unknownSnapshotGuardIndex > 0);
  assert.ok(writerSyncIndex > unknownSnapshotGuardIndex);
  assert.ok(localWorkspaceApplyIndex > writerSyncIndex);
  assert.match(
    sharedTerminalReconciliationSource.slice(
      unknownSnapshotGuardIndex,
      localWorkspaceApplyIndex
    ),
    /expectedBuildId: Number\(currentBuild\.id\)[\s\S]*?return;/m
  );
});

test('a dirty draft with an unknown base fails closed', () => {
  assert.match(
    projectFilesSource,
    /\(hasDraftBaseFilesHash \|\| hasExplicitTargetBuild\) &&[\s\S]*?!normalizedDraftBaseFilesHash[\s\S]*?Unable to verify which server version these edits were based on/m
  );
  assert.match(
    projectFilesSource,
    /draftBaseFilesHash: draftBaseFilesHash \?\? null/
  );
});

test('explicit-target imports keep their original build identity and draft base', () => {
  const captureIndex = projectFileUploadsSource.indexOf(
    'const uploadTargetBuildId = Number(buildId || 0);'
  );
  const firstAwaitAfterHandler = projectFileUploadsSource.indexOf(
    'await ',
    projectFileUploadsSource.indexOf('async function handleUploadProjectFiles')
  );
  assert.ok(captureIndex > 0);
  assert.ok(captureIndex < firstAwaitAfterHandler);
  assert.match(
    projectFileUploadsSource,
    /draftBaseFilesHash: uploadTargetDraftBaseFilesHash/
  );
  assert.match(
    projectFileActionsSource,
    /draftBaseFilesHash !== undefined[\s\S]*?draftBaseFilesHash[\s\S]*?: getDraftBaseFilesHash\(\)/m
  );
  assert.match(
    projectFilesSource,
    /const baseFilesHash = hasDraftBaseFilesHash[\s\S]*?normalizedDraftBaseFilesHash[\s\S]*?: targetsTrackedBuild/m
  );
});

test('stale saves reload complete canonical build state for the active target', () => {
  const reconciliationSource = projectFilesSource.match(
    /async function refreshBuildAfterStaleSave\([\s\S]*?\n  \}/m
  )?.[0];
  assert.ok(reconciliationSource);
  assert.match(
    reconciliationSource,
    /Number\(latestBuild\.id\) !== requestBuildId/
  );
  assert.match(
    reconciliationSource,
    /syncChatMessagesFromServer\(undefined, true, \{[\s\S]*?expectedBuildId: requestBuildId/m
  );
  assert.doesNotMatch(reconciliationSource, /currentProjectFiles/);
  assert.doesNotMatch(reconciliationSource, /applyBuildUpdate/);

  const loadIndex = chatSyncSource.indexOf(
    'const buildPayload = await loadBuild'
  );
  const postLoadIdentityGuardIndex = chatSyncSource.indexOf(
    'Number(getLatestBuild()?.id || 0) !== expectedBuildId',
    loadIndex
  );
  const canonicalBuildApplyIndex = chatSyncSource.indexOf(
    'applyBuildUpdate(nextBuild)',
    loadIndex
  );
  assert.ok(loadIndex > 0);
  assert.ok(postLoadIdentityGuardIndex > loadIndex);
  assert.ok(canonicalBuildApplyIndex > postLoadIdentityGuardIndex);
});

test('every confirmed active save rebases retained draft edits before unlocking', () => {
  assert.match(
    projectFilesSource,
    /return \{ success: true, filesHash: savedFilesHash \}/
  );
  assert.match(
    projectFileActionsSource,
    /filesHash:[\s\S]*?typeof result\.filesHash === 'string'/m
  );

  const trackedSaveIndex = projectFileActionsSource.indexOf(
    'async function saveEditableProjectFilesWithTracking'
  );
  const acceptedHashIndex = projectFileActionsSource.indexOf(
    'const acceptedFilesHash =',
    trackedSaveIndex
  );
  const activeTargetGuardIndex = projectFileActionsSource.indexOf(
    'isActiveBuildId(requestBuildId)',
    acceptedHashIndex
  );
  const rebaseIndex = projectFileActionsSource.indexOf(
    'rebaseDraftBaseFilesHash(acceptedFilesHash)',
    activeTargetGuardIndex
  );
  const unlockIndex = projectFileActionsSource.indexOf(
    'setSavingProjectFilesState(false)',
    rebaseIndex
  );
  assert.ok(trackedSaveIndex > 0);
  assert.ok(acceptedHashIndex > trackedSaveIndex);
  assert.ok(activeTargetGuardIndex > acceptedHashIndex);
  assert.ok(rebaseIndex > activeTargetGuardIndex);
  assert.ok(unlockIndex > rebaseIndex);
  assert.doesNotMatch(
    projectFileUploadsSource,
    /rebaseDraftBaseFilesHash\(saveResult\.filesHash\)/
  );
  assert.match(
    previewPanelSource,
    /function rebaseDraftBaseFilesHash\(filesHash: string\) \{[\s\S]*?draftBaseFilesHashRef\.current = filesHash/m
  );
});

test('autosave retries advance retained edits to their own accepted save base', () => {
  assert.match(
    projectFileDraftsSource,
    /interface BuildProjectFileSaveResult \{[\s\S]*?filesHash\?: string \| null;/m
  );

  const saveIndex = projectFileDraftsSource.indexOf(
    'const saveResult = await persistProjectFilesDraftRef.current('
  );
  const acceptedHashIndex = projectFileDraftsSource.indexOf(
    'const acceptedFilesHash =',
    saveIndex
  );
  const localBaseAdvanceIndex = projectFileDraftsSource.indexOf(
    'draftBaseFilesHashRef.current = acceptedFilesHash;',
    acceptedHashIndex
  );
  const previewBaseAdvanceIndex = projectFileDraftsSource.indexOf(
    'onAdvanceProjectFilesDraftBaseRef.current(acceptedFilesHash);',
    localBaseAdvanceIndex
  );
  const retrySettleIndex = projectFileDraftsSource.indexOf(
    'await wait(40);',
    previewBaseAdvanceIndex
  );
  assert.ok(saveIndex > 0);
  assert.ok(acceptedHashIndex > saveIndex);
  assert.ok(localBaseAdvanceIndex > acceptedHashIndex);
  assert.ok(previewBaseAdvanceIndex > localBaseAdvanceIndex);
  assert.ok(retrySettleIndex > previewBaseAdvanceIndex);

  assert.match(
    projectFilesSource,
    /onAdvanceProjectFilesDraftBase,[\s\S]*?onAppendFeedbackEvent: onAppendLocalRunEvent/m
  );
  assert.match(
    previewPanelTypesSource,
    /rebaseProjectFileDraftBase: \(filesHash: string\) => void;/
  );
  assert.match(
    previewPanelSource,
    /rebaseProjectFileDraftBase: rebaseDraftBaseFilesHash/
  );
  assert.match(
    editorSource,
    /function rebaseCurrentProjectFileDraftBase\(filesHash: string\) \{[\s\S]*?previewPanelRef\.current\?\.rebaseProjectFileDraftBase\(filesHash\);/m
  );
});
