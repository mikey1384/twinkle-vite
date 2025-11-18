import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { deriveImprovedInstructionsText } from '~/helpers/improveCustomInstructions';
import RichText from '~/components/Texts/RichText';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface SystemPromptState {
  title: string;
  prompt: string;
  userMessage: string;
  chatMessages: ChatMessage[];
}

export default function SystemPromptMission({
  mission,
  onSetMissionState,
  style
}: {
  mission: any;
  onSetMissionState: (v: any) => void;
  style?: React.CSSProperties;
}) {
  const [improving, setImproving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const systemPromptState: SystemPromptState = useMemo(() => {
    const rawState = mission.systemPromptState || {};
    const sanitizedMessages = Array.isArray(rawState.chatMessages)
      ? rawState.chatMessages.map(
          (message: any, index: number): ChatMessage => ({
            id:
              typeof message?.id === 'number'
                ? message.id
                : index + 1,
            role: message?.role === 'assistant' ? 'assistant' : 'user',
            content:
              typeof message?.content === 'string' ? message.content : ''
          })
        )
      : [];
    return {
      title: rawState.title || '',
      prompt: rawState.prompt || '',
      userMessage: rawState.userMessage || '',
      chatMessages: sanitizedMessages
    };
  }, [mission.systemPromptState]);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const systemPromptStateRef = useRef<SystemPromptState>(systemPromptState);
  const previewRequestIdRef = useRef<string | null>(null);
  const streamingMessageIdRef = useRef<number | null>(null);
  const improveRequestIdRef = useRef<string | null>(null);
  const improveOriginalPromptRef = useRef('');
  const { title, prompt, userMessage, chatMessages } = systemPromptState;
  const trimmedPrompt = prompt.trim();
  const trimmedMessage = userMessage.trim();
  const trimmedTitle = title.trim();
  const hasPrompt = trimmedPrompt.length > 0;
  const canSend = Boolean(hasPrompt && trimmedMessage && !sending);

  const setSystemPromptState = useCallback(
    (nextState: SystemPromptState) => {
      onSetMissionState({
        missionId: mission.id,
        newState: { systemPromptState: nextState }
      });
    },
    [mission.id, onSetMissionState]
  );

  useEffect(() => {
    systemPromptStateRef.current = systemPromptState;
  }, [systemPromptState]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const containerClass = useMemo(
    () =>
      css`
        border: 1px dashed ${Color.borderGray()};
        border-radius: 1.6rem;
        padding: 2.4rem;
        background: ${Color.white()};
        display: flex;
        flex-direction: column;
        gap: 2.4rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.6rem;
          gap: 1.8rem;
        }
      `,
    []
  );

  const labelClass = useMemo(
    () =>
      css`
        font-size: 1.4rem;
        font-weight: 700;
        text-transform: uppercase;
        color: ${Color.darkerGray()};
        letter-spacing: 0.05em;
      `,
    []
  );

  const chatWindowClass = useMemo(
    () =>
      css`
        border: 1px solid ${Color.borderGray()};
        border-radius: 1.2rem;
        background: ${Color.whiteGray()};
        padding: 1.6rem;
        min-height: 24rem;
        max-height: 40rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
        position: relative;
      `,
    []
  );

  const bubbleLabelClass = useMemo(
    () =>
      css`
        font-size: 1.1rem;
        font-weight: 700;
        text-transform: uppercase;
        color: ${Color.gray()};
        margin-bottom: 0.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        width: 100%;
      `,
    []
  );

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
    [updateStreamingContent]
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
    [updateStreamingContent]
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
  }, [setSystemPromptState, setError]);

  return (
    <ErrorBoundary componentPath="MissionModule/SystemPrompt">
      <div className={containerClass} style={style}>
        <section>
          <div className={labelClass}>System Prompt Title</div>
          <Input
            value={title}
            placeholder="e.g., Ciel the encouraging grammar buddy"
            maxLength={200}
            onChange={(text) =>
              setSystemPromptState({
                ...systemPromptState,
                title: text
              })
            }
          />
          <small
            style={{
              marginTop: '0.5rem',
              color: Color.gray(),
              display: 'block'
            }}
          >
            Give your custom agent a memorable name or theme so you can share it
            later.
          </small>
        </section>
        <section>
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1rem;
              flex-wrap: wrap;
            `}
          >
            <div className={labelClass}>System Prompt</div>
            <Button
              onClick={handleImprovePrompt}
              disabled={!hasPrompt || improving}
              color="magenta"
              variant="soft"
              tone="raised"
              style={{ padding: '0.7rem 1.3rem', fontSize: '1rem' }}
            >
              {improving ? (
                <>
                  <Icon
                    style={{ marginRight: '0.5rem' }}
                    icon="spinner"
                    pulse
                  />
                  Improving...
                </>
              ) : (
                <>
                  <Icon
                    style={{ marginRight: '0.5rem' }}
                    icon="wand-magic-sparkles"
                  />
                  Improve Prompt
                </>
              )}
            </Button>
          </div>
          <Textarea
            style={{ marginTop: '0.8rem', width: '100%' }}
            placeholder={`Describe the agent's personality, boundaries, and priorities.\nInclude how Zero or Ciel should speak, what to avoid, and what success looks like.`}
            minRows={5}
            maxRows={16}
            disabled={improving}
            value={prompt}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setSystemPromptState({
                ...systemPromptState,
                prompt: event.target.value
              })
            }
          />
        </section>
        <section
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1rem;
              flex-wrap: wrap;
            `}
          >
            <div className={labelClass}>Chat Preview</div>
            <Button
              color="rose"
              variant="ghost"
              disabled={!chatMessages.length}
              onClick={() => {
                setError('');
                setSystemPromptState({
                  ...systemPromptState,
                  chatMessages: []
                });
              }}
            >
              <Icon style={{ marginRight: '0.5rem' }} icon="broom" />
              Clear Conversation
            </Button>
          </div>
          <div ref={messageListRef} className={chatWindowClass}>
            {chatMessages.length === 0 ? (
              <div
                className={css`
                  color: ${Color.gray()};
                  font-size: 1.4rem;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  text-align: center;
                  min-height: 18rem;
                  width: 100%;
                  flex: 1 1 auto;
                  margin: auto 0;
                `}
              >
                Start chatting to test how your agent behaves with the current
                system prompt.
              </div>
            ) : (
              chatMessages.map((message) => {
                const content =
                  typeof message.content === 'string' ? message.content : '';
                return (
                  <div
                    key={message.id}
                    className={css`
                      align-self: ${message.role === 'assistant'
                        ? 'flex-start'
                        : 'flex-end'};
                      background: ${message.role === 'assistant'
                        ? Color.white()
                        : Color.skyBlue(0.12)};
                      color: ${Color.black()};
                      border: 1px solid ${Color.borderGray()};
                      border-radius: 1rem;
                      padding: 1rem 1.2rem;
                      max-width: 85%;
                      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
                    `}
                  >
                    <div className={bubbleLabelClass}>
                      {message.role === 'assistant'
                        ? trimmedTitle || 'Agent'
                        : 'You'}
                    </div>
                    <RichText
                      isAIMessage={message.role === 'assistant'}
                      isAudioButtonShown={false}
                      contentId={message.id}
                      contentType="systemPromptPreview"
                      section="main"
                      maxLines={5000}
                      style={{
                        fontSize: '1.4rem',
                        lineHeight: 1.6
                      }}
                    >
                      {content}
                    </RichText>
                  </div>
                );
              })
            )}
          </div>
          {error && (
            <div
              className={css`
                color: ${Color.red()};
                font-size: 1.3rem;
              `}
            >
              {error}
            </div>
          )}
          <div
            className={css`
              display: flex;
              gap: 1rem;
              flex-direction: column;
            `}
          >
            <Textarea
              minRows={2}
              maxRows={6}
              placeholder={
                hasPrompt
                  ? 'Ask a question or give a scenario for this agent.'
                  : 'Enter a system prompt before chatting.'
              }
              value={userMessage}
              disabled={!hasPrompt || sending}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setSystemPromptState({
                  ...systemPromptState,
                  userMessage: event.target.value
                })
              }
            />
            <div
              className={css`
                display: flex;
                justify-content: flex-end;
              `}
            >
              <Button
                color="darkBlue"
                variant="soft"
                tone="raised"
                disabled={!canSend}
                onClick={handleSendMessage}
                style={{ minWidth: '10rem' }}
              >
                {sending ? (
                  <>
                    <Icon
                      style={{ marginRight: '0.5rem' }}
                      icon="spinner"
                      pulse
                    />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Icon
                      style={{ marginRight: '0.5rem' }}
                      icon="paper-plane"
                    />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );

  function handleImprovePrompt() {
    if (!hasPrompt || improving) return;
    setError('');
    improveOriginalPromptRef.current = prompt;
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    improveRequestIdRef.current = requestId;
    setImproving(true);
    socket.emit('improve_custom_instructions', {
      requestId,
      topicText: trimmedTitle || 'Custom System Prompt',
      customInstructions: trimmedPrompt
    });
  }

  function handleSendMessage() {
    if (!canSend) return;
    setError('');
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmedMessage
    };
    const baseMessages = [...chatMessages, userMessage];
    const assistantMessageId = Date.now() + 1;
    const nextState: SystemPromptState = {
      ...systemPromptState,
      chatMessages: [
        ...baseMessages,
        { id: assistantMessageId, role: 'assistant', content: '' }
      ],
      userMessage: ''
    };
    setSystemPromptState(nextState);
    streamingMessageIdRef.current = assistantMessageId;
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    previewRequestIdRef.current = requestId;
    setSending(true);
    socket.emit('system_prompt_preview', {
      requestId,
      promptTitle: trimmedTitle || 'Custom Agent',
      systemPrompt: trimmedPrompt,
      messages: baseMessages.map(({ role, content }) => ({
        role,
        content: typeof content === 'string' ? content : ''
      }))
    });
  }
}
