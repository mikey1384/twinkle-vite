import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import Chess from '../../../Chess';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import { getUserChatSquareColors } from '../../../Chess/helpers/theme';
import { getLatestGameBoundaryMessageId } from '~/containers/Chat/helpers/gameMessageIds';

export default function ChessGame({
  boardState,
  isCountdownActive,
  channelId,
  gameFinished,
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
  onLoadStateChange,
  interactableOverride
}: {
  boardState: any;
  isCountdownActive?: boolean;
  channelId: number;
  gameFinished?: boolean;
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
  onLoadStateChange?: (ready: boolean) => void;
  interactableOverride?: boolean;
}) {
  const fetchCurrentChessState = useAppContext(
    (v) => v.requestHelpers.fetchCurrentChessState
  );
  const [uploaderId, setUploaderId] = useState(0);
  const scope = `${myId}:${channelId}`;
  const latestScope = useRef(scope);
  latestScope.current = scope;
  const inputs = useRef({
    onLoadStateChange,
    currentChannel,
    onSetUserMadeLastMove,
    onSetMessage,
    onSetInitialState
  });
  inputs.current = {
    onLoadStateChange,
    currentChannel,
    onSetUserMadeLastMove,
    onSetMessage,
    onSetInitialState
  };
  const [attempt, setAttempt] = useState(0);
  const [loadState, setLoadState] = useState({ scope, status: 'loading' });
  const loaded = loadState.scope === scope && loadState.status === 'loaded';
  useEffect(() => {
    let active = true;
    const isCurrent = () => active && latestScope.current === scope;
    setLoadState({ scope, status: 'loading' });
    inputs.current.onLoadStateChange?.(false);
    void (async () => {
      try {
        if (!Number.isSafeInteger(channelId) || channelId <= 0)
          throw Error('Invalid channel');
        const chessMessage = await fetchCurrentChessState({
          channelId,
          recentChessMessage: inputs.current.currentChannel.recentChessMessage
        });
        if (!isCurrent()) return;
        // No stored game is a valid fresh board. A stored message must carry a position.
        if (
          chessMessage &&
          (typeof chessMessage !== 'object' ||
            !Number.isSafeInteger(chessMessage.id) ||
            chessMessage.id <= 0 ||
            !Number.isSafeInteger(chessMessage.userId) ||
            chessMessage.userId <= 0 ||
            !chessMessage.chessState ||
            typeof chessMessage.chessState !== 'object' ||
            Array.isArray(chessMessage.chessState))
        )
          throw Error('Invalid chess state');
        inputs.current.onSetUserMadeLastMove(chessMessage?.userId === myId);
        inputs.current.onSetMessage(chessMessage);
        setUploaderId(chessMessage?.userId || 0);
        inputs.current.onSetInitialState(chessMessage?.chessState);
        setLoadState({ scope, status: 'loaded' });
        inputs.current.onLoadStateChange?.(true);
      } catch {
        if (isCurrent()) setLoadState({ scope, status: 'error' });
      }
    })();
    return () => {
      active = false;
    };
  }, [scope, channelId, myId, attempt, fetchCurrentChessState]);

  const spoilerOff = useMemo(() => {
    if (isCountdownActive) {
      return true;
    }

    const userIsTheLastMoveViewer =
      currentChannel.lastChessMoveViewerId === myId;
    const isLoadingOrNoInitialState = loaded && !initialState?.move?.number;
    const latestBoundaryMessageId = getLatestGameBoundaryMessageId(
      currentChannel,
      'chess'
    );
    const isOlderMessage =
      message?.id &&
      latestBoundaryMessageId &&
      message?.id < latestBoundaryMessageId;

    return (
      isLoadingOrNoInitialState ||
      userMadeLastMove ||
      userIsTheLastMoveViewer ||
      isOlderMessage
    );
  }, [
    isCountdownActive,
    loaded,
    initialState?.move?.number,
    currentChannel,
    message?.id,
    myId,
    userMadeLastMove
  ]);

  if (!loaded) {
    if (loadState.scope === scope && loadState.status === 'error')
      return (
        <div
          style={{
            padding: '16px',
            fontSize: '16px',
            lineHeight: 1.5,
            textAlign: 'center'
          }}
        >
          <p role="alert">
            Could not load the chess board. Check the game before trying again.
          </p>
          <Button
            style={{ minHeight: '44px', fontSize: '14px', marginTop: '12px' }}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </Button>
        </div>
      );
    return <Loading />;
  }

  return (
    <Chess
      isFromModal
      channelId={channelId}
      isCountdownActive={isCountdownActive}
      forceSpoilerOff={!!gameFinished}
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
