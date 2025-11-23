import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useKeyContext } from '~/contexts';
import useSystemPromptSockets from './useSystemPromptSockets';
import Checklist from './Checklist';
import Editor from './Editor';
import TargetSelector from './TargetSelector';
import Preview from './Preview';

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
  const [saving, setSaving] = useState(false);

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
  const draftTimeoutRef = useRef<any>(null);

  const setSystemPromptState = useCallback(
    (nextState: SystemPromptState) => {
      onSetMissionState({
        missionId: mission.id,
        newState: { systemPromptState: nextState }
      });
    },
    [mission.id, onSetMissionState]
  );

  const {
    previewRequestIdRef,
    streamingMessageIdRef,
    improveRequestIdRef,
    improveOriginalPromptRef
  } = useSystemPromptSockets({
    systemPromptState,
    setSystemPromptState,
    setSending,
    setImproving,
    setError
  });

  const { title, prompt, userMessage, chatMessages } = systemPromptState;
  const trimmedPrompt = prompt.trim();
  const trimmedMessage = userMessage.trim();
  const trimmedTitle = title.trim();
  const hasPrompt = trimmedPrompt.length > 0;
  const canSend = Boolean(hasPrompt && trimmedMessage && !sending);
  const createdPrompt = useMemo(() => {
    const hasPreviewedLocally = chatMessages.some(
      (message) => message.role === 'assistant'
    );
    return !!progress?.previewed || hasPreviewedLocally;
  }, [chatMessages, progress?.previewed]);

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
          ? `${Math.min(
              sharedMessageCount,
              1
            )}/1 message in your cloned shared prompt`
          : 'Browse Shared Prompts, clone one, and send a message'
      }
    ],
    [
      aiMessageCount,
      createdPrompt,
      hasAiTopic,
      hasSharedTopic,
      sharedMessageCount
    ]
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
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    setSaving(true);
    clearTimeout(draftTimeoutRef.current);
    const isClearing = !trimmedTitle && !trimmedPrompt;
    draftTimeoutRef.current = setTimeout(
      () => {
        socket.emit('save_system_prompt_draft', {
          title: trimmedTitle,
          prompt: trimmedPrompt
        });
        setSaving(false);
      },
      isClearing ? 0 : 1000
    );
    return () => clearTimeout(draftTimeoutRef.current);
  }, [trimmedTitle, trimmedPrompt]);

  const handleImprovePrompt = useCallback(() => {
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
  }, [
    hasPrompt,
    improving,
    prompt,
    trimmedTitle,
    trimmedPrompt,
    improveOriginalPromptRef,
    improveRequestIdRef
  ]);

  const handleSendMessage = useCallback(() => {
    if (!canSend) return;
    setError('');
    const userMessageObj: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmedMessage
    };
    const baseMessages = [...chatMessages, userMessageObj];
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
  }, [
    canSend,
    chatMessages,
    trimmedMessage,
    systemPromptState,
    setSystemPromptState,
    streamingMessageIdRef,
    previewRequestIdRef,
    trimmedTitle,
    trimmedPrompt
  ]);

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
          setSystemPromptState({
            ...systemPromptState,
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
      systemPromptState,
      trimmedPrompt,
      trimmedTitle
    ]
  );

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

  // Progressive reveal logic
  const showEditor = true; // Always show title/prompt editor
  const showPreview = !!(trimmedTitle && hasPrompt); // Only show preview if title & prompt exist
  const showTargetSelector = !!createdPrompt; // Show export only after testing in preview

  return (
    <ErrorBoundary componentPath="MissionModule/SystemPrompt">
      <div className={layoutClass} style={style}>
        <Checklist
          checklistItems={checklistItems}
          missionCleared={!!missionCleared}
          progressLoading={progressLoading}
          progressError={progressError}
          doneColor={doneColor}
          contentColor={contentColor}
          missionId={mission.id}
          className={sidebarClass}
        />
        <div className={contentClass}>
          {showEditor && (
            <Editor
              title={title}
              prompt={prompt}
              improving={improving}
              hasPrompt={hasPrompt}
              saving={saving}
              onTitleChange={(text) =>
                setSystemPromptState({
                  ...systemPromptState,
                  title: text
                })
              }
              onPromptChange={(text) =>
                setSystemPromptState({
                  ...systemPromptState,
                  prompt: text
                })
              }
              onImprovePrompt={handleImprovePrompt}
            />
          )}

          {showPreview && (
            <Preview
              chatMessages={chatMessages}
              error={error}
              userMessage={userMessage}
              hasPrompt={hasPrompt}
              canSend={canSend}
              sending={sending}
              trimmedTitle={trimmedTitle}
              messageListRef={messageListRef}
              onClear={() => {
                setError('');
                setSystemPromptState({
                  ...systemPromptState,
                  chatMessages: []
                });
              }}
              onUserMessageChange={(text) =>
                setSystemPromptState({
                  ...systemPromptState,
                  userMessage: text
                })
              }
              onSendMessage={handleSendMessage}
            />
          )}

          {showTargetSelector && (
            <TargetSelector
              hasPrompt={hasPrompt}
              applyingTarget={applyingTarget}
              sending={sending}
              improving={improving}
              progress={progress}
              onApplyToAIChat={handleApplyToAIChat}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
