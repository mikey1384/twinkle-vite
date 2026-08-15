import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const modalSource = readFileSync(
  new URL('../src/components/Modals/AICardModal/index.tsx', import.meta.url),
  'utf8'
);
const socketSource = readFileSync(
  new URL(
    '../src/containers/App/Header/hooks/useAPISocket/useAICardSocket.ts',
    import.meta.url
  ),
  'utf8'
);
const requestHelperSource = readFileSync(
  new URL('../src/contexts/requestHelpers/chat.ts', import.meta.url),
  'utf8'
);

test('AI Card image generation gates duplicate clicks without optimistic shared state', () => {
  const handlerStart = modalSource.indexOf(
    'async function handleGenerateImage()'
  );
  const handlerEnd = modalSource.indexOf(
    '\n  function queueCanonicalImageStateReconciliation',
    handlerStart
  );
  const handler = modalSource.slice(handlerStart, handlerEnd);

  assert(handlerStart >= 0);
  assert.match(
    handler,
    /pendingImageRequestCardIdsRef\.current\.add\(requestedCardId\)/
  );
  assert.match(handler, /setPendingImageRequestCardIds\(/);
  assert.match(
    handler,
    /getConfirmedAICardImageTerminalState\(\{[\s\S]*?card: newState,[\s\S]*?stage: 'completed'[\s\S]*?newState:[\s\S]*?canonicalCompletionState/
  );
  assert.match(
    handler,
    /normalizeAICardId\(error\?\.card\?\.id\) === requestedCardId[\s\S]*?getConfirmedAICardImageTerminalState\(\{[\s\S]*?card: error\.card,[\s\S]*?stage: 'error'[\s\S]*?newState: canonicalFailureState/
  );
  assert.match(
    handler,
    /if \(!canonicalFailureApplied\) \{[\s\S]*?queueCanonicalImageStateReconciliation\(requestedCardId\)/m
  );
  assert.match(
    modalSource,
    /async function reconcileCanonicalImageState\(requestedCardId: number\)[\s\S]*?await loadAICard\(requestedCardId\)[\s\S]*?getConfirmedAICardImageState\(canonicalCard\)[\s\S]*?onUpdateAICard/m
  );
  assert.doesNotMatch(handler, /imageGenerationInProgress:\s*true/);
  assert.doesNotMatch(handler, /imageGenerationStage:\s*'calling_openai'/);
});

test('unknown AI Card image outcomes retry canonical reconciliation after reconnect', () => {
  assert.match(
    modalSource,
    /socket\.on\('connect', handleTransportAvailable\)/
  );
  assert.match(
    modalSource,
    /await waitForSocketAuthReady\(nextUserId\)[\s\S]*?enter_my_notification_channel[\s\S]*?reconcileQueuedCanonicalImageStates\(\)/m
  );
  assert.match(
    modalSource,
    /pendingCanonicalImageReconciliationCardIdsRef\.current\.add\(requestedCardId\)/
  );
});

test('persisted AI Card image placeholders reconcile through canonical status on modal open', () => {
  assert.match(
    modalSource,
    /card\.isImageGenerating[\s\S]*?queueCanonicalImageStateReconciliation\(card\.id\)/m
  );
  assert.match(
    modalSource,
    /if \(canonicalCard\.isImageGenerating\)[\s\S]*?await loadAICardImageStatus\([\s\S]*?imageStatus\.card[\s\S]*?confirmedTerminalStage/m
  );
  assert.match(
    requestHelperSource,
    /async loadAICardImageStatus[\s\S]*?path: '\/chat\/aiCard\/image\/status'/m
  );
  assert.match(
    modalSource,
    /if \(!canonicalGenerationStillRunning\) \{[\s\S]*?pendingCanonicalImageReconciliationCardIdsRef\.current\.delete/m
  );
  assert.doesNotMatch(
    modalSource,
    /!canonicalGenerationStillRunning \|\| socket\.connected/
  );
});

test('AI Card image progress remains shared from canonical server events', () => {
  assert.match(
    socketSource,
    /socket\.on\(\s*'ai_card_image_generation_status_received',\s*handleAICardImageStatus/m
  );
  assert.match(socketSource, /onUpdateAICard\(\{ cardId, newState \}\)/);
  assert.match(
    socketSource,
    /\(stage === 'completed' \|\| stage === 'error'\)[\s\S]*?getConfirmedAICardImageTerminalState\(\{[\s\S]*?card: canonicalCard,[\s\S]*?stage/
  );
});

test('AI Card market and burn controls stay unavailable during image generation', () => {
  assert.match(
    modalSource,
    /showMenuTabs[\s\S]*?cardIsLive && !generatingImage/
  );
  assert.match(
    modalSource,
    /\{cardIsLive &&\s*!generatingImage &&\s*\(card\.isListed \?/
  );
});

test('AI Card image HTTP failures preserve their canonical card payload', () => {
  const helperStart = requestHelperSource.indexOf(
    'function handleChatError(error: any)'
  );
  const helperEnd = requestHelperSource.indexOf(
    'async function loadCanonicalChatChannelUnreadState',
    helperStart
  );
  const helper = requestHelperSource.slice(helperStart, helperEnd);

  assert(helperStart >= 0);
  assert.match(helper, /data\.card/);
  assert.match(helper, /return Promise\.reject\(\{[\s\S]*?\.\.\.data/);
});
