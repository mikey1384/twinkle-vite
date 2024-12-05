import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { useChatContext } from '~/contexts';

export default function useChessSocket({
  selectedChannelId
}: {
  selectedChannelId: number;
}) {
  const onSetChessGameState = useChatContext(
    (v) => v.actions.onSetChessGameState
  );
  const onSetChessModalShown = useChatContext(
    (v) => v.actions.onSetChessModalShown
  );
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);
  const onUpdateRecentChessMessage = useChatContext(
    (v) => v.actions.onUpdateRecentChessMessage
  );

  useEffect(() => {
    socket.on('chess_move_made', handleChessMoveMade);
    socket.on('chess_rewind_requested', handleChessRewindRequest);

    socket.on('canceled_chess_rewind', handleChessRewindCanceled);
    socket.on('declined_chess_rewind', handleChessRewindDeclined);
    socket.on('rewound_chess_game', handleChessRewind);

    return function cleanUp() {
      socket.off('chess_move_made', handleChessMoveMade);
      socket.off('chess_rewind_requested', handleChessRewindRequest);

      socket.off('canceled_chess_rewind', handleChessRewindCanceled);
      socket.off('declined_chess_rewind', handleChessRewindDeclined);
      socket.off('rewound_chess_game', handleChessRewind);
    };

    function handleChessMoveMade({ channelId }: { channelId: number }) {
      if (channelId === selectedChannelId) {
        onSetChessModalShown(false);
      }
    }

    function handleChessRewindCanceled({
      channelId,
      messageId,
      cancelMessage,
      sender,
      timeStamp
    }: {
      channelId: number;
      messageId: number;
      cancelMessage: string;
      sender: any;
      timeStamp: number;
    }) {
      onSubmitMessage({
        message: {
          channelId,
          id: messageId,
          content: cancelMessage,
          userId: sender.userId,
          username: sender.username,
          profilePicUrl: sender.profilePicUrl,
          isNotification: true,
          timeStamp
        },
        messageId
      });
      onSetChessGameState({ channelId, newState: { rewindRequestId: null } });
    }

    function handleChessRewindDeclined({
      channelId,
      declineMessage,
      messageId,
      sender,
      timeStamp
    }: {
      channelId: number;
      declineMessage: string;
      messageId: number;
      sender: any;
      timeStamp: number;
    }) {
      onSubmitMessage({
        message: {
          channelId,
          id: messageId,
          content: declineMessage,
          userId: sender.userId,
          username: sender.username,
          profilePicUrl: sender.profilePicUrl,
          isNotification: true,
          timeStamp
        },
        messageId
      });
      onSetChessGameState({
        channelId,
        newState: { rewindRequestId: null }
      });
    }

    function handleChessRewindRequest({
      channelId,
      messageId
    }: {
      channelId: number;
      messageId: number;
    }) {
      onSetChessGameState({
        channelId,
        newState: { rewindRequestId: messageId }
      });
    }

    function handleChessRewind({
      channelId,
      message
    }: {
      channelId: number;
      message: any;
    }) {
      onUpdateRecentChessMessage({ channelId, message });
      onSetChessGameState({
        channelId,
        newState: { rewindRequestId: null }
      });
      onSubmitMessage({
        message,
        messageId: message.id
      });
    }
  });
}
