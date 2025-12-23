import React, { useEffect, useMemo, useState } from 'react';
import Chess from '../../../Chess';
import { useAppContext, useChatContext } from '~/contexts';
import { getUserChatSquareColors } from '../../../Chess/helpers/theme';

export default function Rewind({
  channelId,
  isCountdownActive,
  myId,
  onAcceptRewind,
  onCancelRewindRequest,
  onDeclineRewind,
  rewindRequestId
}: {
  channelId: number;
  isCountdownActive?: boolean;
  myId: number;
  onAcceptRewind: (v: any) => void;
  onCancelRewindRequest: () => void;
  onDeclineRewind: () => void;
  rewindRequestId: number;
}) {
  const fetchCurrentRewindRequest = useAppContext(
    (v) => v.requestHelpers.fetchCurrentRewindRequest
  );
  const chessThemeVersion = useChatContext((v) => v.state.chessThemeVersion);
  const [rewindRequestMessage, setRewindRequestMessage] = useState<any>({});
  const [loaded, setLoaded] = useState(false);

  const squareColors = useMemo(() => {
    void chessThemeVersion;
    return getUserChatSquareColors(myId);
  }, [myId, chessThemeVersion]);

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
      key={chessThemeVersion}
      isCountdownActive={isCountdownActive}
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
      senderName={rewindRequestMessage?.username}
      style={{ width: '100%' }}
      squareColors={squareColors}
    />
  );
}
