function toMessageId(value: any) {
  return typeof value === 'number' && value > 0 ? value : null;
}

function toPendingTerminalToken(value: any) {
  return typeof value === 'string' && value ? value : null;
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
