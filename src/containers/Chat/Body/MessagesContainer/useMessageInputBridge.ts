import { useCallback, useRef } from 'react';
import type {
  AiMessageSaveErrorHandler,
  AiMessageSaveErrorPayload,
  AiUsagePolicyUpdateHandler,
  MessageInputSetTextHandler
} from './types';

export default function useMessageInputBridge({
  selectedChannelId,
  subchannelId
}: {
  selectedChannelId: number;
  subchannelId?: number;
}) {
  const messageInputSetTextRef = useRef<MessageInputSetTextHandler | null>(null);
  const messageInputAiUsagePolicyUpdateRef = useRef<
    AiUsagePolicyUpdateHandler | null
  >(null);
  const messageInputAiMessageSaveErrorRef = useRef<
    AiMessageSaveErrorHandler | null
  >(null);

  const handleRegisterMessageInputSetText = useCallback(
    (handler: MessageInputSetTextHandler | null) => {
      messageInputSetTextRef.current = handler;
    },
    []
  );

  const handleRegisterAiUsagePolicyUpdate = useCallback(
    (handler: AiUsagePolicyUpdateHandler | null) => {
      messageInputAiUsagePolicyUpdateRef.current = handler;
    },
    []
  );

  const handleRegisterAiMessageSaveError = useCallback(
    (handler: AiMessageSaveErrorHandler | null) => {
      messageInputAiMessageSaveErrorRef.current = handler;
    },
    []
  );

  function handleAiUsagePolicyUpdate(policy?: any) {
    messageInputAiUsagePolicyUpdateRef.current?.(policy);
  }

  function handleOptimisticAiMessageSaveError(
    payload: AiMessageSaveErrorPayload
  ) {
    const sourceChannelId = Number(payload.channelId) || 0;
    if (sourceChannelId && sourceChannelId !== Number(selectedChannelId)) {
      return;
    }
    const sourceSubchannelId = Number(payload.subchannelId) || 0;
    if (sourceSubchannelId !== (Number(subchannelId) || 0)) {
      return;
    }
    messageInputAiMessageSaveErrorRef.current?.(payload);
  }

  return {
    handleAiUsagePolicyUpdate,
    handleOptimisticAiMessageSaveError,
    handleRegisterAiMessageSaveError,
    handleRegisterAiUsagePolicyUpdate,
    handleRegisterMessageInputSetText,
    messageInputSetTextRef
  };
}
