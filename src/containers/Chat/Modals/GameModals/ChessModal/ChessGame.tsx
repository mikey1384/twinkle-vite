import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import Chess from '../../../Chess';
import { getUserChatSquareColors } from '../../../Chess/helpers/theme';

export default function ChessGame({
  boardState,
  isCountdownActive,
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
  userMadeLastMove,
  squareColors,
  interactableOverride
}: {
  boardState: any;
  isCountdownActive?: boolean;
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
  squareColors?: { light?: string; dark?: string };
  interactableOverride?: boolean;
}) {
  const fetchCurrentChessState = useAppContext(
    (v) => v.requestHelpers.fetchCurrentChessState
  );
  const [uploaderId, setUploaderId] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const loading: React.RefObject<any> = useRef(null);
  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 1000;
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
    if (isCountdownActive) {
      return true;
    }

    const userIsTheLastMoveViewer =
      currentChannel.lastChessMoveViewerId === myId;
    const isLoadingOrNoInitialState =
      !loading.current && !initialState?.move?.number;
    const isOlderMessage =
      message?.id &&
      currentChannel.lastChessMessageId &&
      message?.id < currentChannel?.lastChessMessageId;

    return (
      isLoadingOrNoInitialState ||
      userMadeLastMove ||
      userIsTheLastMoveViewer ||
      isOlderMessage
    );
  }, [
    isCountdownActive,
    initialState?.move?.number,
    currentChannel?.lastChessMessageId,
    currentChannel?.lastChessMoveViewerId,
    message?.id,
    myId,
    userMadeLastMove
  ]);

  return (
    <Chess
      isFromModal
      channelId={channelId}
      isCountdownActive={isCountdownActive}
      interactable={
        typeof interactableOverride === 'boolean'
          ? interactableOverride
          : !boardState?.isDraw
      }
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
      squareColors={squareColors || getUserChatSquareColors(myId)}
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
