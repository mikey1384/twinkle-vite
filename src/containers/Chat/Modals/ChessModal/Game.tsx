import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import Chess from '../../Chess';

export default function Game({
  boardState,
  countdownNumber,
  channelId,
  currentChannel,
  initialState,
  message,
  myId,
  newChessState,
  onSetInitialState,
  onSetMessage,
  onSetNewChessState,
  onSetUserMadeLastMove,
  onSpoilerClick,
  onUpdateLastChessMoveViewerId,
  opponentId,
  opponentName,
  setChessMoveViewTimeStamp,
  userMadeLastMove
}: {
  boardState: any;
  countdownNumber: number;
  channelId: number;
  currentChannel: any;
  initialState: any;
  message: any;
  myId: number;
  newChessState: any;
  onSetInitialState: (arg0: any) => void;
  onSetMessage: (arg0: any) => void;
  onSetNewChessState: (arg0: any) => void;
  onSetUserMadeLastMove: (arg0: boolean) => void;
  onSpoilerClick: (v: any) => void;
  onUpdateLastChessMoveViewerId: (v: any) => void;
  opponentId: number;
  opponentName: string;
  setChessMoveViewTimeStamp: (v: any) => void;
  userMadeLastMove: boolean;
}) {
  const fetchCurrentChessState = useAppContext(
    (v) => v.requestHelpers.fetchCurrentChessState
  );
  const [uploaderId, setUploaderId] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const loading: React.MutableRefObject<any> = useRef(null);
  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 1000; // Delay in milliseconds
    let success = false;

    init();
    async function init(attempts = 0) {
      try {
        loading.current = true;
        const chessMessage = await fetchCurrentChessState({
          channelId,
          recentChessMessage: currentChannel.recentChessMessage
        });
        onSetUserMadeLastMove(chessMessage?.userId === myId);
        onSetMessage(chessMessage);
        setUploaderId(chessMessage?.userId);
        onSetInitialState(chessMessage?.chessState);
        success = true;
      } catch (error) {
        console.error('Error fetching chess state:', error);
        if (attempts < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return init(attempts + 1);
        }
      } finally {
        if (success || attempts === maxRetries) {
          loading.current = false;
          setLoaded(true);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spoilerOff = useMemo(() => {
    if (typeof countdownNumber === 'number') {
      return true;
    }

    const userIsTheLastMoveViewer =
      currentChannel.lastChessMoveViewerId === myId;
    const isLoadingOrNoInitialState = !loading.current && !initialState;
    const isOlderMessage =
      message.id &&
      currentChannel.lastChessMessageId &&
      message.id < currentChannel.lastChessMessageId;

    return (
      isLoadingOrNoInitialState ||
      userMadeLastMove ||
      userIsTheLastMoveViewer ||
      isOlderMessage
    );
  }, [
    countdownNumber,
    currentChannel.lastChessMessageId,
    currentChannel.lastChessMoveViewerId,
    initialState,
    message.id,
    myId,
    userMadeLastMove
  ]);

  return (
    <Chess
      isFromModal
      channelId={channelId}
      countdownNumber={countdownNumber}
      interactable={!boardState?.isDraw}
      initialState={initialState}
      loaded={loaded}
      myId={myId}
      newChessState={newChessState}
      onChessMove={onSetNewChessState}
      opponentId={opponentId}
      opponentName={opponentName}
      senderId={uploaderId}
      spoilerOff={spoilerOff}
      onSpoilerClick={handleSpoilerClick}
    />
  );

  async function handleSpoilerClick() {
    try {
      await setChessMoveViewTimeStamp({ channelId, message });
      onUpdateLastChessMoveViewerId({
        channelId,
        viewerId: myId
      });
      onSpoilerClick(message.userId);
    } catch (error) {
      console.error(error);
    }
  }
}
