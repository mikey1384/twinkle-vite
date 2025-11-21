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
import ProgressBar from '~/components/ProgressBar';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { deriveImprovedInstructionsText } from '~/helpers/improveCustomInstructions';
import RichText from '~/components/Texts/RichText';
import { useAppContext, useKeyContext } from '~/contexts';
import TaskComplete from './components/TaskComplete';
import Loading from '~/components/Loading';

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
  const [applyingTarget, setApplyingTarget] = useState<null | 'zero' | 'ciel'>(
    null
  );
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState('');
  const [progress, setProgress] = useState<any | null>(null);
  const loadSystemPromptProgress = useAppContext(
    (v) => v.requestHelpers.loadSystemPromptProgress
  );
  const applySystemPromptToAIChat = useAppContext(
    (v) => v.requestHelpers.applySystemPromptToAIChat
  );
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const contentColor = useKeyContext((v) => v.theme.content.color);

  const systemPromptState: SystemPromptState = useMemo(() => {
    const rawState = mission.systemPromptState || {};
    const sanitizedMessages = Array.isArray(rawState.chatMessages)
      ? rawState.chatMessages.map(
          (message: any, index: number): ChatMessage => ({
            id: typeof message?.id === 'number' ? message.id : index + 1,
            role: message?.role === 'assistant' ? 'assistant' : 'user',
            content: typeof message?.content === 'string' ? message.content : ''
          })
        )
      : [];
    return {
      title: rawState.title || '',
      prompt: rawState.prompt || '',
      userMessage: rawState.userMessage || '',
      missionPromptId:
        typeof rawState.missionPromptId === 'number'
          ? rawState.missionPromptId
          : null,
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
  const createdPrompt = useMemo(() => {
    return (
      progress?.previewed || !!progress?.systemPromptState?.prompt || hasPrompt
    );
  }, [hasPrompt, progress?.previewed, progress?.systemPromptState?.prompt]);
  const aiMessageCount = progress?.aiTopic?.messageCount || 0;
  const sharedMessageCount = progress?.sharedTopic?.messageCount || 0;
  const hasAiTopic = Boolean(progress?.aiTopic?.id);
  const hasSharedTopic = Boolean(progress?.sharedTopic?.id);
  const missionCleared =
    createdPrompt &&
    hasAiTopic &&
    aiMessageCount >= 2 &&
    hasSharedTopic &&
    sharedMessageCount >= 1;

  const checklistItems = useMemo(
    () => [
      {
        label: 'Draft and test a system prompt',
        complete: createdPrompt,
        detail: createdPrompt
          ? 'Prompt saved and previewed'
          : 'Save your prompt and run a chat preview'
      },
      {
        label: 'Use it with Zero or Ciel',
        complete: hasAiTopic && aiMessageCount >= 2,
        detail: hasAiTopic
          ? `${Math.min(aiMessageCount, 2)}/2 messages in your AI topic`
          : 'Apply the prompt to a Zero/Ciel topic and send 2+ messages'
      },
      {
        label: `Clone a shared prompt`,
        complete: hasSharedTopic && sharedMessageCount >= 1,
        detail: hasSharedTopic
          ? `${Math.min(sharedMessageCount, 1)}/1 message in your cloned shared prompt`
          : 'Browse Shared Prompts, clone one, and send a message'
      }
    ],
    [aiMessageCount, createdPrompt, hasAiTopic, hasSharedTopic, sharedMessageCount]
  );

  const checklistCompletedCount = checklistItems.filter(
    (item) => item.complete
  ).length;
  const checklistProgress = Math.round(
    (checklistCompletedCount / checklistItems.length) * 100
  );

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
    let mounted = true;
    async function loadProgress() {
      try {
        const data = await loadSystemPromptProgress();
        if (!mounted) return;
        setProgress(data || {});
        if (
          data?.systemPromptState &&
          (!mission.systemPromptState?.prompt ||
            !mission.systemPromptState?.title)
        ) {
          onSetMissionState({
            missionId: mission.id,
            newState: { systemPromptState: data.systemPromptState }
          });
        }
      } catch {
        if (!mounted) return;
        setProgressError('Could not load your mission progress.');
      } finally {
        if (mounted) setProgressLoading(false);
      }
    }
    loadProgress();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSystemPromptProgress, mission.id]);

  useEffect(() => {
    systemPromptStateRef.current = systemPromptState;
  }, [systemPromptState]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const layoutClass = useMemo(
    () =>
      css`
        display: grid;
        grid-template-columns: minmax(26rem, 30rem) 1fr;
        gap: 1.5rem;
        align-items: flex-start;
        width: 100%;
        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 1fr;
          gap: 1.2rem;
        }
      `,
    []
  );

  const cardClass = useMemo(
    () =>
      css`
        width: 100%;
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        padding: 1.4rem 1.6rem;
        box-shadow: none;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.2rem;
        }
      `,
    []
  );

  const checklistCardClass = useMemo(
    () =>
      css`
        background: ${Color.whiteBlueGray(0.4)};
        border: 1px solid var(--ui-border);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        padding: 1.6rem 1.8rem;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.05);
        }
      `,
    []
  );

  const sidebarClass = useMemo(
    () =>
      css`
        position: sticky;
        top: 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          position: static;
        }
      `,
    []
  );

  const contentClass = useMemo(
    () =>
      css`
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
      `,
    []
  );

  const sectionHeaderClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      `,
    []
  );

  const labelClass = useMemo(
    () =>
      css`
        font-size: 1.45rem;
        font-weight: 700;
        color: ${Color.darkerGray()};
      `,
    []
  );

  const checklistHeaderClass = useMemo(
    () =>
      css`
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        background: ${Color.highlightGray(0.4)};
        border: 1px solid var(--ui-border);
        color: ${contentColor};
        font-weight: 800;
      `,
    [contentColor]
  );

  const checklistItemClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: flex-start;
        gap: 0.9rem;
        padding: 1rem 1.1rem;
        border-radius: ${borderRadius};
        background: ${Color.white()};
        border: 1px solid var(--ui-border);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      `,
    []
  );

  const chatWindowClass = useMemo(
    () =>
      css`
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        background: ${Color.highlightGray(0.5)};
        padding: 1.2rem;
        min-height: 24rem;
        max-height: 40rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        position: relative;
      `,
    []
  );

  const bubbleLabelClass = useMemo(
    () =>
      css`
        font-size: 1.2rem;
        font-weight: 700;
        color: ${Color.gray()};
        margin-bottom: 0.35rem;
        display: inline-flex;
        align-items: center;
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

  const handleApplyToAIChat = useCallback(
    async (target: 'zero' | 'ciel') => {
      if (!hasPrompt || applyingTarget) return;
      setError('');
      setApplyingTarget(target);
      try {
        const data = await applySystemPromptToAIChat({
          promptTitle: trimmedTitle || 'Custom Agent',
          systemPrompt: trimmedPrompt,
          target
        });
        if (data?.progress) {
          setProgress(data.progress);
        }
        if (typeof data?.missionPromptId === 'number') {
          const currentState = systemPromptStateRef.current;
          setSystemPromptState({
            ...currentState,
            missionPromptId: data.missionPromptId
          });
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          'Unable to export prompt to chat.';
        setError(message);
      } finally {
        setApplyingTarget(null);
      }
    },
    [
      applyingTarget,
      applySystemPromptToAIChat,
      hasPrompt,
      setSystemPromptState,
      trimmedPrompt,
      trimmedTitle
    ]
  );

  return (
    <ErrorBoundary componentPath="MissionModule/SystemPrompt">
      <div className={layoutClass} style={style}>
        <aside className={`${cardClass} ${checklistCardClass} ${sidebarClass}`}>
          <div
            className={`${sectionHeaderClass} ${css`
              margin-bottom: 0.2rem;
            `}`}
          >
            <div className={checklistHeaderClass}>
              <Icon icon="sparkles" color={Color.darkBlue()} />
              <span>Mission Checklist</span>
            </div>
            <span
              className={css`
                padding: 0.25rem 0.8rem;
                border-radius: 999px;
                border: 1px solid var(--ui-border);
                background: ${missionCleared
                  ? Color.green(0.12)
                  : Color.highlightGray(0.45)};
                color: ${missionCleared ? doneColor : contentColor};
                font-weight: 700;
                font-size: 1.1rem;
              `}
            >
              {missionCleared ? 'Complete' : 'In Progress'}
            </span>
          </div>
          <div
            className={css`
              margin: 0.4rem 0 0.8rem;
            `}
          >
            <ProgressBar
              progress={checklistProgress}
              text={`${checklistCompletedCount}/${checklistItems.length} done`}
              theme="logoBlue"
            />
          </div>
          {progressLoading ? (
            <Loading />
          ) : (
            <>
              {progressError && (
                <div
                  className={css`
                    color: ${Color.red()};
                    font-size: 1.2rem;
                  `}
                >
                  {progressError}
                </div>
              )}
              {checklistItems.map((item, idx) => (
                <div key={idx} className={checklistItemClass}>
                  <Icon
                    icon={item.complete ? 'check-circle' : 'circle'}
                    style={{
                      color: item.complete ? doneColor : Color.gray()
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: Color.black(),
                        fontSize: '1.45rem'
                      }}
                    >
                      {item.label}
                    </span>
                    <small style={{ color: Color.darkerGray() }}>
                      {item.detail}
                    </small>
                  </div>
                </div>
              ))}
            </>
          )}
          {missionCleared && (
            <TaskComplete
              style={{ marginTop: '0.5rem' }}
              taskId={mission.id}
              passMessage="Nice work! Collect your reward."
            />
          )}
        </aside>
        <div className={contentClass}>
          <section
            className={`${cardClass} ${css`
              display: flex;
              flex-direction: column;
              gap: 0.8rem;
            `}`}
          >
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
              Give your custom agent a memorable name or theme so you can share
              it later.
            </small>
          </section>
          <section
            className={`${cardClass} ${css`
              display: flex;
              flex-direction: column;
              gap: 0.8rem;
            `}`}
          >
            <div className={sectionHeaderClass}>
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
              style={{ width: '100%' }}
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
            className={`${cardClass} ${css`
              display: flex;
              flex-direction: column;
              gap: 1rem;
            `}`}
          >
            <div className={sectionHeaderClass}>
              <div className={labelClass}>Use with Zero or Ciel</div>
              <small
                style={{
                  color: Color.darkerGray()
                }}
              >
                {progress?.pendingPromptForChat?.target
                  ? `Exported to ${progress.pendingPromptForChat.target.toUpperCase()} chat (topic ${
                      progress.pendingPromptForChat.topicId || ''
                    })`
                  : 'Apply this prompt directly to an AI chat'}
              </small>
            </div>
            <div
              className={css`
                display: flex;
                gap: 0.8rem;
                flex-wrap: wrap;
              `}
            >
              <Button
                color="logoBlue"
                variant="soft"
                tone="raised"
                disabled={
                  !hasPrompt ||
                  applyingTarget === 'ciel' ||
                  sending ||
                  improving
                }
                onClick={() => handleApplyToAIChat('zero')}
              >
                {applyingTarget === 'zero' ? (
                  <>
                    <Icon
                      style={{ marginRight: '0.5rem' }}
                      icon="spinner"
                      pulse
                    />
                    Exporting to Zero...
                  </>
                ) : (
                  <>
                    <Icon style={{ marginRight: '0.5rem' }} icon="robot" />
                    Use with Zero
                  </>
                )}
              </Button>
              <Button
                color="purple"
                variant="soft"
                tone="raised"
                disabled={
                  !hasPrompt ||
                  applyingTarget === 'zero' ||
                  sending ||
                  improving
                }
                onClick={() => handleApplyToAIChat('ciel')}
              >
                {applyingTarget === 'ciel' ? (
                  <>
                    <Icon
                      style={{ marginRight: '0.5rem' }}
                      icon="spinner"
                      pulse
                    />
                    Exporting to Ciel...
                  </>
                ) : (
                  <>
                    <Icon style={{ marginRight: '0.5rem' }} icon="robot" />
                    Use with Ciel
                  </>
                )}
              </Button>
            </div>
            <small
              style={{
                color: Color.gray(),
                lineHeight: 1.4
              }}
            >
              We’ll tag the AI topic with this prompt so mission progress only
              counts when you chat in that topic.
            </small>
          </section>
          <section
            className={`${cardClass} ${css`
              display: flex;
              flex-direction: column;
              gap: 1.2rem;
            `}`}
          >
            <div className={sectionHeaderClass}>
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
                          : Color.skyBlue(0.1)};
                        color: ${Color.black()};
                        border: 1px solid var(--ui-border);
                        border-radius: ${borderRadius};
                        padding: 1rem 1.2rem;
                        max-width: 85%;
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
