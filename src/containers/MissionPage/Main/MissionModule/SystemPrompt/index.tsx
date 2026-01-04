import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useMissionContext
} from '~/contexts';
import useSystemPromptSockets from './useSystemPromptSockets';
import Checklist from './Checklist';
import Editor from './Editor';
import TargetSelector from './TargetSelector';
import Preview from './Preview';
import TaskComplete from '../components/TaskComplete';
import MissionStatusCard from '~/components/MissionStatusCard';

const layoutClass = css`
  display: grid;
  grid-template-columns: minmax(26rem, 30rem) 1fr;
  gap: 1.5rem;
  align-items: flex-start;
  width: 100%;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
`;

const sidebarClass = css`
  position: sticky;
  top: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    position: static;
  }
`;

const contentClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

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
  const [generating, setGenerating] = useState(false);
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
  const onSetThinkHardForTopic = useChatContext(
    (v) => v.actions.onSetThinkHardForTopic
  );
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const onResetSystemPromptStateForUser = useMissionContext(
    (v) => v.actions.onResetSystemPromptStateForUser
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);

  const myAttempt = useMemo(
    () => myAttempts?.[mission.id],
    [myAttempts, mission.id]
  );

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
      chatMessages: sanitizedMessages,
      promptEverGenerated: !!rawState.promptEverGenerated
    };
  }, [mission.systemPromptState]);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const draftTimeoutRef = useRef<any>(null);
  const hasSetPromptEverGeneratedRef = useRef(false);

  // Reset state when user changes
  useEffect(() => {
    if (userId && mission.prevUserId && userId !== mission.prevUserId) {
      hasSetPromptEverGeneratedRef.current = false;
      onResetSystemPromptStateForUser({ missionId: mission.id, userId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, mission.prevUserId, mission.id]);

  const {
    previewRequestIdRef,
    streamingMessageIdRef,
    improveRequestIdRef,
    improveOriginalPromptRef,
    generateRequestIdRef
  } = useSystemPromptSockets({
    systemPromptState,
    onSetSystemPromptState: handleSetSystemPromptState,
    onSetSending: setSending,
    onSetImproving: setImproving,
    onSetGenerating: setGenerating,
    onSetError: setError
  });

  const { title, prompt, userMessage, chatMessages, promptEverGenerated } =
    systemPromptState;
  const trimmedPrompt = prompt.trim();
  const trimmedMessage = userMessage.trim();
  const trimmedTitle = title.trim();
  const hasPrompt = trimmedPrompt.length > 0;

  useEffect(() => {
    // Sync ref with state if already true (e.g., loaded from server)
    if (promptEverGenerated) {
      hasSetPromptEverGeneratedRef.current = true;
      return;
    }
    if (
      hasPrompt &&
      !generating &&
      !improving &&
      !hasSetPromptEverGeneratedRef.current
    ) {
      hasSetPromptEverGeneratedRef.current = true;
      handleSetSystemPromptState({
        ...systemPromptState,
        promptEverGenerated: true
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPrompt, promptEverGenerated, generating, improving]);
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
  const aiTopicId =
    progress?.pendingPromptForChat?.topicId || progress?.aiTopic?.id || null;
  const hasSharedTopic = Boolean(progress?.sharedTopic?.id);

  // Mission is cleared when step 3 is complete
  // (step 3 completion implies steps 1 and 2 were done at some point)
  const missionCleared =
    myAttempt?.status === 'pass' || (hasSharedTopic && sharedMessageCount >= 1);

  const isMissionPassed = myAttempt?.status === 'pass';

  // Progress on later steps implies earlier steps are complete
  // (you can't reach step 3 without doing steps 1 and 2)
  const step3HasProgress = hasSharedTopic;
  const step2HasProgress =
    hasAiTopic || Boolean(progress?.pendingPromptForChat?.topicId);

  const step1Complete =
    isMissionPassed || createdPrompt || step2HasProgress || step3HasProgress;
  const step2Complete =
    isMissionPassed ||
    (hasAiTopic && aiMessageCount >= 2) ||
    step3HasProgress;
  const step3Complete =
    isMissionPassed || (hasSharedTopic && sharedMessageCount >= 1);

  const checklistItems = useMemo(
    () => [
      {
        label: 'Draft and test a system prompt',
        complete: step1Complete,
        detail: step1Complete
          ? 'Prompt created and previewed'
          : 'Create a prompt and preview it with a test message'
      },
      {
        label: 'Use it with Zero or Ciel',
        complete: step2Complete,
        detail: step2Complete
          ? '2/2 messages in your AI topic'
          : aiTopicId
          ? `${Math.min(
              aiMessageCount,
              2
            )}/2 messages in your AI topic (Topic ID: ${aiTopicId})`
          : 'Apply the prompt to a Zero/Ciel topic and send 2+ messages'
      },
      {
        label: `Clone a shared prompt`,
        complete: step3Complete,
        detail: step3Complete
          ? '1/1 message in your cloned shared prompt'
          : 'Browse Shared Prompts, clone one, and send a message'
      }
    ],
    [
      step1Complete,
      step2Complete,
      step3Complete,
      aiTopicId,
      aiMessageCount
    ]
  );

  useEffect(() => {
    let mounted = true;
    async function loadProgress() {
      try {
        const data = await loadSystemPromptProgress();
        if (!mounted) return;
        setProgress(data || {});
        const newState: any = { systemPromptProgress: data || {} };
        if (
          data?.systemPromptState &&
          (!mission.systemPromptState?.prompt ||
            !mission.systemPromptState?.title)
        ) {
          newState.systemPromptState = data.systemPromptState;
        }
        onSetMissionState({
          missionId: mission.id,
          newState
        });
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
  }, [mission.id]);

  // Poll for progress updates while mission is not cleared
  useEffect(() => {
    if (missionCleared) return;

    let mounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const data = await loadSystemPromptProgress();
        if (!mounted) return;
        setProgress(data || {});
        onSetMissionState({
          missionId: mission.id,
          newState: { systemPromptProgress: data || {} }
        });
      } catch (error) {
        // Silently fail on polling errors to avoid disrupting UX
        if (mounted) {
          console.error('Failed to poll mission progress:', error);
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionCleared, mission.id]);

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

  // Progressive reveal logic (hide everything except checklist after mission is passed)
  const showEditor = !missionCleared;
  const showPreview = !missionCleared && !!(trimmedTitle && hasPrompt);
  const showTargetSelector = !missionCleared && !!createdPrompt;

  return (
    <ErrorBoundary componentPath="MissionModule/SystemPrompt">
      <div className={layoutClass} style={style}>
        <ErrorBoundary componentPath="MissionModule/SystemPrompt/Checklist">
          <Checklist
            checklistItems={checklistItems}
            missionCleared={!!missionCleared}
            progressLoading={progressLoading}
            progressError={progressError}
            themeColor={profileTheme}
            className={sidebarClass}
          />
        </ErrorBoundary>
        <div className={contentClass}>
          {showEditor && (
            <ErrorBoundary componentPath="MissionModule/SystemPrompt/Editor">
              <Editor
                title={title}
                prompt={prompt}
                improving={improving}
                generating={generating}
                hasPrompt={hasPrompt}
                promptEverGenerated={!!promptEverGenerated}
                missionCleared={!!missionCleared}
                saving={saving}
                onTitleChange={(text) =>
                  handleSetSystemPromptState({
                    ...systemPromptState,
                    title: text
                  })
                }
                onPromptChange={(text) =>
                  handleSetSystemPromptState({
                    ...systemPromptState,
                    prompt: text
                  })
                }
                onImprovePrompt={handleImprovePrompt}
                onGeneratePrompt={handleGeneratePrompt}
              />
            </ErrorBoundary>
          )}

          {showPreview && (
            <ErrorBoundary componentPath="MissionModule/SystemPrompt/Preview">
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
                  handleSetSystemPromptState({
                    ...systemPromptState,
                    chatMessages: []
                  });
                }}
                onUserMessageChange={(text) =>
                  handleSetSystemPromptState({
                    ...systemPromptState,
                    userMessage: text
                  })
                }
                onSendMessage={handleSendMessage}
              />
            </ErrorBoundary>
          )}

          {showTargetSelector && (
            <ErrorBoundary componentPath="MissionModule/SystemPrompt/TargetSelector">
              <TargetSelector
                hasPrompt={hasPrompt}
                applyingTarget={applyingTarget}
                sending={sending}
                improving={improving}
                generating={generating}
                progress={progress}
                hasAiTopic={hasAiTopic}
                aiMessageCount={aiMessageCount}
                hasSharedTopic={hasSharedTopic}
                missionType={mission.missionType}
                isMissionPassed={isMissionPassed}
                onApplyToAIChat={handleApplyToAIChat}
              />
            </ErrorBoundary>
          )}
          {isMissionPassed && (
            <div
              className={css`
                display: flex;
                justify-content: center;
                width: 100%;
                margin-top: 1rem;
              `}
            >
              <MissionStatusCard
                status="success"
                title="Mission Accomplished"
                message="You've mastered creating and using custom system prompts!"
                rewards={{
                  xp: mission.xpReward,
                  coins: mission.coinReward
                }}
              />
            </div>
          )}
          <TaskComplete
            taskId={mission.id}
            allTasksComplete={checklistItems.every((item) => item.complete)}
            style={{ marginTop: '1rem' }}
          />
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleSendMessage() {
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
    handleSetSystemPromptState(nextState);
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

  function handleGeneratePrompt() {
    if (!trimmedTitle || generating) return;
    setError('');
    setGenerating(true);
    // Clear chatMessages so user must re-preview the new prompt
    handleSetSystemPromptState({
      ...systemPromptState,
      promptEverGenerated: true,
      chatMessages: [],
      userMessage: ''
    });
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    generateRequestIdRef.current = requestId;
    socket.emit('generate_custom_instructions', {
      requestId,
      topicText: trimmedTitle
    });
  }

  async function handleApplyToAIChat(target: 'zero' | 'ciel') {
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
        handleSetSystemPromptState({
          ...systemPromptState,
          missionPromptId: data.missionPromptId
        });
      }
      // Set thinkHard to false for the new topic
      if (typeof data?.topicId === 'number') {
        onSetThinkHardForTopic({
          aiType: target,
          topicId: data.topicId,
          thinkHard: false
        });
        // Also persist to localStorage
        try {
          const stored = localStorage.getItem('thinkHard') || '{}';
          const parsed = JSON.parse(stored);
          const updated = {
            ...parsed,
            [target]: {
              ...(parsed[target] || {}),
              [data.topicId]: false
            }
          };
          localStorage.setItem('thinkHard', JSON.stringify(updated));
        } catch {
          // Ignore localStorage errors
        }
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
  }

  function handleSetSystemPromptState(nextState: SystemPromptState) {
    onSetMissionState({
      missionId: mission.id,
      newState: { systemPromptState: nextState }
    });
  }
}
