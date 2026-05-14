import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const buildEditorSource = readFileSync(
  new URL('../src/containers/Build/Editor/index.tsx', import.meta.url),
  'utf8'
);
const chatCommandActionsSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/hooks/useChatCommandActions.ts',
    import.meta.url
  ),
  'utf8'
);
const versionStartPanelSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/VersionStartPanel.tsx',
    import.meta.url
  ),
  'utf8'
);
const composerSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/ChatPanel/Composer.tsx',
    import.meta.url
  ),
  'utf8'
);
const assistantMessageSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/ChatPanel/AssistantMessage.tsx',
    import.meta.url
  ),
  'utf8'
);

test('merge-conflict shortcuts route users into Lumine chat before starting the request', () => {
  assert.match(
    chatCommandActionsSource,
    /function openLumineChatShortcutTarget\(\) \{[\s\S]*?handleBuildWorkspaceCommunicationModeChange\('lumine'\);[\s\S]*?setMobilePanelTab\('chat'\);[\s\S]*?scrollChatToBottom\('smooth'\);[\s\S]*?\}/m
  );
  assert.match(
    chatCommandActionsSource,
    /async function handleAskLumineToResolveMergeConflicts[\s\S]*?openLumineChatShortcutTarget\(\);[\s\S]*?return await sendBuildMessageText\(prompt,\s*\{[\s\S]*?messageContext: mergeConflictContext/m
  );
});

test('owner attention conflict fix uses the Lumine conflict shortcut, not only branch navigation', () => {
  assert.match(
    buildEditorSource,
    /import \{ getContributionConflictMarkerPaths \} from '\.\/CollaborationPanel\/helpers\/collaborationConflicts';/
  );
  assert.match(
    buildEditorSource,
    /const mainProjectConflictMarkerPaths = getContributionConflictMarkerPaths\([\s\S]*?build\.projectFiles[\s\S]*?\);/
  );
  assert.match(
    buildEditorSource,
    /onFixMergeConflicts=\{\(\) => \{[\s\S]*?void handleAskLumineToResolveMergeConflicts\(\s*mainProjectConflictMarkerPaths\s*\);[\s\S]*?\}\}/m
  );
  assert.match(
    buildEditorSource,
    /mainProjectConflictMarkerPaths=\{mainProjectConflictMarkerPaths\}/
  );
  assert.match(versionStartPanelSource, /onFixMergeConflicts\?:/);
  assert.match(
    versionStartPanelSource,
    /mainProjectConflictMarkerCount > 0[\s\S]*?typeof onFixMergeConflicts === 'function';[\s\S]*?actionLabel: canFixWithLumine \? 'Fix' : 'Open Branches'[\s\S]*?void onFixMergeConflicts\?\.\(\);/m
  );
});

test('route-seeded Lumine prompts open the chat panel before auto-starting', () => {
  assert.match(
    buildEditorSource,
    /if \(!forceInitialPrompt && getLatestChatMessages\(\)\.length > 0\) return;[\s\S]*?didAutoPromptRef\.current = true;[\s\S]*?handleBuildWorkspaceCommunicationModeChange\('lumine'\);[\s\S]*?setMobilePanelTab\('chat'\);[\s\S]*?void startGeneration\(prompt,\s*\{/m
  );
});

test('Lumine quick-reply buttons map to the expected run actions', () => {
  assert.match(
    composerSource,
    /showScopedPlanQuickReplies[\s\S]*?\? onContinueScopedPlan[\s\S]*?: onAcceptFollowUpPrompt/m
  );
  assert.match(
    composerSource,
    /showScopedPlanQuickReplies[\s\S]*?\? onCancelScopedPlan[\s\S]*?: onDismissFollowUpPrompt/m
  );
  assert.match(composerSource, /onClick=\{onPrefillRedirect\}/);
  assert.match(
    assistantMessageSource,
    /onClick=\{\(\) => void onFixRuntimeObservationMessage\(message\)\}/
  );
});
