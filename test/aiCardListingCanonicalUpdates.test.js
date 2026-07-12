import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

const requestHelperSource = readSource('../src/contexts/requestHelpers/chat.ts');
const sellModalSource = readSource(
  '../src/components/Modals/AICardModal/SellModal.tsx'
);
const ownerMenuSource = readSource(
  '../src/components/Modals/AICardModal/ListedMenu/OwnerMenu.tsx'
);
const batchConfirmSource = readSource(
  '../src/containers/Explore/AICards/SelectAICardModal/ConfirmSelectionModal/FinalConfirm.tsx'
);
const reducerSource = readSource('../src/contexts/Chat/reducer.ts');
const actionsSource = readSource('../src/contexts/Chat/actions.ts');
const aiCardSocketSource = readSource(
  '../src/containers/App/Header/hooks/useAPISocket/useAICardSocket.ts'
);

test('listing request helpers preserve canonical HTTP payloads', () => {
  assert.match(
    requestHelperSource,
    /async listAICard[\s\S]*?const \{ data \} = await request\.post[\s\S]*?return data/
  );
  assert.match(
    requestHelperSource,
    /async delistAICard[\s\S]*?const \{ data \} = await request\.delete[\s\S]*?return data/
  );
});

test('single-card list and delist flows apply their HTTP confirmations', () => {
  assert.match(
    sellModalSource,
    /await listAICard[\s\S]*?result\?\.success[\s\S]*?onListAICard\(\{ card: result\.card \}\)/
  );
  assert.match(
    ownerMenuSource,
    /await delistAICard[\s\S]*?result\?\.success[\s\S]*?onRemoveListedAICard\(cardId\)[\s\S]*?onListAICard\(\{ card: result\.card \}\)/
  );
});

test('batch listing applies every confirmed result without awaiting sockets', () => {
  assert.match(
    batchConfirmSource,
    /const \{ coins, successes \} = await batchSellAICards[\s\S]*?success\?\.action === 'listed'[\s\S]*?onListAICard\(\{ card: success\.card \}\)/
  );
  assert.match(
    batchConfirmSource,
    /success\?\.action === 'sold'[\s\S]*?onDelistAICard\(cardId\)[\s\S]*?onRemoveMyAICard\(cardId\)/
  );
});

test('uncached owner listing events retain the full canonical card', () => {
  assert.match(
    reducerSource,
    /case 'LIST_AI_CARD':[\s\S]*?const existingCard[\s\S]*?existingCard[\s\S]*?\{ \.\.\.action\.card, \.\.\.action\.newState \}/
  );
});

test('canonical card updates can seed an uncached entry from the full payload', () => {
  assert.match(
    actionsSource,
    /onUpdateAICard\(\{[\s\S]*?initialState[\s\S]*?type: 'UPDATE_AI_CARD'[\s\S]*?initialState/
  );
  assert.match(
    reducerSource,
    /case 'UPDATE_AI_CARD':[\s\S]*?existingCard \|\| action\.initialState \|\| \{\}/
  );
  assert.match(
    aiCardSocketSource,
    /function handleAssetsSent[\s\S]*?onApplyAICardDirectTransfer\(\{[\s\S]*?card: confirmedCard,[\s\S]*?newState: confirmedTransferState/
  );
});

test('direct-transfer collections follow the writer-backed owner and listing', () => {
  assert.match(
    actionsSource,
    /onApplyAICardDirectTransfer[\s\S]*?type: 'APPLY_AI_CARD_DIRECT_TRANSFER'/
  );
  assert.match(
    reducerSource,
    /case 'APPLY_AI_CARD_DIRECT_TRANSFER':[\s\S]*?currentUserOwnsCard[\s\S]*?myCardIds: updateCardIdMembership[\s\S]*?currentUserOwnsCard && cardIsListed[\s\S]*?!currentUserOwnsCard && cardIsListed/
  );
  assert.match(
    aiCardSocketSource,
    /function handleAssetsSent\(\{[\s\S]*?aiCardPayloadVersion[\s\S]*?getConfirmedAICardDirectTransferState\(\{[\s\S]*?aiCardPayloadVersion/
  );
});
