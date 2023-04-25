import React, { useEffect, useState } from 'react';
import Chess from '../../Chess';
import { useAppContext } from '~/contexts';

export default function Rewind({
  channelId,
  countdownNumber,
  myId,
  onAcceptRewind,
  onCancelRewindRequest,
  onDeclineRewind,
  rewindRequestId
}: {
  channelId: number;
  countdownNumber: number;
  myId: number;
  onAcceptRewind: () => void;
  onCancelRewindRequest: () => void;
  onDeclineRewind: () => void;
  rewindRequestId: number;
}) {
  const fetchCurrentRewindRequest = useAppContext(
    (v) => v.requestHelpers.fetchCurrentRewindRequest
  );
  const [rewindRequestMessage, setRewindRequestMessage] = useState<any>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    init();
    async function init() {
      const message = await fetchCurrentRewindRequest({
        channelId,
        rewindRequestId
      });
      setRewindRequestMessage(message);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Chess
      countdownNumber={countdownNumber}
      loaded={rewindRequestMessage.chessState && loaded}
      myId={myId}
      channelId={channelId}
      initialState={rewindRequestMessage.chessState}
      messageId={rewindRequestMessage.id}
      onAcceptRewind={onAcceptRewind}
      onCancelRewindRequest={onCancelRewindRequest}
      onDeclineRewind={onDeclineRewind}
      rewindRequestId={rewindRequestId}
      senderId={rewindRequestMessage.userId}
      senderName={rewindRequestMessage.username}
      style={{ width: '100%' }}
    />
  );
}
