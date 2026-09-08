import React, { useMemo } from 'react';
import Chess from '../../../Chess';
import { borderRadius, Color } from '~/constants/css';
import ProposeButton from './ProposeButton';
import { useChatContext } from '~/contexts';
import { getUserChatSquareColors } from '../../../Chess/helpers/theme';

export default function TargetChessPosition({
  chessState,
  channelId,
  gameState,
  latestChessBoardMessageId,
  messageId,
  myId,
  userId,
  username,
  onCancelRewindRequest,
  onAcceptRewind,
  onDeclineRewind,
  onRequestRewind
}: {
  chessState: any;
  channelId: number;
  gameState: any;
  latestChessBoardMessageId: number;
  messageId: number;
  myId: number;
  userId: number;
  username: string;
  onCancelRewindRequest: () => void;
  onAcceptRewind: (v: any) => void;
  onDeclineRewind: () => void;
  onRequestRewind: (v: any) => void;
}) {
  const chessThemeVersion = useChatContext((v) => v.state.chessThemeVersion);
  const squareColors = useMemo(() => {
    void chessThemeVersion;
    return getUserChatSquareColors(myId);
  }, [myId, chessThemeVersion]);

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        marginTop: '0.5rem',
        marginBottom: '1rem',
        padding: '1rem',
        border: `1px solid ${Color.lightGray()}`,
        background: Color.wellGray(),
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        boxSizing: 'border-box',
        justifyContent: 'space-between',
        borderRadius
      }}
    >
      <Chess
        key={chessThemeVersion}
        loaded
        myId={myId}
        messageId={messageId}
        channelId={channelId}
        initialState={chessState}
        displaySize="inline"
        onCancelRewindRequest={onCancelRewindRequest}
        onAcceptRewind={onAcceptRewind}
        onDeclineRewind={onDeclineRewind}
        rewindRequestId={gameState.rewindRequestId}
        senderId={userId}
        senderName={username}
        style={{ width: '100%' }}
        squareColors={squareColors}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          minWidth: 0
        }}
      >
        {!chessState.isRewindRequest &&
          Number(chessState.messageId) !== Number(latestChessBoardMessageId) &&
          chessState.previousState && (
            <ProposeButton
              style={{ marginTop: '1rem', marginBottom: '1rem' }}
              onClick={() =>
                onRequestRewind({
                  ...chessState.previousState,
                  isRewindRequest: true,
                  isDiscussion: true
                })
              }
              label="Propose retrying this move"
            />
          )}
      </div>
    </div>
  );
}
