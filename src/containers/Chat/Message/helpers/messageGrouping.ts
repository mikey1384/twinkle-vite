const GROUP_WINDOW_SECONDS = 5 * 60;
const GROUP_BOUNDARIES = [
  'rootType',
  'isNotification',
  'isCallMsg',
  'isSubject',
  'isReloadedSubject',
  'targetMessage',
  'targetSubject',
  'fileName',
  'filePath',
  'fileToUpload',
  'invitePath',
  'inviteFrom',
  'isChessMsg',
  'chessState',
  'omokState',
  'isDrawOffer',
  'isDraw',
  'isAbort',
  'isResign',
  'gameWinnerId',
  'rewardAmount',
  'wordleResult',
  'transferId',
  'transferDetails',
  'transactionId',
  'transactionDetails'
] as const;

type MessageSummary = Record<string, unknown>;

function isPlainMessage(message?: MessageSummary) {
  return (
    !!message &&
    Number(message.id) > 0 &&
    Number(message.userId) > 0 &&
    message.isLoaded !== false &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    !GROUP_BOUNDARIES.some((key) => !!message[key])
  );
}

// Messages are stored newest first; callers pass the older visual neighbour first.
// This is presentation only: every message retains its own ID, actions and receipts.
export function canGroupChatMessages(
  previous?: MessageSummary,
  current?: MessageSummary
) {
  if (!previous || !current || !isPlainMessage(previous) || !isPlainMessage(current)) {
    return false;
  }
  if (Number(previous.userId) !== Number(current.userId)) return false;
  for (const key of ['channelId', 'subchannelId', 'subjectId']) {
    if (Number(previous[key] || 0) !== Number(current[key] || 0)) return false;
  }

  const previousTime = Number(previous.timeStamp);
  const currentTime = Number(current.timeStamp);
  const elapsed = currentTime - previousTime;
  if (
    !Number.isFinite(previousTime) ||
    !Number.isFinite(currentTime) ||
    previousTime <= 0 ||
    elapsed < 0 ||
    elapsed > GROUP_WINDOW_SECONDS
  ) {
    return false;
  }

  const previousDate = new Date(previousTime * 1000);
  const currentDate = new Date(currentTime * 1000);
  return (
    Number.isFinite(previousDate.getTime()) &&
    Number.isFinite(currentDate.getTime()) &&
    previousDate.toDateString() === currentDate.toDateString()
  );
}
