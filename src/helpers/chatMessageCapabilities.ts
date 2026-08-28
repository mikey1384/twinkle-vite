const SERVER_ISSUED_CHAT_CARD_ROOT_TYPES: ReadonlySet<string> = new Set([
  'approval',
  'modification',
  'buildContributionInvite',
  'buildCollaborationRequest',
  'buildContributionSubmission',
  'buildThumbnailSuggestion',
  'buildProjectLimitRequest',
  'aiCardOffer',
  'cliAdminChatMessage'
]);

const SENDER_DELETABLE_BUILD_SUGGESTION_ROOT_TYPES: ReadonlySet<string> =
  new Set(['buildContributionSubmission', 'buildThumbnailSuggestion']);

export function canUseGenericChatMessageActions({
  inviteFrom,
  invitePath,
  isCallMsg,
  isChessMsg,
  isDrawOffer,
  isNotification,
  rootType,
  transactionId,
  transferId
}: {
  inviteFrom?: unknown;
  invitePath?: unknown;
  isCallMsg?: unknown;
  isChessMsg?: unknown;
  isDrawOffer?: unknown;
  isNotification?: unknown;
  rootType?: unknown;
  transactionId?: unknown;
  transferId?: unknown;
}) {
  const isNotificationMessage =
    isNotification === true || Number(isNotification || 0) === 1;
  const isStructuredNotice =
    [isCallMsg, isChessMsg, isDrawOffer].some(
      (value) => value === true || Number(value || 0) === 1
    ) ||
    [inviteFrom, transactionId, transferId].some(
      (value) => Number(value || 0) > 0
    ) ||
    (typeof invitePath === 'string'
      ? invitePath.trim().length > 0
      : Number(invitePath || 0) > 0);
  return (
    !isNotificationMessage &&
    !isStructuredNotice &&
    !SERVER_ISSUED_CHAT_CARD_ROOT_TYPES.has(String(rootType || '').trim())
  );
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
