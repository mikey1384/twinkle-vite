import React, { useContext } from 'react';
import { useKeyContext } from '~/contexts';
import TargetChessPosition from './TargetChessPosition';
import { ReplyTargetEnvironmentContext } from './ReplyTargetEnvironment';

// A discussion message includes a position as well as its text. Reuse that
// position and its existing retry controls when the discussion is quoted.
export default function ReplyChessPosition({ message }: { message: any }) {
  const environment = useContext(ReplyTargetEnvironmentContext);
  const myId = useKeyContext((v) => v.myState.userId);
  const chessState = message?.chessState;
  if (!environment || !chessState?.isDiscussion || Number(message?.isChessMsg || 0) === 1) return null;
  return (
    <div data-quote-own-click>
      <TargetChessPosition
        chessState={chessState}
        channelId={Number(message.channelId || environment.channelId)}
        gameState={environment.chessGameState}
        latestChessBoardMessageId={environment.latestChessBoardMessageId}
        messageId={Number(message.id)}
        myId={myId}
        userId={Number(message.userId)}
        username={message.username}
        onCancelRewindRequest={environment.onCancelRewindRequest}
        onAcceptRewind={environment.onAcceptRewind}
        onDeclineRewind={environment.onDeclineRewind}
        onRequestRewind={environment.onRequestRewind}
      />
    </div>
  );
}
