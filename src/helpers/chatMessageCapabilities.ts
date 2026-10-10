const SERVER_ISSUED_CHAT_CARD_ROOT_TYPES: ReadonlySet<string> = new Set([
  'approval',
  'modification',
  'buildContributionInvite',
  'buildCollaborationRequest',
  'buildContributionSubmission',
  'buildThumbnailSuggestion',
  'buildTitleSuggestion',
  'buildProjectLimitRequest',
  'buildRewardReview',
  // Project room, file storage and card crafting requests to Mikey.
  'buildReviewRequest',
  'aiCardOffer',
  'cliAdminChatMessage',
  // Zero's DM to the owner about a member's chat report.
  'chatMessageReport',
  // A meetup quest crew's plan/video sent to admins for review.
  'meetupQuest',
  // A crew founder's invitation (the invitee's notification).
  'meetupQuestInvite',
  // The coordinator's "slot is set up" note to each crew member.
  'meetupQuestSlot',
  // A crew's Bridge Builder story sent to the admins for approval.
  'meetupStory',
  // A crew member's request to a Twinkle teacher to be the crew's grown-up.
  'meetupTeacherRequest'
]);

const SENDER_DELETABLE_BUILD_SUGGESTION_ROOT_TYPES: ReadonlySet<string> =
  new Set([
    'buildContributionSubmission',
    'buildThumbnailSuggestion',
    'buildTitleSuggestion'
  ]);

interface ChatMessageCapabilityInput {
  inviteFrom?: unknown;
  invitePath?: unknown;
  isCallMsg?: unknown;
  isChessMsg?: unknown;
  isDrawOffer?: unknown;
  isNotification?: unknown;
  rootType?: unknown;
  transactionId?: unknown;
  transferId?: unknown;
}

export interface ChatMessageKindInput extends ChatMessageCapabilityInput {
  chessState?: unknown;
  omokState?: unknown;
  gameWinnerId?: unknown;
  isDraw?: unknown;
  isAbort?: unknown;
  wordleResult?: unknown;
}

function isFlagSet(value: unknown) {
  return value === true || Number(value || 0) === 1;
}

function isPositiveId(value: unknown) {
  return Number(value || 0) > 0;
}

function hasInvite({ inviteFrom, invitePath }: ChatMessageCapabilityInput) {
  return (
    isPositiveId(inviteFrom) ||
    (typeof invitePath === 'string'
      ? invitePath.trim().length > 0
      : isPositiveId(invitePath))
  );
}

export function canUseGenericChatMessageActions(
  message: ChatMessageCapabilityInput
) {
  const { isCallMsg, isChessMsg, isDrawOffer, isNotification, rootType } =
    message;
  const isStructuredNotice =
    [isCallMsg, isChessMsg, isDrawOffer].some(isFlagSet) ||
    [message.transactionId, message.transferId].some(isPositiveId) ||
    hasInvite(message);
  return (
    !isFlagSet(isNotification) &&
    !isStructuredNotice &&
    !SERVER_ISSUED_CHAT_CARD_ROOT_TYPES.has(String(rootType || '').trim())
  );
}

// Build cards render their live card when quoted, so the quote can bump it.
// The notification flag does not take a card out of this set: the reward
// review card is stored as a notification, and only the server issues these
// rootTypes.
const REPLYABLE_BUILD_CARD_ROOT_TYPES: ReadonlySet<string> = new Set([
  'buildContributionInvite',
  'buildCollaborationRequest',
  'buildContributionSubmission',
  'buildThumbnailSuggestion',
  'buildTitleSuggestion',
  'buildProjectLimitRequest',
  'buildRewardReview',
  'buildReviewRequest'
]);

export function isReplyableBuildCardRootType(rootType: unknown) {
  return REPLYABLE_BUILD_CARD_ROOT_TYPES.has(String(rootType || '').trim());
}

const MEETUP_QUEST_CARD_ROOT_TYPES: ReadonlySet<string> = new Set([
  'meetupQuest',
  'meetupQuestInvite',
  'meetupQuestSlot',
  'meetupStory'
]);

// Every kind of chat message the website renders. The kind decides whether
// people can reply to and react to the message (one rule for both), and
// replyTargetSummary.ts holds how each replyable kind looks when quoted.
// twinkle-api helpers/chat.ts keeps the same table for the server checks.
export const CHAT_MESSAGE_KINDS = [
  'message',
  'wordleResult',
  'buildCard',
  'tradeOffer',
  'tradeNotice',
  'cardTransfer',
  'aiCardOffer',
  'gameResult',
  'drawOffer',
  'chessBoard',
  'omokBoard',
  'groupInvitation',
  'approvalRequest',
  'moderationNotice',
  'adminMessage',
  'ownerAlert',
  'meetupTeacherRequest',
  'meetupQuestCard',
  'crewChatCard',
  'callLog',
  'systemNotice'
] as const;
export type ChatMessageKind = (typeof CHAT_MESSAGE_KINDS)[number];

export function getChatMessageKind(
  message: ChatMessageKindInput
): ChatMessageKind {
  const rootType = String(message.rootType || '').trim();
  const isNotification = isFlagSet(message.isNotification);
  if (isReplyableBuildCardRootType(rootType)) return 'buildCard';
  if (isPositiveId(message.transactionId)) {
    // The proposal/gift is the card; "accepted the trade proposal" and the
    // like are notification lines that point back at it.
    return isNotification ? 'tradeNotice' : 'tradeOffer';
  }
  if (isPositiveId(message.transferId)) return 'cardTransfer';
  if (rootType === 'aiCardOffer') return 'aiCardOffer';
  if (rootType === 'approval') return 'approvalRequest';
  if (rootType === 'modification') return 'moderationNotice';
  if (rootType === 'cliAdminChatMessage') return 'adminMessage';
  if (rootType === 'chatMessageReport' || rootType === 'meetupBranch') {
    return 'ownerAlert';
  }
  if (rootType === 'meetupTeacherRequest') return 'meetupTeacherRequest';
  if (MEETUP_QUEST_CARD_ROOT_TYPES.has(rootType)) return 'meetupQuestCard';
  if (rootType === 'meetupQuestCrew') return 'crewChatCard';
  if (hasInvite(message)) return 'groupInvitation';
  if (isFlagSet(message.isDrawOffer)) return 'drawOffer';
  const hasOmokState = !!message.omokState;
  const hasChessState = !!message.chessState;
  const isGameEnd =
    isPositiveId(message.gameWinnerId) ||
    isFlagSet(message.isDraw) ||
    isFlagSet(message.isAbort);
  // Game rows are flagged isChessMsg. A member's chess "Discuss" message also
  // carries a chessState (the position it talks about) but no isChessMsg: it
  // is the member's own words and stays an ordinary message.
  if (isFlagSet(message.isChessMsg)) {
    if (hasOmokState) return 'omokBoard';
    if (hasChessState) return 'chessBoard';
    return isGameEnd ? 'gameResult' : 'chessBoard';
  }
  if (isGameEnd && !hasOmokState && !hasChessState) return 'gameResult';
  if (isFlagSet(message.isCallMsg)) return 'callLog';
  if (isNotification) return 'systemNotice';
  if (message.wordleResult) return 'wordleResult';
  return 'message';
}

export type ChatMessageKindRule =
  | {
      // Reply and react. 'all' = a member's own words, which also take edit,
      // delete, reward, pin and report; 'replyAndReact' = a card that only
      // takes those two.
      interactive: true;
      actions: 'all' | 'replyAndReact';
    }
  | { interactive: false; reason: string };

const CARD: ChatMessageKindRule = {
  interactive: true,
  actions: 'replyAndReact'
};

export const CHAT_MESSAGE_KIND_RULES: Record<
  ChatMessageKind,
  ChatMessageKindRule
> = {
  message: { interactive: true, actions: 'all' },
  wordleResult: CARD,
  buildCard: CARD,
  tradeOffer: CARD,
  tradeNotice: {
    interactive: false,
    reason:
      'A one-line "accepted/declined the trade" notice; the trade card it points to is replyable and shows the live status.'
  },
  cardTransfer: CARD,
  aiCardOffer: CARD,
  gameResult: CARD,
  drawOffer: CARD,
  chessBoard: {
    interactive: false,
    reason:
      'Chess boards already have their own Discuss button, which quotes the position; a board can also hide an unseen move behind its spoiler.'
  },
  omokBoard: {
    interactive: false,
    reason:
      'An omok move can be hidden behind the spoiler until the opponent opens it; a quote would show the move early.'
  },
  groupInvitation: CARD,
  approvalRequest: CARD,
  moderationNotice: CARD,
  adminMessage: CARD,
  ownerAlert: {
    interactive: false,
    reason:
      "Zero's private alerts to the owner (chat reports, new branch names); a reply there goes into Zero's AI chat, and the card's own buttons are the action."
  },
  meetupTeacherRequest: CARD,
  meetupQuestCard: CARD,
  crewChatCard: CARD,
  callLog: {
    interactive: false,
    reason: 'A call log line (started/ended a call): system record.'
  },
  systemNotice: {
    interactive: false,
    reason:
      'System lines such as joined/left, created the group, changed the owner, declined a rewind.'
  }
};

export function getChatMessageKindRule(message: ChatMessageKindInput) {
  return CHAT_MESSAGE_KIND_RULES[getChatMessageKind(message)];
}

// Reply and reactions follow one rule, so they cannot drift apart.
export function canReplyToChatMessage(message: ChatMessageKindInput) {
  // A member's own message always takes Reply, exactly as the API decides
  // (helpers/chat.ts chatMessageSupportsInteraction).
  if (canUseGenericChatMessageActions(message)) return true;
  return getChatMessageKindRule(message).interactive;
}

export function canReactToChatMessage(message: ChatMessageKindInput) {
  return canReplyToChatMessage(message);
}

// A card that takes Reply and reactions only (plus the sender's Delete on a
// Build suggestion): edit, reward, pin, bookmark and report stay off.
export function isInteractiveCardMessage(message: ChatMessageKindInput) {
  if (getChatMessageKind(message) === 'message') return false;
  const rule = getChatMessageKindRule(message);
  return rule.interactive && rule.actions === 'replyAndReact';
}

export function isSenderDeleteOnlyBuildSuggestionMessage({
  message,
  actorUserId
}: {
  message?: { rootType?: unknown; userId?: unknown } | null;
  actorUserId?: unknown;
}) {
  const normalizedActorUserId = Number(actorUserId || 0);
  const normalizedSenderUserId = Number(message?.userId || 0);
  return (
    normalizedActorUserId > 0 &&
    normalizedSenderUserId === normalizedActorUserId &&
    SENDER_DELETABLE_BUILD_SUGGESTION_ROOT_TYPES.has(
      String(message?.rootType || '').trim()
    )
  );
}
