import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('AI cancellation waits for canonical server state instead of mutating chat state optimistically', () => {
  const actions = readSource('src/contexts/Chat/actions.ts');
  const reducer = readSource('src/contexts/Chat/reducer.ts');
  const rightButtons = readSource(
    'src/containers/Chat/Body/MessagesContainer/MessageInput/RightButtons/index.tsx'
  );
  const requestHelper = readSource('src/contexts/requestHelpers/chat.ts');
  const combined = [actions, reducer, rightButtons, requestHelper].join('\n');

  assert.doesNotMatch(combined, /CANCEL_AI_MESSAGE|cancelledMessageIds/);
  assert.match(rightButtons, /setCancelRequest\(request\)/);
  assert.match(rightButtons, /loading=\{cancellingCurrentMessage\}/);
  assert.match(
    rightButtons,
    /currentlyStreamingAIMsgId \? \(\s*<div[\s\S]*?alignItems: 'center'[\s\S]*?<Button/
  );
  assert.match(
    requestHelper,
    /async cancelAIMessage\(\{ AIMessageId \}[\s\S]*?queryParams\.append\('AIMessageId'/
  );
  assert.doesNotMatch(requestHelper, /queryParams\.append\('hasContent'/);
});

test('AI terminal socket state carries canonical content into the reducer', () => {
  const socketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useAISocket.ts'
  );
  const actionSource = readSource('src/contexts/Chat/actions.ts');
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');

  assert.match(
    socketSource,
    /function handleAIMessageError\(\{[\s\S]*?content,[\s\S]*?onApplyCanonicalAIMessageFailure\(\{[\s\S]*?content,[\s\S]*?settings/
  );
  assert.match(
    actionSource,
    /onApplyCanonicalAIMessageFailure\(\{[\s\S]*?content,[\s\S]*?type: 'APPLY_CANONICAL_AI_MESSAGE_FAILURE'[\s\S]*?content,/
  );
  assert.match(
    reducerSource,
    /applyCanonicalAiMessageFailure\(\{[\s\S]*?content: action\.content[\s\S]*?settings: action\.settings/
  );
});
