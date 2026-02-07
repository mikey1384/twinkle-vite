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
  const onSetSystemPromptStateRef = useRef(onSetSystemPromptState);
  const onSetSendingRef = useRef(onSetSending);
  const onSetImprovingRef = useRef(onSetImproving);
  const onSetGeneratingRef = useRef(onSetGenerating);
  const onSetErrorRef = useRef(onSetError);

  useEffect(() => {
    systemPromptStateRef.current = systemPromptState;
  }, [systemPromptState]);

  useEffect(() => {
    onSetSystemPromptStateRef.current = onSetSystemPromptState;
    onSetSendingRef.current = onSetSending;
    onSetImprovingRef.current = onSetImproving;
    onSetGeneratingRef.current = onSetGenerating;
    onSetErrorRef.current = onSetError;
  }, [
    onSetSystemPromptState,
    onSetSending,
    onSetImproving,
    onSetGenerating,
    onSetError
  ]);

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
    onSetSystemPromptStateRef.current({
      ...currentState,
      chatMessages: updatedMessages,
      // Always true - these handlers only fire when prompt actions are happening
      promptEverGenerated: true
    });
  }

  function handleFinalizeStreaming(finalReply?: string) {
    if (typeof finalReply === 'string' && finalReply.length > 0) {
      handleUpdateStreamingContent(finalReply);
    }
    streamingMessageIdRef.current = null;
    previewRequestIdRef.current = null;
    onSetSendingRef.current(false);
  }

  function handleStreamingError(message: string) {
    const fallbackMsg =
      message || 'Unable to get a preview response. Please try again.';
    handleUpdateStreamingContent(fallbackMsg);
    onSetErrorRef.current(fallbackMsg);
    streamingMessageIdRef.current = null;
    previewRequestIdRef.current = null;
    onSetSendingRef.current(false);
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
      onSetSystemPromptStateRef.current({
        ...currentState,
        prompt: formatted,
        promptEverGenerated: true
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
      onSetSystemPromptStateRef.current({
        ...currentState,
        prompt: formatted,
        promptEverGenerated: true
      });
      improveRequestIdRef.current = null;
      onSetImprovingRef.current(false);
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
      onSetSystemPromptStateRef.current({
        ...currentState,
        prompt: improveOriginalPromptRef.current,
        promptEverGenerated: true
      });
      improveRequestIdRef.current = null;
      onSetImprovingRef.current(false);
      onSetErrorRef.current(
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
      onSetSystemPromptStateRef.current({
        ...currentState,
        prompt: content || '',
        promptEverGenerated: true
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
      onSetSystemPromptStateRef.current({
        ...currentState,
        prompt: content || '',
        promptEverGenerated: true
      });
      generateRequestIdRef.current = null;
      onSetGeneratingRef.current(false);
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
      onSetGeneratingRef.current(false);
      onSetErrorRef.current(
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
  }, []);

  return {
    previewRequestIdRef,
    streamingMessageIdRef,
    improveRequestIdRef,
    improveOriginalPromptRef,
    generateRequestIdRef
  };
}
