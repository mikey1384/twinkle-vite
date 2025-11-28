import { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { deriveImprovedInstructionsText } from '~/helpers/improveCustomInstructions';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface SystemPromptState {
  title: string;
  prompt: string;
  userMessage: string;
  missionPromptId?: number | null;
  chatMessages: ChatMessage[];
  promptEverGenerated?: boolean;
}

interface UseSystemPromptSocketsProps {
  systemPromptState: SystemPromptState;
  onSetSystemPromptState: (newState: SystemPromptState) => void;
  onSetSending: (sending: boolean) => void;
  onSetImproving: (improving: boolean) => void;
  onSetGenerating: (generating: boolean) => void;
  onSetError: (error: string) => void;
}

export default function useSystemPromptSockets({
  systemPromptState,
  onSetSystemPromptState,
  onSetSending,
  onSetImproving,
  onSetGenerating,
  onSetError
}: UseSystemPromptSocketsProps) {
  const systemPromptStateRef = useRef<SystemPromptState>(systemPromptState);
  const previewRequestIdRef = useRef<string | null>(null);
  const streamingMessageIdRef = useRef<number | null>(null);
  const improveRequestIdRef = useRef<string | null>(null);
  const improveOriginalPromptRef = useRef('');
  const generateRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    systemPromptStateRef.current = systemPromptState;
  }, [systemPromptState]);

  function handleUpdateStreamingContent(content: string) {
    const currentState = systemPromptStateRef.current;
    const messages = currentState.chatMessages || [];
    const targetId = streamingMessageIdRef.current;
    if (!targetId) return;
    const index = messages.findIndex((message) => message.id === targetId);
    if (index < 0) return;
    const updatedMessages = [...messages];
    updatedMessages[index] = {
      ...updatedMessages[index],
      content
    };
    onSetSystemPromptState({
      ...currentState,
      chatMessages: updatedMessages
    });
  }

  function handleFinalizeStreaming(finalReply?: string) {
    if (typeof finalReply === 'string' && finalReply.length > 0) {
      handleUpdateStreamingContent(finalReply);
    }
    streamingMessageIdRef.current = null;
    previewRequestIdRef.current = null;
    onSetSending(false);
  }

  function handleStreamingError(message: string) {
    const fallbackMsg =
      message || 'Unable to get a preview response. Please try again.';
    handleUpdateStreamingContent(fallbackMsg);
    onSetError(fallbackMsg);
    streamingMessageIdRef.current = null;
    previewRequestIdRef.current = null;
    onSetSending(false);
  }

  useEffect(() => {
    function onPreviewUpdate({
      requestId,
      reply
    }: {
      requestId?: string;
      reply?: string;
    }) {
      if (!requestId || requestId !== previewRequestIdRef.current) return;
      handleUpdateStreamingContent(reply || '');
    }

    function onPreviewComplete({
      requestId,
      reply
    }: {
      requestId?: string;
      reply?: string;
    }) {
      if (!requestId || requestId !== previewRequestIdRef.current) return;
      handleFinalizeStreaming(reply);
    }

    function onPreviewError({
      requestId,
      error: errorMessage
    }: {
      requestId?: string;
      error?: string;
    }) {
      if (!requestId || requestId !== previewRequestIdRef.current) return;
      handleStreamingError(errorMessage || '');
    }

    socket.on('system_prompt_preview_update', onPreviewUpdate);
    socket.on('system_prompt_preview_complete', onPreviewComplete);
    socket.on('system_prompt_preview_error', onPreviewError);

    return () => {
      socket.off('system_prompt_preview_update', onPreviewUpdate);
      socket.off('system_prompt_preview_complete', onPreviewComplete);
      socket.off('system_prompt_preview_error', onPreviewError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onImproveUpdate({
      requestId,
      content,
      structuredContent
    }: {
      requestId?: string;
      content?: string;
      structuredContent?: string;
    }) {
      if (!requestId || requestId !== improveRequestIdRef.current) return;
      const currentState = systemPromptStateRef.current;
      const formatted = deriveImprovedInstructionsText({
        structuredContent,
        topicText: currentState.title,
        fallbackText: content || ''
      });
      onSetSystemPromptState({
        ...currentState,
        prompt: formatted
      });
    }

    function onImproveComplete({
      requestId,
      content,
      structuredContent
    }: {
      requestId?: string;
      content?: string;
      structuredContent?: string;
    }) {
      if (!requestId || requestId !== improveRequestIdRef.current) return;
      const currentState = systemPromptStateRef.current;
      const formatted = deriveImprovedInstructionsText({
        structuredContent,
        topicText: currentState.title,
        fallbackText: content || currentState.prompt
      });
      onSetSystemPromptState({
        ...currentState,
        prompt: formatted
      });
      improveRequestIdRef.current = null;
      onSetImproving(false);
    }

    function onImproveError({
      requestId,
      error: errorMessage
    }: {
      requestId?: string;
      error?: string;
    }) {
      if (!requestId || requestId !== improveRequestIdRef.current) return;
      const currentState = systemPromptStateRef.current;
      onSetSystemPromptState({
        ...currentState,
        prompt: improveOriginalPromptRef.current
      });
      improveRequestIdRef.current = null;
      onSetImproving(false);
      onSetError(
        errorMessage || 'Unable to improve the prompt. Please try again.'
      );
    }

    socket.on('improve_custom_instructions_update', onImproveUpdate);
    socket.on('improve_custom_instructions_complete', onImproveComplete);
    socket.on('improve_custom_instructions_error', onImproveError);

    return () => {
      socket.off('improve_custom_instructions_update', onImproveUpdate);
      socket.off('improve_custom_instructions_complete', onImproveComplete);
      socket.off('improve_custom_instructions_error', onImproveError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onGenerateUpdate({
      requestId,
      content
    }: {
      requestId?: string;
      content?: string;
    }) {
      if (!requestId || requestId !== generateRequestIdRef.current) return;
      const currentState = systemPromptStateRef.current;
      onSetSystemPromptState({
        ...currentState,
        prompt: content || ''
      });
    }

    function onGenerateComplete({
      requestId,
      content
    }: {
      requestId?: string;
      content?: string;
    }) {
      if (!requestId || requestId !== generateRequestIdRef.current) return;
      const currentState = systemPromptStateRef.current;
      onSetSystemPromptState({
        ...currentState,
        prompt: content || ''
      });
      generateRequestIdRef.current = null;
      onSetGenerating(false);
    }

    function onGenerateError({
      requestId,
      error: errorMessage
    }: {
      requestId?: string;
      error?: string;
    }) {
      if (!requestId || requestId !== generateRequestIdRef.current) return;
      generateRequestIdRef.current = null;
      onSetGenerating(false);
      onSetError(
        errorMessage || 'Unable to generate the prompt. Please try again.'
      );
    }

    socket.on('generate_custom_instructions_update', onGenerateUpdate);
    socket.on('generate_custom_instructions_complete', onGenerateComplete);
    socket.on('generate_custom_instructions_error', onGenerateError);

    return () => {
      socket.off('generate_custom_instructions_update', onGenerateUpdate);
      socket.off('generate_custom_instructions_complete', onGenerateComplete);
      socket.off('generate_custom_instructions_error', onGenerateError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    previewRequestIdRef,
    streamingMessageIdRef,
    improveRequestIdRef,
    improveOriginalPromptRef,
    generateRequestIdRef
  };
}
