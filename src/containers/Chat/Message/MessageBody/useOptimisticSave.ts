import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';

interface Props {
  channelId: number;
  currentChannel: any;
  hasChessBoardState: boolean;
  hasOmokBoardState: boolean;
  index: number;
  isCallMsg: boolean;
  message: any;
  onAiUsagePolicyUpdate?: (policy?: any) => void;
  onOptimisticAiMessageSaveError?: (payload: {
    content?: string;
    error?: any;
    aiUsagePolicy?: any;
    channelId?: number;
    subchannelId?: number;
    topicId?: number;
  }) => void;
  onRemoveTempMessage: (v: any) => void;
  onSaveMessage: (v: any) => void;
  onSetMessageState: (v: any) => void;
  onSetUserState: (v: any) => void;
  onUpdateRecentChessMessage: (v: any) => void;
  onUpdateRecentOmokMessage: (v: any) => void;
  partner: any;
  saveChatMessage: (v: any) => Promise<any>;
  subjectId: number;
  subchannelId?: number;
  targetMessage: any;
  targetSubject: any;
  thinkHardState: any;
  userIsUploader: boolean;
  userId: number;
  level: number;
}

export default function useOptimisticSave({
  channelId,
  currentChannel,
  hasChessBoardState,
  hasOmokBoardState,
  index,
  isCallMsg,
  message,
  onAiUsagePolicyUpdate,
  onOptimisticAiMessageSaveError,
  onRemoveTempMessage,
  onSaveMessage,
  onSetMessageState,
  onSetUserState,
  onUpdateRecentChessMessage,
  onUpdateRecentOmokMessage,
  partner,
  saveChatMessage,
  subjectId,
  subchannelId,
  targetMessage,
  targetSubject,
  thinkHardState,
  userIsUploader,
  userId,
  level
}: Props) {
  useEffect(() => {
    if (!message.id && hasChessBoardState) {
      onUpdateRecentChessMessage({ channelId, message });
    }
    if (!message.id && hasOmokBoardState) {
      onUpdateRecentOmokMessage({ channelId, message });
    }
    if (
      userIsUploader &&
      !message.id &&
      !message.fileToUpload &&
      !message.isSubject &&
      !message.settings?.saveFailed &&
      (!(message.isNotification && !message.chessState) || isCallMsg)
    ) {
      handleSaveMessage(message);
    }

    async function handleSaveMessage(newMessage: {
      tempMessageId: number | string;
      userId: number;
      isChessMsg: boolean;
      isDrawOffer: boolean;
      isDraw: boolean;
      isAbort: boolean;
      isCallMsg: boolean;
      isReloadedSubject: boolean;
      isResign: boolean;
      isNotification?: boolean;
      chessState: any;
      omokState: any;
      content: string;
      channelId: number;
      gameWinnerId: number;
      rewardReason: string;
      rewardAmount: number;
      targetMessageId: number;
      timeStamp: number;
      subchannelId?: number;
      subjectId?: number;
      username?: string;
      profilePicUrl?: string;
      targetMessage?: any;
    }) {
      const isCielChat = partner?.id === CIEL_TWINKLE_ID;
      const isZeroChat = partner?.id === ZERO_TWINKLE_ID;
      const { tempMessageId } = newMessage;
      const post = {
        userId: newMessage.userId,
        content: newMessage.content,
        channelId: newMessage.channelId,
        chessState: newMessage.chessState,
        omokState: newMessage.omokState,
        isCallMsg: newMessage.isCallMsg,
        isChessMsg: newMessage.isChessMsg,
        isDrawOffer: newMessage.isDrawOffer,
        isDraw: newMessage.isDraw,
        isAbort: newMessage.isAbort,
        isResign: newMessage.isResign,
        isReloadedSubject: newMessage.isReloadedSubject,
        isNotification: !!newMessage.isNotification,
        gameWinnerId: newMessage.gameWinnerId,
        rewardReason: newMessage.rewardReason,
        rewardAmount: newMessage.rewardAmount,
        targetMessageId: newMessage.targetMessageId,
        timeStamp: newMessage.timeStamp,
        subjectId: newMessage.subjectId || 0,
        subchannelId: newMessage.subchannelId
      };

      let savedMessage;
      try {
        savedMessage = await saveChatMessage({
          message: post,
          targetMessageId: targetMessage?.id,
          targetSubject,
          isCielChat,
          isZeroChat,
          thinkHard:
            (isCielChat &&
              (thinkHardState.ciel[subjectId] ?? thinkHardState.ciel.global)) ||
            (isZeroChat &&
              (thinkHardState.zero[subjectId] ?? thinkHardState.zero.global))
        });
      } catch (error: any) {
        console.error('Failed to save optimistic chat message:', error);
        const isAIChat = isCielChat || isZeroChat;
        if (error?.aiUsagePolicy) {
          onAiUsagePolicyUpdate?.(error.aiUsagePolicy);
        }
        if (isAIChat) {
          onOptimisticAiMessageSaveError?.({
            content: newMessage.content,
            error,
            aiUsagePolicy: error?.aiUsagePolicy,
            channelId,
            subchannelId: newMessage.subchannelId,
            topicId: newMessage.subjectId || 0
          });
          onRemoveTempMessage({
            channelId,
            subchannelId: newMessage.subchannelId,
            topicId: newMessage.subjectId || 0,
            tempMessageId
          });
          return;
        }

        onSetMessageState({
          channelId,
          messageId: tempMessageId,
          newState: {
            settings: {
              ...(message.settings || {}),
              saveFailed: true
            }
          }
        });
        return;
      }

      const { messageId, timeStamp, netCoins, aiUsagePolicy } = savedMessage;

      if (typeof netCoins === 'number') {
        onSetUserState({
          userId,
          newState: { twinkleCoins: netCoins }
        });
      }
      if (aiUsagePolicy) {
        onAiUsagePolicyUpdate?.(aiUsagePolicy);
      }
      onSaveMessage({
        messageId,
        subchannelId,
        index,
        channelId,
        timeStamp,
        topicId: subjectId || 0,
        tempMessageId
      });
      const messageToSendOverSocket = {
        ...message,
        uploaderLevel: level,
        isNewMessage: true,
        targetSubject: subjectId
          ? targetSubject || currentChannel?.topicObj[subjectId]
          : null,
        id: messageId
      };
      delete messageToSendOverSocket.tempMessageId;
      const channelData = {
        id: currentChannel.id,
        channelName: currentChannel.channelName,
        members: currentChannel.members,
        twoPeople: currentChannel.twoPeople,
        pathId: currentChannel.pathId
      };
      socket.emit('new_chat_message', {
        message: messageToSendOverSocket,
        channel: channelData
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
