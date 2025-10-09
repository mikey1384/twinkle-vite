import { useMemo } from 'react';

export default function useBoardSpoilerOff({
  countdownNumber,
  moveByUserId,
  myId,
  lastMoveViewerId,
  lastMessageId,
  messageId,
  moveViewTimeStamp
}: {
  countdownNumber?: number | null;
  moveByUserId?: number;
  myId: number;
  lastMoveViewerId?: number;
  lastMessageId?: number | null;
  messageId?: number | null;
  moveViewTimeStamp?: number | null;
}) {
  return useMemo(() => {
    if (typeof countdownNumber === 'number') {
      return true;
    }
    const userMadeThisMove = moveByUserId === myId;
    const userIsTheLastMoveViewer = lastMoveViewerId === myId;
    if (
      userMadeThisMove ||
      userIsTheLastMoveViewer ||
      !!moveViewTimeStamp ||
      (typeof messageId === 'number' &&
        typeof lastMessageId === 'number' &&
        messageId < lastMessageId)
    ) {
      return true;
    }
    return false;
  }, [
    countdownNumber,
    moveByUserId,
    myId,
    lastMoveViewerId,
    lastMessageId,
    messageId,
    moveViewTimeStamp
  ]);
}
