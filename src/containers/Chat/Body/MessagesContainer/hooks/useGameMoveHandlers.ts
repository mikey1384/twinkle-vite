import { socket } from '~/constants/sockets/api';

export default function useGameMoveHandlers({
  clearBoardCountdown,
  currentChannel,
  handleAiUsagePolicyUpdate,
  navigate,
  onCreateNewDMChannel,
  onScrollToBottom,
  onSetChessModalShown,
  onSetOmokModalShown,
  onSetReplyTarget,
  onSubmitMessage,
  onUpdateChannelPathIdHash,
  onUpdateLastChessMessageId,
  onUpdateLastChessMoveViewerId,
  onUpdateLastOmokMessageId,
  onUpdateLastOmokMoveViewerId,
  onUpdateRecentChessMessage,
  onUpdateRecentOmokMessage,
  partner,
  profilePicUrl,
  reportError,
  saveChatMessage,
  selectedChannelId,
  setLatestBoardMessageId,
  startNewDMChannel,
  userId,
  username
}: {
  clearBoardCountdown: (
    channelId: number,
    gameType: 'chess' | 'omok'
  ) => void;
  currentChannel: any;
  handleAiUsagePolicyUpdate: (policy: Record<string, any>) => void;
  navigate: (to: string, options?: any) => void;
  onCreateNewDMChannel: (payload: any) => void;
  onScrollToBottom: () => void;
  onSetChessModalShown: (shown: boolean) => void;
  onSetOmokModalShown: (shown: boolean) => void;
  onSetReplyTarget: (payload: any) => void;
  onSubmitMessage: (payload: any) => void;
  onUpdateChannelPathIdHash: (payload: any) => void;
  onUpdateLastChessMessageId: (payload: any) => void;
  onUpdateLastChessMoveViewerId: (payload: any) => void;
  onUpdateLastOmokMessageId: (payload: any) => void;
  onUpdateLastOmokMoveViewerId: (payload: any) => void;
  onUpdateRecentChessMessage: (payload: any) => void;
  onUpdateRecentOmokMessage: (payload: any) => void;
  partner: any;
  profilePicUrl?: string | null;
  reportError: (payload: any) => void;
  saveChatMessage: (payload: any) => Promise<any>;
  selectedChannelId: number;
  setLatestBoardMessageId: (payload: {
    channelId: number;
    gameType: 'chess' | 'omok';
    messageId: number;
  }) => void;
  startNewDMChannel: (payload: any) => Promise<any>;
  userId: number;
  username?: string | null;
}) {
  return {
    handleConfirmChessMove,
    handleConfirmOmokMove
  };

  async function handleConfirmChessMove({
    state,
    isCheckmate,
    isStalemate,
    previousState
  }: {
    state: any;
    isCheckmate: boolean;
    isStalemate: boolean;
    previousState: any;
  }) {
    const gameWinnerId = isCheckmate ? userId : isStalemate ? 0 : null;
    const chessState = {
      ...state,
      previousState: previousState
        ? {
            ...previousState,
            previousState: null
          }
        : null
    };
    const content = 'Made a chess move';
    try {
      if (selectedChannelId) {
        onSetReplyTarget({ channelId: selectedChannelId, target: null });
        const { messageId, timeStamp } = await saveChatMessage({
          message: {
            userId,
            content,
            channelId: selectedChannelId,
            chessState,
            isChessMsg: true,
            gameWinnerId
          }
        });
        setLatestBoardMessageId({
          channelId: selectedChannelId,
          gameType: 'chess',
          messageId: Number(messageId)
        });
        clearBoardCountdown(selectedChannelId, 'chess');
        const messagePayload = {
          id: messageId,
          userId,
          chessState,
          isChessMsg: 1,
          gameWinnerId,
          profilePicUrl,
          username,
          content,
          channelId: selectedChannelId,
          timeStamp
        };
        onSubmitMessage({
          messageId,
          message: messagePayload
        });
        onUpdateLastChessMessageId({
          channelId: selectedChannelId,
          messageId: Number(messageId),
          ...(typeof gameWinnerId === 'number'
            ? { terminalMessageId: Number(messageId) }
            : {})
        });
        onUpdateLastChessMoveViewerId({
          channelId: selectedChannelId,
          viewerId: userId
        });
        onUpdateRecentChessMessage({
          channelId: selectedChannelId,
          message: messagePayload
        });
        onScrollToBottom();
        onSetChessModalShown(false);
        return;
      }

      if (selectedChannelId === 0 && !partner?.id) {
        reportError({
          componentPath: 'MessagesContainer/index',
          message:
            'handleConfirmChessMove: User is trying to send the first chess message to someone but recipient ID is missing'
        });
        return window.location.reload();
      }
      const { alreadyExists, channel, message, pathId, aiUsagePolicy } =
        await startNewDMChannel({
          userId,
          chessState,
          isChessMsg: 1,
          gameWinnerId,
          content,
          recipientId: partner?.id
        });
      if (alreadyExists) {
        return window.location.reload();
      }
      if (aiUsagePolicy) {
        handleAiUsagePolicyUpdate(aiUsagePolicy);
      }
      socket.emit('join_chat_group', message.channelId);
      socket.emit('send_bi_chat_invitation', {
        userId: partner?.id,
        members: currentChannel.members,
        pathId,
        message
      });
      onUpdateChannelPathIdHash({ channelId: channel.id, pathId });
      onCreateNewDMChannel({ channel, withoutMessage: true });
      navigate(`/chat/${pathId}`, { replace: true });
      onSetChessModalShown(false);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function handleConfirmOmokMove({
    state,
    isWinning,
    moveNumber: _moveNumber,
    previousState
  }: {
    state: any;
    isWinning: boolean;
    moveNumber?: number;
    previousState?: any;
  }) {
    const omokState = {
      ...state,
      previousState: previousState
        ? {
            ...previousState,
            previousState: null
          }
        : null
    };
    const gameWinnerId = isWinning ? userId : null;
    const content = 'Made an omok move';
    try {
      if (selectedChannelId) {
        onSetReplyTarget({ channelId: selectedChannelId, target: null });
        const { messageId, timeStamp } = await saveChatMessage({
          message: {
            userId,
            content,
            channelId: selectedChannelId,
            omokState,
            isChessMsg: true,
            gameWinnerId
          }
        });
        setLatestBoardMessageId({
          channelId: selectedChannelId,
          gameType: 'omok',
          messageId: Number(messageId)
        });
        clearBoardCountdown(selectedChannelId, 'omok');
        const messagePayload = {
          id: messageId,
          userId,
          omokState,
          isChessMsg: 1,
          gameWinnerId,
          profilePicUrl,
          username,
          content,
          channelId: selectedChannelId,
          timeStamp
        };
        onSubmitMessage({
          messageId,
          message: messagePayload
        });
        onUpdateLastOmokMessageId({
          channelId: selectedChannelId,
          messageId: Number(messageId),
          ...(typeof gameWinnerId === 'number'
            ? { terminalMessageId: Number(messageId) }
            : {})
        });
        onUpdateLastOmokMoveViewerId({
          channelId: selectedChannelId,
          viewerId: userId
        });
        onUpdateRecentOmokMessage({
          channelId: selectedChannelId,
          message: messagePayload
        });
        onSetOmokModalShown(false);
        onScrollToBottom();
        return;
      }

      if (selectedChannelId === 0 && !partner?.id) {
        reportError({
          componentPath: 'MessagesContainer/index',
          message:
            'handleConfirmOmokMove: User is trying to send the first omok message but recipient ID is missing'
        });
        return window.location.reload();
      }
      const { alreadyExists, channel, message, pathId, aiUsagePolicy } =
        await startNewDMChannel({
          userId,
          omokState,
          isChessMsg: 1,
          gameWinnerId,
          content,
          recipientId: partner?.id
        });
      if (alreadyExists) {
        return window.location.reload();
      }
      if (aiUsagePolicy) {
        handleAiUsagePolicyUpdate(aiUsagePolicy);
      }
      socket.emit('join_chat_group', message.channelId);
      socket.emit('send_bi_chat_invitation', {
        userId: partner?.id,
        members: currentChannel.members,
        pathId,
        message
      });
      onUpdateChannelPathIdHash({ channelId: channel.id, pathId });
      onCreateNewDMChannel({ channel, withoutMessage: true });
      navigate(`/chat/${pathId}`, { replace: true });
      onSetOmokModalShown(false);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
