import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('asset transfer sockets apply canonical balances instead of coin deltas', () => {
  const source = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useAICardSocket.ts'
  );

  assert.match(source, /twinkleCoins: Number\(fromCoins\)/);
  assert.match(source, /twinkleCoins: Number\(toCoins\)/);
  assert.doesNotMatch(source, /currentTwinkleCoins\s*[+-]\s*coins/);
});

test('direct sends retain a client request id until the server confirms them', () => {
  const modal = readSource(
    'src/containers/Chat/Modals/TransactionModal/index.tsx'
  );
  const requestHelper = readSource('src/contexts/requestHelpers/chat.ts');

  assert.match(modal, /getTransactionClientRequestId\(/);
  assert.match(modal, /sessionStorage\.setItem/);
  assert.match(modal, /clearPendingAssetSendRequest\(/);
  assert.match(
    requestHelper,
    /\{ type, wanted, offered, targetId, clientRequestId \}/
  );
});

test('trade cancellation UI follows the canonical HTTP result and cannot relay terminal state', () => {
  const buttons = readSource(
    'src/containers/Chat/Modals/TransactionModal/TransactionHandler/ButtonsContainer/index.tsx'
  );

  assert.match(buttons, /const result = await closeTransaction\(/);
  assert.match(buttons, /const confirmedCancelReason = result\.cancelReason/);
  assert.doesNotMatch(buttons, /socket\.emit\(/);
});

test('trade acceptance closes only after the canonical request succeeds', () => {
  const buttons = readSource(
    'src/containers/Chat/Modals/TransactionModal/TransactionHandler/ButtonsContainer/TradeButtons.tsx'
  );

  assert.match(buttons, /if \(isDisabled\) \{[\s\S]*?return;[\s\S]*?\}/);
  assert.match(buttons, /onAcceptTrade\(\);\s+\} catch/);
  assert.doesNotMatch(
    buttons,
    /finally \{[\s\S]*?onAcceptTrade\(\);[\s\S]*?\}/
  );
});
