import { useEffect, useRef, useCallback } from 'react';
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
}

interface UseSystemPromptSocketsProps {
  systemPromptState: SystemPromptState;
  setSystemPromptState: (newState: SystemPromptState) => void;
  setSending: (sending: boolean) => void;
  setImproving: (improving: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string) => void;
}

export default function useSystemPromptSockets({
  systemPromptState,
  setSystemPromptState,
  setSending,
  setImproving,
  setGenerating,
  setError
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

  const updateStreamingContent = useCallback(
    (content: string) => {
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
      setSystemPromptState({
        ...currentState,
        chatMessages: updatedMessages
      });
    },
    [setSystemPromptState]
  );

  const finalizeStreaming = useCallback(
    (finalReply?: string) => {
      if (typeof finalReply === 'string' && finalReply.length > 0) {
        updateStreamingContent(finalReply);
      }
      streamingMessageIdRef.current = null;
      previewRequestIdRef.current = null;
      setSending(false);
    },
    [setSending, updateStreamingContent]
  );

  const handleStreamingError = useCallback(
    (message: string) => {
      const fallbackMsg =
        message || 'Unable to get a preview response. Please try again.';
      updateStreamingContent(fallbackMsg);
      setError(fallbackMsg);
      streamingMessageIdRef.current = null;
      previewRequestIdRef.current = null;
      setSending(false);
    },
    [setError, setSending, updateStreamingContent]
  );

  useEffect(() => {
    function handlePreviewUpdate({
      requestId,
      reply
    }: {
      requestId?: string;
      reply?: string;
    }) {
      if (!requestId || requestId !== previewRequestIdRef.current) return;
      updateStreamingContent(reply || '');
    }

    function handlePreviewComplete({
      requestId,
      reply
    }: {
      requestId?: string;
      reply?: string;
    }) {
      if (!requestId || requestId !== previewRequestIdRef.current) return;
      finalizeStreaming(reply);
    }

    function handlePreviewError({
      requestId,
      error: errorMessage
    }: {
      requestId?: string;
      error?: string;
    }) {
      if (!requestId || requestId !== previewRequestIdRef.current) return;
      handleStreamingError(errorMessage || '');
    }

    socket.on('system_prompt_preview_update', handlePreviewUpdate);
    socket.on('system_prompt_preview_complete', handlePreviewComplete);
    socket.on('system_prompt_preview_error', handlePreviewError);

    return () => {
      socket.off('system_prompt_preview_update', handlePreviewUpdate);
      socket.off('system_prompt_preview_complete', handlePreviewComplete);
      socket.off('system_prompt_preview_error', handlePreviewError);
    };
  }, [finalizeStreaming, handleStreamingError, updateStreamingContent]);

  useEffect(() => {
    function handleImproveUpdate({
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
      setSystemPromptState({
        ...currentState,
        prompt: formatted
      });
    }

    function handleImproveComplete({
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
      setSystemPromptState({
        ...currentState,
        prompt: formatted
      });
      improveRequestIdRef.current = null;
      setImproving(false);
    }

    function handleImproveError({
      requestId,
      error: errorMessage
    }: {
      requestId?: string;
      error?: string;
    }) {
      if (!requestId || requestId !== improveRequestIdRef.current) return;
      const currentState = systemPromptStateRef.current;
      setSystemPromptState({
        ...currentState,
        prompt: improveOriginalPromptRef.current
      });
      improveRequestIdRef.current = null;
      setImproving(false);
      setError(
        errorMessage || 'Unable to improve the prompt. Please try again.'
      );
    }

    socket.on('improve_custom_instructions_update', handleImproveUpdate);
    socket.on('improve_custom_instructions_complete', handleImproveComplete);
    socket.on('improve_custom_instructions_error', handleImproveError);

    return () => {
      socket.off('improve_custom_instructions_update', handleImproveUpdate);
      socket.off('improve_custom_instructions_complete', handleImproveComplete);
      socket.off('improve_custom_instructions_error', handleImproveError);
    };
  }, [setImproving, setSystemPromptState, setError]);

  useEffect(() => {
    function handleGenerateUpdate({
      requestId,
      content
    }: {
      requestId?: string;
      content?: string;
    }) {
      if (!requestId || requestId !== generateRequestIdRef.current) return;
      const currentState = systemPromptStateRef.current;
      setSystemPromptState({
        ...currentState,
        prompt: content || ''
      });
    }

    function handleGenerateComplete({
      requestId,
      content
    }: {
      requestId?: string;
      content?: string;
    }) {
      if (!requestId || requestId !== generateRequestIdRef.current) return;
      const currentState = systemPromptStateRef.current;
      setSystemPromptState({
        ...currentState,
        prompt: content || ''
      });
      generateRequestIdRef.current = null;
      setGenerating(false);
    }

    function handleGenerateError({
      requestId,
      error: errorMessage
    }: {
      requestId?: string;
      error?: string;
    }) {
      if (!requestId || requestId !== generateRequestIdRef.current) return;
      generateRequestIdRef.current = null;
      setGenerating(false);
      setError(
        errorMessage || 'Unable to generate the prompt. Please try again.'
      );
    }

    socket.on('generate_custom_instructions_update', handleGenerateUpdate);
    socket.on('generate_custom_instructions_complete', handleGenerateComplete);
    socket.on('generate_custom_instructions_error', handleGenerateError);

    return () => {
      socket.off('generate_custom_instructions_update', handleGenerateUpdate);
      socket.off('generate_custom_instructions_complete', handleGenerateComplete);
      socket.off('generate_custom_instructions_error', handleGenerateError);
    };
  }, [setGenerating, setSystemPromptState, setError]);

  return {
    previewRequestIdRef,
    streamingMessageIdRef,
    improveRequestIdRef,
    improveOriginalPromptRef,
    generateRequestIdRef
  };
}
