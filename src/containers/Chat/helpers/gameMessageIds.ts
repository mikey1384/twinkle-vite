function toMessageId(value: any) {
  return typeof value === 'number' && value > 0 ? value : null;
}

function toPendingTerminalToken(value: any) {
  return typeof value === 'string' && value ? value : null;
}

// Discuss and retry requests carry a saved chess position, but they are not
// moves and must not replace the live game's latest board.
export function isChessDiscussionPosition(chessState: any) {
  return Boolean(chessState?.isDiscussion || chessState?.isRewindRequest);
}

export function getActiveGameMessageId(
  channelState: any,
  gameType: 'chess' | 'omok'
) {
  if (!channelState) return null;
  return gameType === 'chess'
    ? toMessageId(channelState.lastChessMessageId)
    : toMessageId(channelState.lastOmokMessageId);
}

export function getLatestBoardMessageId(
  channelState: any,
  gameType: 'chess' | 'omok'
) {
  if (!channelState) return null;
  return gameType === 'chess'
    ? toMessageId(channelState.latestChessBoardMessageId)
    : toMessageId(channelState.latestOmokBoardMessageId);
}

export function getLatestGameMessage(channelState: any, game: 'chess' | 'omok') {
  if (!channelState) return null;
  const messagesObj = channelState.messagesObj || {};
  const lastId = getLatestBoardMessageId(channelState, game);
  const getMessageById = (id: any) =>
    messagesObj[id] ||
    (typeof id === 'number' || typeof id === 'string'
      ? messagesObj[String(id)] || messagesObj[Number(id)]
      : null);
  const hasGameBoard = (message: any) =>
    game === 'chess'
      ? !!message?.chessState && !isChessDiscussionPosition(message.chessState)
      : !!message?.omokState;

  if (lastId !== null && lastId !== undefined) {
    const direct = getMessageById(lastId);
    if (direct && (game === 'omok' || hasGameBoard(direct))) return direct;
  }

  const messageIds: any[] = channelState.messageIds || [];
  for (const id of messageIds) {
    const message = getMessageById(id);
    if (hasGameBoard(message)) return message;
  }

  const recent = game === 'chess'
    ? channelState.recentChessMessage || null
    : channelState.recentOmokMessage || null;
  if (recent && (game === 'omok' || hasGameBoard(recent))) return recent;

  const messages = Object.values(messagesObj);
  for (let i = messages.length - 1; i >= 0; i--) {
    if (hasGameBoard(messages[i])) return messages[i];
  }
  return null;
}

export function getLatestTerminalMessageId(
  channelState: any,
  gameType: 'chess' | 'omok'
) {
  if (!channelState) return null;
  return gameType === 'chess'
    ? toMessageId(channelState.lastChessTerminalMessageId)
    : toMessageId(channelState.lastOmokTerminalMessageId);
}

export function getPendingTerminalToken(
  channelState: any,
  gameType: 'chess' | 'omok'
) {
  if (!channelState) return null;
  return gameType === 'chess'
    ? toPendingTerminalToken(channelState.lastChessPendingTerminalToken)
    : toPendingTerminalToken(channelState.lastOmokPendingTerminalToken);
}

export function hasPendingTerminalToken(
  channelState: any,
  gameType: 'chess' | 'omok'
) {
  return Boolean(getPendingTerminalToken(channelState, gameType));
}

export function getLatestGameBoundaryMessageId(
  channelState: any,
  gameType: 'chess' | 'omok'
) {
  const latestBoardMessageId = getLatestBoardMessageId(channelState, gameType);
  const latestTerminalMessageId = getLatestTerminalMessageId(
    channelState,
    gameType
  );
  return Math.max(latestBoardMessageId || 0, latestTerminalMessageId || 0) || null;
}
