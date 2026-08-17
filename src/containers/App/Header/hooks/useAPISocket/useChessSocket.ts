import { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useChatContext } from '~/contexts';
import {
  chatRealtimeChannelNeedsCanonicalSummary
} from '~/helpers/chatUnreadProjection';
import useChatLastReadReconciler from '~/helpers/hooks/useChatLastReadReconciler';

export default function useChessSocket({
  selectedChannelId
}: {
  selectedChannelId: number;
}) {
  const selectedChannelIdRef = useRef(selectedChannelId);
  selectedChannelIdRef.current = selectedChannelId;

  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const homeChannelIds = useChatContext((v) => v.state.homeChannelIds);
  const favoriteChannelIds = useChatContext(
    (v) => v.state.favoriteChannelIds
  );
  const classChannelIds = useChatContext((v) => v.state.classChannelIds);
  const channelsObjRef = useRef(channelsObj);
  const listedChannelIdsRef = useRef(new Set<number>());
  channelsObjRef.current = channelsObj;
  listedChannelIdsRef.current = new Set(
    [
      ...(homeChannelIds || []),
      ...(favoriteChannelIds || []),
      ...(classChannelIds || [])
    ].map(Number)
  );
  const { reconcileChannelUnreadActivity } = useChatLastReadReconciler();

  const onSetChessGameState = useChatContext(
    (v) => v.actions.onSetChessGameState
  );
  const onSetChessModalShown = useChatContext(
    (v) => v.actions.onSetChessModalShown
  );
  const onSetOmokModalShown = useChatContext(
    (v) => v.actions.onSetOmokModalShown
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

    function handleChessMoveMade({
      channelId,
      gameType
    }: {
      channelId: number;
      gameType?: 'chess' | 'omok';
    }) {
      if (channelId !== selectedChannelIdRef.current) return;
      if (gameType === 'omok') {
        onSetOmokModalShown(false);
      } else {
        // default to chess to preserve backward compatibility
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
      if (!canApplyPersistedChessActivityImmediately(channelId)) return;
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
      if (!canApplyPersistedChessActivityImmediately(channelId)) return;
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
      if (!canApplyPersistedChessActivityImmediately(channelId)) return;
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
      if (!canApplyPersistedChessActivityImmediately(channelId)) return;
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

    function canApplyPersistedChessActivityImmediately(channelId: number) {
      const normalizedChannelId = Number(channelId);
      const channel = channelsObjRef.current?.[normalizedChannelId];
      const channelSummaryIsNeeded =
        chatRealtimeChannelNeedsCanonicalSummary({
          channel,
          isListed: listedChannelIdsRef.current.has(normalizedChannelId)
        });
      if (channelSummaryIsNeeded) {
        void reconcileChannelUnreadActivity({
          channelId: normalizedChannelId,
          includeChannelSummary: true
        });
      }
      // A loaded channel the user is actively viewing already has canonical
      // identity. Keep its live game state moving while the writer summary
      // repairs a temporarily missing sidebar projection.
      return (
        !channelSummaryIsNeeded ||
        Boolean(
          channel?.id &&
            normalizedChannelId === Number(selectedChannelIdRef.current || 0)
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
