import React, { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useChatContext, useViewContext } from '~/contexts';
import {
  ZERO_PFP_URL,
  ZERO_TWINKLE_ID,
  CIEL_PFP_URL
} from '~/constants/defaultValues';

export default function useAISocket({
  selectedChannelId,
  usingChatRef
}: {
  selectedChannelId: number;
  usingChatRef: React.RefObject<boolean>;
}) {
  const pageVisible = useViewContext((v) => v.state.pageVisible);

  const onReceiveMessage = useChatContext((v) => v.actions.onReceiveMessage);
  const onSetTopicSettingsJSON = useChatContext(
    (v) => v.actions.onSetTopicSettingsJSON
  );
  const onSetChannelSettingsJSON = useChatContext(
    (v) => v.actions.onSetChannelSettingsJSON
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);

  const updateChatLastRead = useAppContext(
    (v) => v.requestHelpers.updateChatLastRead
  );

  useEffect(() => {
    socket.on('ai_memory_updated', handleAIMemoryUpdate);
    socket.on('ai_message_done', handleAIMessageDone);
    socket.on('new_ai_message_received', handleReceiveAIMessage);

    return function cleanUp() {
      socket.removeListener('ai_memory_updated', handleAIMemoryUpdate);
      socket.removeListener('ai_message_done', handleAIMessageDone);
      socket.removeListener('new_ai_message_received', handleReceiveAIMessage);
    };

    function handleAIMemoryUpdate({
      channelId,
      topicId,
      memory
    }: {
      channelId: number;
      topicId: number;
      memory: any;
    }) {
      if (topicId) {
        onSetTopicSettingsJSON({
          channelId,
          topicId,
          newSettings: { aiMemory: memory }
        });
      } else {
        onSetChannelSettingsJSON({
          channelId,
          newSettings: { aiMemory: memory }
        });
      }
    }

    function handleAIMessageDone(channelId: number) {
      onSetChannelState({
        channelId,
        newState: { currentlyStreamingAIMsgId: null }
      });
    }

    function handleReceiveAIMessage({
      message,
      channelId
    }: {
      message: any;
      channelId: number;
    }) {
      onSetChannelState({
        channelId,
        newState: {
          currentlyStreamingAIMsgId: message.id
        }
      });
      const messageIsForCurrentChannel = channelId === selectedChannelId;
      if (messageIsForCurrentChannel) {
        if (usingChatRef.current) {
          updateChatLastRead(channelId);
        }
        onReceiveMessage({
          message: {
            ...message,
            profilePicUrl:
              message.userId === ZERO_TWINKLE_ID ? ZERO_PFP_URL : CIEL_PFP_URL
          },
          pageVisible,
          usingChat: usingChatRef.current
        });
      }
    }
  });
}
