import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { canUseGenericChatMessageActions } from '../src/helpers/chatMessageCapabilities';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('notification rows and server-issued workflow cards disable generic chat actions', () => {
  assert.equal(
    canUseGenericChatMessageActions({ isNotification: true }),
    false
  );
  assert.equal(
    canUseGenericChatMessageActions({ isNotification: 1 }),
    false
  );
  assert.equal(
    canUseGenericChatMessageActions({ isNotification: '0' }),
    true
  );
  for (const structuredNotice of [
    { inviteFrom: 12 },
    { invitePath: 34 },
    { invitePath: '/chat/invitation/abc' },
    { isCallMsg: 1 },
    { isChessMsg: true },
    { isDrawOffer: 1 },
    { transactionId: 56 },
    { transferId: 78 }
  ]) {
    assert.equal(canUseGenericChatMessageActions(structuredNotice), false);
  }
  for (const rootType of [
    'approval',
    'modification',
    'buildContributionInvite',
    'buildCollaborationRequest',
    'buildContributionSubmission',
    'buildThumbnailSuggestion',
    'buildProjectLimitRequest',
    'aiCardOffer',
    'cliAdminChatMessage'
  ]) {
    assert.equal(canUseGenericChatMessageActions({ rootType }), false);
  }
  assert.equal(canUseGenericChatMessageActions({}), true);
  assert.equal(
    canUseGenericChatMessageActions({ rootType: 'chat' }),
    true
  );
  assert.equal(
    canUseGenericChatMessageActions({
      inviteFrom: 0,
      isCallMsg: '0',
      transactionId: null
    }),
    true
  );
});

test('the message renderer uses one capability gate for every generic action surface', () => {
  const bodySource = readSource(
    'src/containers/Chat/Message/MessageBody/index.tsx'
  );
  const contentSource = readSource(
    'src/containers/Chat/Message/MessageBody/Content.tsx'
  );
  assert.match(
    bodySource,
    /const genericActionsAllowed = canUseGenericChatMessageActions/
  );
  assert.match(
    bodySource,
    /const isMenuButtonsAllowed = useMemo\([\s\S]*?genericActionsAllowed/
  );
  assert.match(bodySource, /if \(!genericActionsAllowed \|\| isDrawOffer\)/);
  assert.match(
    bodySource,
    /genericActionsAllowed &&[\s\S]*?canReward/
  );
  assert.match(
    bodySource,
    /messageRewardModalShown && genericActionsAllowed/
  );
  assert.match(
    contentSource,
    /!isEditing && isMenuButtonsAllowed[\s\S]*?<Reactions/
  );
});
