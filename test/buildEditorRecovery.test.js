import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const buildEditorSource = readFileSync(
  new URL('../src/containers/Build/BuildEditor.tsx', import.meta.url),
  'utf8'
);

test('build editor reconciles recovered assistant replies onto the active row', () => {
  assert.match(
    buildEditorSource,
    /function doesRecoveredBuildAssistantMessageMatchTarget\(\{[\s\S]*?candidateMessage\.persisted[\s\S]*?Math\.abs\(candidateCreatedAt - targetCreatedAt\) > 5/m
  );
  assert.match(
    buildEditorSource,
    /mergePersistedChatMessagesIntoLocalMessages\(\{[\s\S]*?activeUserMessage\?: ChatMessage \| null;[\s\S]*?message\.id !== Number\(activeAssistantMessageId \|\| 0\)[\s\S]*?doesRecoveredBuildAssistantMessageMatchTarget/m
  );
  assert.match(
    buildEditorSource,
    /assistantMessageIdRef\.current = findMatchingBuildChatMessageId\(\{[\s\S]*?targetMessage: activeAssistantMessage,[\s\S]*?activeUserMessage[\s\S]*?\}\);/m
  );
});

test('build editor stops deduped recovery once a final persisted assistant reply is present', () => {
  assert.match(
    buildEditorSource,
    /isRecoveredBuildAssistantMessageResolved\(activeAssistantMessage\)[\s\S]*?onCompleteBuildRun\(\{[\s\S]*?persistedAssistantId: activeAssistantMessage\??\.id[\s\S]*?resetDedupedProcessingReconcileState\(\);/m
  );
});
