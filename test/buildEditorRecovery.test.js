import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

// BuildEditor.tsx was folderized into Build/Editor/. The message-matching
// helpers moved verbatim into helpers/chatMessages.ts and the id adoption into
// hooks/useChatSync.ts, so those guards simply follow them.
const chatMessagesSource = readSource(
  'src/containers/Build/Editor/helpers/chatMessages.ts'
);
const chatSyncSource = readSource(
  'src/containers/Build/Editor/hooks/useChatSync.ts'
);
const runRecoverySource = readSource(
  'src/containers/Build/Editor/hooks/useRunRecovery.ts'
);

test('build editor reconciles recovered assistant replies onto the active row', () => {
  assert.match(
    chatMessagesSource,
    /export function doesRecoveredBuildAssistantMessageMatchTarget\(\{[\s\S]*?candidateMessage\.persisted[\s\S]*?Math\.abs\(candidateCreatedAt - targetCreatedAt\) > 5/m
  );
  assert.match(
    chatMessagesSource,
    /export function mergePersistedChatMessagesIntoLocalMessages\(\{[\s\S]*?activeUserMessage\?: ChatMessage \| null;[\s\S]*?doesRecoveredBuildAssistantMessageMatchTarget/m
  );
  // The active assistant row is re-identified from the merged list, now via
  // runIdentity.adoptMessageIds instead of a bare assistantMessageIdRef write.
  assert.match(
    chatSyncSource,
    /assistantMessageId: findMatchingBuildChatMessageId\(\{[\s\S]*?targetMessage: activeAssistantMessage,[\s\S]*?activeUserMessage[\s\S]*?\}\)/m
  );
});

test('deduped recovery stops when the run it was recovering is no longer current', () => {
  // The old stop condition inspected the recovered assistant message
  // (isRecoveredBuildAssistantMessageResolved). 868105203 ("fix lumine hanging
  // issue") replaced it with an identity check: recovery for a requestId halts
  // as soon as that id is no longer the current run or the in-flight deduped
  // request. Terminal outcomes now arrive via shared replay or socket events
  // rather than being synthesized here.
  assert.match(
    runRecoverySource,
    /function reconcileDedupedProcessingRequest\(requestId: string\) \{[\s\S]*?getCurrentRunRequestId\(requestId, latestSharedRunIdentityState\) !==\s*requestId \|\|[\s\S]*?getDedupedProcessingRequestId\(\) !== requestId[\s\S]*?resetDedupedProcessingReconcileState\(\);/m
  );
});
