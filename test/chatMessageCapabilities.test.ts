import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CHAT_MESSAGE_KIND_RULES,
  canReactToChatMessage,
  canReplyToChatMessage,
  canUseGenericChatMessageActions,
  getChatMessageKind,
  isInteractiveCardMessage,
  isSenderDeleteOnlyBuildSuggestionMessage
} from '../src/helpers/chatMessageCapabilities';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('notification rows and server-issued workflow cards disable generic chat actions', () => {
  assert.equal(
    canUseGenericChatMessageActions({ isNotification: true }),
    false
  );
  assert.equal(canUseGenericChatMessageActions({ isNotification: 1 }), false);
  assert.equal(canUseGenericChatMessageActions({ isNotification: '0' }), true);
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
    'buildRewardReview',
    'buildReviewRequest',
    'aiCardOffer',
    'cliAdminChatMessage',
    'meetupQuest',
    'meetupQuestInvite',
    'meetupQuestSlot',
    'meetupStory',
    'meetupTeacherRequest'
  ]) {
    assert.equal(canUseGenericChatMessageActions({ rootType }), false);
  }
  assert.equal(canUseGenericChatMessageActions({}), true);
  assert.equal(canUseGenericChatMessageActions({ rootType: 'chat' }), true);
  assert.equal(
    canUseGenericChatMessageActions({
      inviteFrom: 0,
      isCallMsg: '0',
      transactionId: null
    }),
    true
  );
});

test('only a Build suggestion sender receives the delete-only capability', () => {
  for (const rootType of [
    'buildContributionSubmission',
    'buildThumbnailSuggestion'
  ]) {
    const message = { rootType, userId: 42 };
    assert.equal(canUseGenericChatMessageActions(message), false);
    assert.equal(
      isSenderDeleteOnlyBuildSuggestionMessage({
        message,
        actorUserId: 42
      }),
      true
    );
    assert.equal(
      isSenderDeleteOnlyBuildSuggestionMessage({
        message,
        actorUserId: 43
      }),
      false
    );
  }

  assert.equal(
    isSenderDeleteOnlyBuildSuggestionMessage({
      message: { rootType: 'buildContributionInvite', userId: 42 },
      actorUserId: 42
    }),
    false
  );
});

test('the message renderer uses one capability gate for every generic action surface', () => {
  const bodySource = readSource(
    'src/containers/Chat/Message/MessageBody/index.tsx'
  );
  const contentSource = readSource(
    'src/containers/Chat/Message/MessageBody/Content.tsx'
  );
  const actionButtonsSource = readSource(
    'src/containers/Chat/Message/MessageBody/ActionButtons.tsx'
  );
  assert.match(
    bodySource,
    /const genericActionsAllowed =\s*canUseGenericChatMessageActions\(capabilityMessage\) && !isInteractiveCard/
  );
  assert.match(
    bodySource,
    /const isMenuButtonsAllowed = useMemo\([\s\S]*?genericActionsAllowed/
  );
  assert.match(bodySource, /if \(!genericActionsAllowed \|\| isDrawOffer\)/);
  assert.match(bodySource, /genericActionsAllowed &&[\s\S]*?canReward/);
  assert.match(bodySource, /messageRewardModalShown && genericActionsAllowed/);
  assert.match(
    bodySource,
    /isSenderDeleteOnlyBuildSuggestionMessage\([\s\S]*?actorUserId: myId/
  );
  assert.match(
    bodySource,
    /\(genericActionsAllowed \|\|\s*isDeleteOnlyBuildSuggestion \|\|\s*isInteractiveCard\)/
  );
  assert.match(
    actionButtonsSource,
    /isDeleteOnlyBuildSuggestion \? deleteLabel : removeLabel/
  );
  // Reply and reactions share one rule (canReplyToChatMessage and
  // canReactToChatMessage read the same kind table).
  assert.match(
    bodySource,
    /const canReply = canReplyToChatMessage\(capabilityMessage\)/
  );
  assert.match(
    bodySource,
    /const canReact = canReactToChatMessage\(capabilityMessage\)/
  );
  assert.match(
    contentSource,
    /!isEditing && isMenuButtonsAllowed && canReact && \(\s*<Reactions/
  );
  assert.match(
    actionButtonsSource,
    /\{canReact && !isBanned && !directChatBlocked && \(\s*<ReactionButton/
  );
  assert.match(actionButtonsSource, /if \(canReply && !isRestricted\)/);
  for (const gate of [
    /!isDeleteOnlyBuildSuggestion &&\s*!isInteractiveCard &&\s*userCanEditThis/,
    /!isDeleteOnlyBuildSuggestion &&\s*!isInteractiveCard &&\s*userCanRewardThis/,
    /!isDeleteOnlyBuildSuggestion && !isInteractiveCard && canBookmark/,
    /!isInteractiveCard &&\s*canUseGenericChatMessageActions\(message\)/
  ]) {
    assert.match(actionButtonsSource, gate);
  }
});

test('every card that takes a reply takes reactions, and nothing else of the generic menu', () => {
  const cards = [
    { rootType: 'buildContributionInvite' },
    { rootType: 'buildRewardReview', isNotification: 1 },
    { transactionId: 33301 },
    { transferId: 9 },
    { rootType: 'aiCardOffer' },
    { gameWinnerId: 42, isChessMsg: 1 },
    { isDraw: 1, isChessMsg: 1 },
    { isDrawOffer: 1 },
    { inviteFrom: 4 },
    { invitePath: '/chat/invitation/abc' },
    { rootType: 'approval', isNotification: 1 },
    { rootType: 'modification', isNotification: 1 },
    { rootType: 'cliAdminChatMessage' },
    { rootType: 'meetupTeacherRequest' },
    { rootType: 'meetupQuestInvite', isNotification: 1 },
    { rootType: 'meetupQuestCrew', isNotification: 1 },
    { wordleResult: { isSolved: true } }
  ];
  for (const card of cards) {
    assert.equal(canReplyToChatMessage(card), true, JSON.stringify(card));
    assert.equal(canReactToChatMessage(card), true, JSON.stringify(card));
    assert.equal(isInteractiveCardMessage(card), true, JSON.stringify(card));
  }
  for (const blocked of [
    { transactionId: 33301, isNotification: 1 },
    { isNotification: true },
    { isCallMsg: 1 },
    { isChessMsg: 1, chessState: { move: {} } },
    { isChessMsg: 1, omokState: { board: [] }, gameWinnerId: 5 },
    { rootType: 'chatMessageReport', isNotification: 1 },
    { rootType: 'meetupBranch', isNotification: 1 }
  ]) {
    assert.equal(
      canReplyToChatMessage(blocked),
      false,
      JSON.stringify(blocked)
    );
    assert.equal(
      canReactToChatMessage(blocked),
      false,
      JSON.stringify(blocked)
    );
    assert.equal(isInteractiveCardMessage(blocked), false);
  }
  // A member's own message keeps every action.
  assert.equal(canReplyToChatMessage({ rootType: 'chat' }), true);
  assert.equal(isInteractiveCardMessage({ rootType: 'chat' }), false);
});

test('a plain message kind is exactly a message with generic actions', () => {
  for (const message of [
    {},
    { rootType: 'chat' },
    { isNotification: '0' },
    { rewardAmount: 200 }
  ]) {
    assert.equal(getChatMessageKind(message), 'message');
    assert.equal(canUseGenericChatMessageActions(message), true);
  }
  for (const [kind, rule] of Object.entries(CHAT_MESSAGE_KIND_RULES)) {
    if (!rule.interactive) {
      assert.ok(rule.reason.length > 20, `${kind} needs its reason`);
    }
  }
});

test('a chess Discuss message is the member own message: reply, react and every action', () => {
  // Sent with the position it talks about (chessState) and no isChessMsg.
  const discuss = {
    content: 'why this move?',
    chessState: { fen: 'x', isDiscussion: true }
  };
  assert.equal(getChatMessageKind(discuss), 'message');
  assert.equal(canUseGenericChatMessageActions(discuss), true);
  assert.equal(canReplyToChatMessage(discuss), true);
  assert.equal(canReactToChatMessage(discuss), true);
  assert.equal(isInteractiveCardMessage(discuss), false);
  // The board itself stays out.
  const board = { isChessMsg: 1, chessState: { fen: 'x' } };
  assert.equal(getChatMessageKind(board), 'chessBoard');
  assert.equal(canReplyToChatMessage(board), false);
  // Every generic message takes Reply first, as the API decides.
  assert.equal(canReplyToChatMessage({ rootType: 'chat' }), true);
});
