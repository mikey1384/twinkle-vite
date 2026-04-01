import React, { RefObject, useMemo, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import RichText from '~/components/Texts/RichText';
import ThinkingIndicator from '~/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator';
import CodeDiff from '~/components/CodeDiff';
import ProgressBar from '~/components/ProgressBar';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import { css } from '@emotion/css';
import { useViewContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { computeLineDiff } from '~/components/CodeDiff/diffUtils';
import { useLazyLoad } from '~/helpers/hooks';
import { useInView } from 'react-intersection-observer';
import GameCTAButton from '~/components/Buttons/GameCTAButton';

const panelClass = css`
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid var(--ui-border);
  background: #fff;
  gap: 0.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    border-right: none;
    border-bottom: 1px solid var(--ui-border);
  }
`;

const headerClass = css`
  min-height: var(--build-workspace-header-height);
  padding: 0.55rem 1rem 0 1rem;
  background: #fff;
  display: grid;
  align-items: center;
  row-gap: 0.4rem;
  border-bottom: 1px solid var(--ui-border);
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.9rem 1rem;
  }
`;

const headerTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 800;
  color: var(--chat-text);
  font-size: 1.1rem;
`;


interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  codeGenerated: string | null;
  streamCodePreview?: string | null;
  artifactVersionId?: number | null;
  createdAt: number;
}

interface BuildUsageMetric {
  stage: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface BuildCopilotPolicy {
  limits: {
    maxProjectBytes: number;
    maxFilesPerProject: number;
    maxFileLines: number;
  };
  usage: {
    currentProjectBytes: number;
    projectBytesRemaining: number;
    projectFileCount: number;
    projectFileBytes: number;
    maxFilesPerProject: number;
  };
  requestLimits: {
    dayIndex: number;
    dayKey: string;
    generationRequestsPerDay: number;
    generationRequestsToday: number;
    generationRequestsRemaining: number;
  };
}

interface BuildRunEvent {
  id: string;
  kind: 'lifecycle' | 'phase' | 'action' | 'status' | 'usage';
  phase: string | null;
  message: string;
  createdAt: number;
  deduped?: boolean;
  usage?: {
    stage?: string | null;
    model?: string | null;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
}

interface BuildProjectFileDiff {
  addedPaths: string[];
  updatedPaths: string[];
  deletedPaths: string[];
}

interface BuildProjectFileChangeLog {
  id: number;
  buildId: number;
  actorRole: 'user' | 'assistant' | 'system';
  summaryText: string;
  diff: BuildProjectFileDiff;
  createdAt: number;
}

type ChatPanelTab = 'chat' | 'debug';

interface BuildExecutionPlanSummary {
  status: 'active' | 'completed' | 'cancelled';
}

interface LimitProgressItem {
  id: string;
  label: string;
  progress: number;
  text: string;
  caption?: string;
  color?: string;
}

interface ChatPanelProps {
  className?: string;
  messages: ChatMessage[];
  executionPlan?: BuildExecutionPlanSummary | null;
  generating: boolean;
  generatingStatus: string | null;
  assistantStatusSteps: string[];
  usageMetrics: Record<string, BuildUsageMetric>;
  copilotPolicy: BuildCopilotPolicy | null;
  projectFileChangeLogs: BuildProjectFileChangeLog[];
  projectFilePromptContextPreview: string;
  projectFileChangeLogsLoading: boolean;
  projectFileChangeLogsError: string;
  projectFileChangeLogsLoadedAt: number | null;
  runEvents: BuildRunEvent[];
  activeStreamMessageIds: number[];
  isOwner: boolean;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onChatScroll: () => void;
  onSendMessage: (message: string) => Promise<boolean> | boolean;
  onSendPresetMessage: (message: string) => void;
  onStopGeneration: () => void;
  onReloadProjectFileChangeLogs: (options?: { silent?: boolean }) => Promise<void>;
  onDeleteMessage: (message: ChatMessage) => void;
}

export default function ChatPanel({
  className,
  messages,
  executionPlan,
  generating,
  generatingStatus,
  assistantStatusSteps,
  usageMetrics,
  copilotPolicy,
  projectFileChangeLogs,
  projectFilePromptContextPreview,
  projectFileChangeLogsLoading,
  projectFileChangeLogsError,
  projectFileChangeLogsLoadedAt,
  runEvents,
  activeStreamMessageIds,
  isOwner,
  chatScrollRef,
  chatEndRef,
  onChatScroll,
  onSendMessage,
  onSendPresetMessage,
  onStopGeneration,
  onReloadProjectFileChangeLogs,
  onDeleteMessage
}: ChatPanelProps) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const AI_DISABLED_NOTICE = useViewContext((v) => v.state.aiDisabledNotice);
  const [activeTab, setActiveTab] = useState<ChatPanelTab>('chat');
  const [limitsExpanded, setLimitsExpanded] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const aiInputDisabled = AI_FEATURES_DISABLED;
  const usageRows = useMemo(() => {
    const stageOrder = ['planner', 'codex', 'narration'];
    return Object.values(usageMetrics).sort((a, b) => {
      const aIndex = stageOrder.indexOf(a.stage);
      const bIndex = stageOrder.indexOf(b.stage);
      if (aIndex === -1 && bIndex === -1) return a.stage.localeCompare(b.stage);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [usageMetrics]);

  const usageTotals = useMemo(() => {
    return usageRows.reduce(
      (acc, row) => {
        acc.inputTokens += row.inputTokens || 0;
        acc.outputTokens += row.outputTokens || 0;
        acc.totalTokens += row.totalTokens || 0;
        return acc;
      },
      {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      }
    );
  }, [usageRows]);
  const usageShowsMultipleModels = useMemo(
    () =>
      new Set(
        usageRows
          .map((row) => row.model.trim())
          .filter((model) => Boolean(model))
      ).size > 1,
    [usageRows]
  );
  const debugRunEvents = useMemo(
    () =>
      runEvents
        .filter((event) => event.kind !== 'usage' && event.kind !== 'phase')
        .slice(-10),
    [runEvents]
  );
  const currentActivityMessage = useMemo(() => {
    for (let index = runEvents.length - 1; index >= 0; index -= 1) {
      const event = runEvents[index];
      if (!event) continue;
      const message = String(event.message || '').trim();
      if (!message) continue;
      if (event.kind === 'action' || event.kind === 'status') {
        return message;
      }
    }
    return null;
  }, [runEvents]);

  const expandedLimitItems = useMemo(() => {
    if (!copilotPolicy) return [];
    const { limits, usage } = copilotPolicy;
    return [
      buildLimitProgressItem({
        id: 'project-size',
        label: 'Current project size',
        used: usage.currentProjectBytes,
        limit: limits.maxProjectBytes,
        text: `${formatBytes(usage.currentProjectBytes)} / ${formatBytes(limits.maxProjectBytes)}`,
        caption: `${formatBytes(usage.projectBytesRemaining)} left`,
        color: 'pink'
      }),
      buildLimitProgressItem({
        id: 'project-files',
        label: 'Files in this project',
        used: usage.projectFileCount,
        limit: limits.maxFilesPerProject,
        text: `${formatTokenCount(usage.projectFileCount)} / ${formatTokenCount(limits.maxFilesPerProject)} files`,
        color: 'logoBlue'
      })
    ].filter(Boolean) as LimitProgressItem[];
  }, [copilotPolicy]);
  const dailyGenerationUsage = useMemo(() => {
    if (!copilotPolicy) return null;
    const requestLimits = copilotPolicy.requestLimits;
    if (requestLimits.generationRequestsPerDay <= 0) return null;
    return Math.max(
      0,
      Math.min(
        100,
        (requestLimits.generationRequestsToday /
          requestLimits.generationRequestsPerDay) *
          100
      )
    );
  }, [copilotPolicy]);
  const dailyGenerationBarText = useMemo(() => {
    if (!copilotPolicy) return null;
    const requestLimits = copilotPolicy.requestLimits;
    if (requestLimits.generationRequestsPerDay <= 0) return null;
    return `${formatTokenCount(requestLimits.generationRequestsToday)} / ${formatTokenCount(requestLimits.generationRequestsPerDay)} generations`;
  }, [copilotPolicy]);
  const dailyLimitSummary = useMemo(() => {
    if (!copilotPolicy) return null;
    const requestLimits = copilotPolicy.requestLimits;
    const parts: string[] = [];
    if (requestLimits.generationRequestsPerDay > 0) {
      parts.push(
        `${formatTokenCount(requestLimits.generationRequestsRemaining)} code generations left today`
      );
    }
    return parts.length > 0 ? parts.join(' • ') : null;
  }, [copilotPolicy]);
  const hasPromptContextPreview = Boolean(
    projectFilePromptContextPreview && projectFilePromptContextPreview.trim()
  );
  const hasProjectFileChangeLogs = projectFileChangeLogs.length > 0;
  const showDebugEmptyState =
    !projectFileChangeLogsError &&
    usageRows.length === 0 &&
    debugRunEvents.length === 0 &&
    !hasPromptContextPreview &&
    !hasProjectFileChangeLogs;
  const showScopedPlanQuickReplies =
    isOwner &&
    activeTab === 'chat' &&
    executionPlan?.status === 'active' &&
    !generating &&
    !draftMessage.trim();

  function handleTabChange(nextTab: ChatPanelTab) {
    if (nextTab === activeTab) return;
    setActiveTab(nextTab);
    if (
      nextTab === 'debug' &&
      !projectFileChangeLogsLoading &&
      !projectFileChangeLogsLoadedAt
    ) {
      void onReloadProjectFileChangeLogs();
    }
    if (nextTab === 'chat') {
      requestAnimationFrame(scrollChatToBottom);
    }
  }

  function handleRefreshCopilotDebug() {
    void onReloadProjectFileChangeLogs();
  }

  function handleToggleLimitsExpanded() {
    setLimitsExpanded((prev) => !prev);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmitMessage();
    }
  }

  function handlePrefillRedirect() {
    setDraftMessage('No. Instead, ');
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      const value = input.value || '';
      input.setSelectionRange(value.length, value.length);
    });
  }

  async function handleSubmitMessage() {
    const messageText = draftMessage.trim();
    if (!messageText) return;
    try {
      const didAccept = await Promise.resolve(onSendMessage(messageText));
      if (didAccept) {
        setDraftMessage('');
      }
    } catch (error) {
      console.error('Failed to send build message:', error);
    }
  }

  function scrollChatToBottom() {
    const container = chatScrollRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'auto'
      });
      return;
    }
    chatEndRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'end',
      inline: 'nearest'
    });
  }

  return (
    <div className={className ? `${panelClass} ${className}` : panelClass}>
      <div className={headerClass}>
        <div className={headerTitleClass}>
          <Icon icon="sparkles" />
          Lumine
        </div>
        {copilotPolicy && (
          <div
            className={css`
              margin-top: 0.4rem;
              margin-bottom: 1rem;
              border: 1px solid var(--ui-border);
              border-radius: 10px;
              background: var(--chat-bg);
              padding: 0.7rem 0.75rem 0.95rem;
              display: flex;
              flex-direction: column;
              gap: 0.6rem;
              font-size: 0.86rem;
              color: var(--chat-text);
            `}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.4rem;
              `}
            >
              <span
                className={css`
                  font-weight: 800;
                  opacity: 0.85;
                `}
              >
                Daily limit
              </span>
            </div>
            {dailyGenerationUsage != null && dailyGenerationBarText && (
              <>
                <div
                  className={css`
                    font-size: 0.88rem;
                    font-weight: 700;
                  `}
                >
                  Code generations
                </div>
                <ProgressBar
                  progress={dailyGenerationUsage}
                  text={dailyGenerationBarText}
                  style={{ marginTop: '-0.2rem' }}
                />
              </>
            )}
            {limitsExpanded && (
              <>
                <div
                  className={css`
                    margin-top: 0.1rem;
                    padding-top: 0.2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                  `}
                >
                  <div
                    className={css`
                      display: grid;
                      grid-template-columns: repeat(2, minmax(0, 1fr));
                      gap: 0.8rem;
                      @media (max-width: ${mobileMaxWidth}) {
                        grid-template-columns: 1fr;
                      }
                    `}
                  >
                    {expandedLimitItems.map((item) => (
                      <div
                        key={item.id}
                        className={css`
                          border: 1px solid var(--ui-border);
                          border-radius: 12px;
                          background: #fff;
                          padding: 0.9rem 0.95rem 0.8rem;
                        `}
                      >
                        <div
                          className={css`
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 0.6rem;
                            margin-bottom: 0.35rem;
                          `}
                        >
                          <span
                            className={css`
                              font-size: 0.92rem;
                              font-weight: 800;
                              color: var(--chat-text);
                            `}
                          >
                            {item.label}
                          </span>
                          <span
                            className={css`
                              font-size: 0.74rem;
                              font-family:
                                'SF Mono',
                                'Menlo',
                                'Consolas',
                                monospace;
                              color: var(--chat-text);
                              opacity: 0.7;
                            `}
                          >
                            {Math.round(item.progress)}%
                          </span>
                        </div>
                        <ProgressBar
                          progress={item.progress}
                          text={item.text}
                          color={item.color}
                          style={{ marginTop: '-0.15rem' }}
                        />
                        {item.caption ? (
                          <div
                            className={css`
                              margin-top: 0.38rem;
                              font-size: 0.75rem;
                              line-height: 1.35;
                              color: var(--chat-text);
                              opacity: 0.68;
                            `}
                          >
                            {item.caption}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div
                    className={css`
                      border: 1px solid var(--ui-border);
                      border-radius: 12px;
                      background: #fff;
                      padding: 0.95rem 1rem;
                      display: grid;
                      grid-template-columns: repeat(2, minmax(0, 1fr));
                      gap: 0.7rem 1rem;
                      @media (max-width: ${mobileMaxWidth}) {
                        grid-template-columns: 1fr;
                      }
                    `}
                  >
                    <LimitStat
                      label="Single file max"
                      value={`${formatTokenCount(
                        copilotPolicy.limits.maxFileLines
                      )} lines`}
                    />
                  </div>
                </div>
              </>
            )}
            <div
              className={css`
                display: flex;
                justify-content: center;
                padding-top: 0.65rem;
              `}
            >
              <button
                type="button"
                onClick={handleToggleLimitsExpanded}
                className={css`
                  border: 1px solid var(--ui-border);
                  background: #fff;
                  color: var(--chat-text);
                  border-radius: 999px;
                  min-width: 8.5rem;
                  padding: 0.42rem 1.1rem;
                  font-size: 0.72rem;
                  font-weight: 800;
                  cursor: pointer;
                  transition: border-color 0.15s ease, transform 0.15s ease;
                  &:hover,
                  &:focus-visible {
                    border-color: var(--theme-border);
                    transform: translateY(-1px);
                  }
                `}
              >
                {limitsExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
          </div>
        )}
      </div>
      <div
        className={css`
          padding: 0 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
        `}
      >
        <SegmentedToggle<ChatPanelTab>
          value={activeTab}
          onChange={handleTabChange}
          options={[
            { value: 'chat', label: 'Chat', icon: 'comments' },
            { value: 'debug', label: 'Debug', icon: 'brain' }
          ]}
          size="sm"
          ariaLabel="Lumine panel tab"
        />
      </div>
      <div
        ref={chatScrollRef}
        onScroll={onChatScroll}
        className={css`
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 1.2rem;
          background: #fff;
          min-height: 0;
        `}
      >
        <BuildChatTranscript
          activeTab={activeTab}
          messages={messages}
          generating={generating}
          generatingStatus={generatingStatus}
          assistantStatusSteps={assistantStatusSteps}
          currentActivityMessage={currentActivityMessage}
          usageRows={usageRows}
          usageTotals={usageTotals}
          usageShowsMultipleModels={usageShowsMultipleModels}
          debugRunEvents={debugRunEvents}
          projectFileChangeLogs={projectFileChangeLogs}
          projectFilePromptContextPreview={projectFilePromptContextPreview}
          projectFileChangeLogsLoading={projectFileChangeLogsLoading}
          projectFileChangeLogsError={projectFileChangeLogsError}
          projectFileChangeLogsLoadedAt={projectFileChangeLogsLoadedAt}
          activeStreamMessageIds={activeStreamMessageIds}
          isOwner={isOwner}
          chatEndRef={chatEndRef}
          hasPromptContextPreview={hasPromptContextPreview}
          hasProjectFileChangeLogs={hasProjectFileChangeLogs}
          showDebugEmptyState={showDebugEmptyState}
          onDeleteMessage={onDeleteMessage}
          onReloadProjectFileChangeLogs={handleRefreshCopilotDebug}
        />
      </div>

      {isOwner && activeTab === 'chat' && !limitsExpanded && (
        <div
          className={css`
            padding: 0.9rem 1rem 1.1rem;
            background: #fff;
          `}
        >
          {showScopedPlanQuickReplies && (
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                gap: 0.45rem;
                margin-bottom: 0.7rem;
              `}
            >
              <button
                type="button"
                onClick={() => onSendPresetMessage('Yes, continue.')}
                className={css`
                  border: 1px solid rgba(36, 99, 235, 0.18);
                  background: rgba(59, 130, 246, 0.08);
                  color: #1d4ed8;
                  border-radius: 999px;
                  padding: 0.42rem 0.82rem;
                  font-size: 0.82rem;
                  font-weight: 800;
                  cursor: pointer;
                `}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => onSendPresetMessage('No, stop this plan.')}
                className={css`
                  border: 1px solid rgba(148, 163, 184, 0.28);
                  background: rgba(148, 163, 184, 0.1);
                  color: #334155;
                  border-radius: 999px;
                  padding: 0.42rem 0.82rem;
                  font-size: 0.82rem;
                  font-weight: 800;
                  cursor: pointer;
                `}
              >
                No
              </button>
              <button
                type="button"
                onClick={handlePrefillRedirect}
                className={css`
                  border: 1px solid rgba(217, 119, 6, 0.2);
                  background: rgba(245, 158, 11, 0.11);
                  color: #b45309;
                  border-radius: 999px;
                  padding: 0.42rem 0.82rem;
                  font-size: 0.82rem;
                  font-weight: 800;
                  cursor: pointer;
                `}
              >
                No (explain what you want instead)
              </button>
            </div>
          )}
          {aiInputDisabled && (
            <AIDisabledNotice
              title="Build AI Is Unavailable"
              style={{ marginBottom: '0.6rem' }}
            />
          )}
          <div
            className={css`
              display: flex;
              gap: 0.5rem;
            `}
          >
            <textarea
              ref={inputRef}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                aiInputDisabled
                  ? AI_DISABLED_NOTICE
                  : generating
                    ? 'Describe what to change next...'
                    : 'Describe what you want to build...'
              }
              disabled={aiInputDisabled}
              className={css`
                flex: 1;
                padding: 0.75rem;
                border: 1px solid var(--ui-border);
                border-radius: 10px;
                resize: none;
                font-size: 0.95rem;
                font-family: inherit;
                min-height: 44px;
                max-height: 120px;
                background: #fff;
                &:focus {
                  outline: none;
                  border-color: var(--theme-border);
                }
              `}
              rows={1}
            />
            <GameCTAButton
              onClick={() => void handleSubmitMessage()}
              disabled={aiInputDisabled || !draftMessage.trim()}
              variant={generating ? 'orange' : 'logoBlue'}
              size="md"
              icon="paper-plane"
              style={{ minWidth: '3rem' }}
            />
            {generating && (
              <GameCTAButton
                onClick={onStopGeneration}
                variant="orange"
                size="md"
                icon="stop"
                style={{ minWidth: '3rem' }}
              />
            )}
          </div>
          {copilotPolicy && dailyLimitSummary && (
            <div
              className={css`
                margin-top: 0.42rem;
                display: flex;
                justify-content: flex-end;
                font-size: 0.72rem;
              `}
            >
              <span
                className={css`
                  color: var(--chat-text);
                  opacity: 0.72;
                  font-weight: 700;
                `}
              >
                {dailyLimitSummary}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const BuildChatTranscript = React.memo(function BuildChatTranscript({
  activeTab,
  messages,
  generating,
  generatingStatus,
  assistantStatusSteps,
  currentActivityMessage,
  usageRows,
  usageTotals,
  usageShowsMultipleModels,
  debugRunEvents,
  projectFileChangeLogs,
  projectFilePromptContextPreview,
  projectFileChangeLogsLoading,
  projectFileChangeLogsError,
  projectFileChangeLogsLoadedAt,
  activeStreamMessageIds,
  isOwner,
  chatEndRef,
  hasPromptContextPreview,
  hasProjectFileChangeLogs,
  showDebugEmptyState,
  onDeleteMessage,
  onReloadProjectFileChangeLogs
}: {
  activeTab: ChatPanelTab;
  messages: ChatMessage[];
  generating: boolean;
  generatingStatus: string | null;
  assistantStatusSteps: string[];
  currentActivityMessage: string | null;
  usageRows: BuildUsageMetric[];
  usageTotals: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  usageShowsMultipleModels: boolean;
  debugRunEvents: BuildRunEvent[];
  projectFileChangeLogs: BuildProjectFileChangeLog[];
  projectFilePromptContextPreview: string;
  projectFileChangeLogsLoading: boolean;
  projectFileChangeLogsError: string;
  projectFileChangeLogsLoadedAt: number | null;
  activeStreamMessageIds: number[];
  isOwner: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  hasPromptContextPreview: boolean;
  hasProjectFileChangeLogs: boolean;
  showDebugEmptyState: boolean;
  onDeleteMessage: (message: ChatMessage) => void;
  onReloadProjectFileChangeLogs: () => void;
}) {
  if (activeTab === 'chat') {
    if (messages.length === 0) {
      return (
        <div
          className={css`
            min-height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 1.5rem;
            color: var(--chat-text);
            opacity: 0.7;
          `}
        >
          <Icon
            icon="comments"
            size="2x"
            style={{ marginBottom: '0.8rem' }}
          />
          <p style={{ margin: 0, fontSize: '1.05rem' }}>
            {isOwner
              ? 'Describe what you want to build and I will help you create it.'
              : 'No messages yet.'}
          </p>
        </div>
      );
    }

    const lastAssistantIndex = findLastIndex(
      messages,
      (message) => message.role === 'assistant'
    );

    return (
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1rem;
        `}
      >
        {messages.map((message, index) => {
          return (
            <BuildChatMessageRow
              key={message.id}
              message={message}
              messages={messages}
              index={index}
              lastAssistantIndex={lastAssistantIndex}
              generating={generating}
              generatingStatus={generatingStatus}
              assistantStatusSteps={assistantStatusSteps}
              currentActivityMessage={currentActivityMessage}
              activeStreamMessageIds={activeStreamMessageIds}
              onDeleteMessage={onDeleteMessage}
            />
          );
        })}
        <div ref={chatEndRef} />
      </div>
    );
  }

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.6rem;
          flex-wrap: wrap;
        `}
      >
        <div
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            font-size: 0.72rem;
            font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
            opacity: 0.8;
          `}
        >
          {projectFileChangeLogsLoadedAt ? (
            <span>Updated {formatRunEventTime(projectFileChangeLogsLoadedAt)}</span>
          ) : null}
          <button
            type="button"
            onClick={onReloadProjectFileChangeLogs}
            disabled={projectFileChangeLogsLoading}
            className={css`
              border: 1px solid var(--ui-border);
              background: #fff;
              color: var(--chat-text);
              border-radius: 999px;
              padding: 0.22rem 0.55rem;
              font-size: 0.68rem;
              font-weight: 700;
              cursor: pointer;
              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            `}
          >
            {projectFileChangeLogsLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      {projectFileChangeLogsError ? (
        <div
          className={css`
            border: 1px solid ${Color.rose(0.35)};
            background: ${Color.rose(0.07)};
            color: ${Color.rose(0.95)};
            border-radius: 10px;
            padding: 0.6rem 0.7rem;
            font-size: 0.8rem;
          `}
        >
          {projectFileChangeLogsError}
        </div>
      ) : null}
      {(usageRows.length > 0 || debugRunEvents.length > 0) && (
        <div
          className={css`
            display: grid;
            grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
            gap: 0.75rem;
            @media (max-width: ${mobileMaxWidth}) {
              grid-template-columns: 1fr;
            }
          `}
        >
          {usageRows.length > 0 && (
            <div
              className={css`
                border: 1px solid var(--ui-border);
                border-radius: 10px;
                background: var(--chat-bg);
                padding: 0.65rem 0.7rem;
                display: flex;
                flex-direction: column;
                gap: 0.45rem;
                font-size: 0.76rem;
                color: var(--chat-text);
              `}
            >
              <div
                className={css`
                  font-weight: 700;
                  opacity: 0.82;
                `}
              >
                Current run usage
              </div>
              {usageRows.map((row) => (
                <div
                  key={`${row.stage}-${row.model}`}
                  className={css`
                    display: grid;
                    grid-template-columns: minmax(72px, auto) 1fr;
                    gap: 0.3rem 0.7rem;
                    align-items: baseline;
                  `}
                >
                  <span
                    className={css`
                      font-weight: 700;
                      text-transform: capitalize;
                    `}
                  >
                    {getUsageStageLabel(row.stage)}
                  </span>
                  <div
                    className={css`
                      display: flex;
                      justify-content: space-between;
                      gap: 0.7rem;
                      min-width: 0;
                      font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                    `}
                  >
                    <span
                      className={css`
                        opacity: 0.72;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      `}
                      title={row.model}
                    >
                      {usageShowsMultipleModels ? row.model : null}
                    </span>
                    <span
                      className={css`
                        white-space: nowrap;
                        margin-left: auto;
                      `}
                    >
                      {formatTokenCount(row.totalTokens)} tok
                    </span>
                  </div>
                </div>
              ))}
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 0.5rem;
                  padding-top: 0.4rem;
                  border-top: 1px solid var(--ui-border);
                  font-weight: 700;
                `}
              >
                <span>Total</span>
                <span
                  className={css`
                    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                    text-align: right;
                  `}
                >
                  {formatTokenCount(usageTotals.inputTokens)} in /{' '}
                  {formatTokenCount(usageTotals.outputTokens)} out /{' '}
                  {formatTokenCount(usageTotals.totalTokens)} tok
                </span>
              </div>
            </div>
          )}
          {debugRunEvents.length > 0 && (
            <div
              className={css`
                border: 1px solid var(--ui-border);
                border-radius: 10px;
                background: #fff;
                padding: 0.65rem 0.7rem;
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
                font-size: 0.76rem;
                color: var(--chat-text);
                max-height: 220px;
                overflow-y: auto;
              `}
            >
              <div
                className={css`
                  font-weight: 700;
                  opacity: 0.82;
                `}
              >
                Current run timeline
              </div>
              {debugRunEvents.map((event) => (
                <div
                  key={event.id}
                  className={css`
                    display: grid;
                    grid-template-columns: auto auto 1fr;
                    gap: 0.35rem;
                    align-items: baseline;
                    line-height: 1.35;
                    padding: ${event.kind === 'action' ? '0.1rem 0.2rem' : '0'};
                    border-radius: 6px;
                    background: ${event.kind === 'action'
                      ? 'rgba(255, 166, 0, 0.08)'
                      : 'transparent'};
                  `}
                >
                  <span
                    className={css`
                      color: ${getRunEventColor(event.kind)};
                      font-weight: 700;
                      text-transform: uppercase;
                      letter-spacing: 0.03em;
                      font-size: 0.68rem;
                      white-space: nowrap;
                    `}
                  >
                    {getRunEventLabel(event.kind)}
                  </span>
                  <span
                    className={css`
                      color: ${Color.gray(0.9)};
                      font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                      font-size: 0.68rem;
                      white-space: nowrap;
                    `}
                  >
                    {formatRunEventTime(event.createdAt)}
                  </span>
                  <span
                    className={css`
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                      font-weight: ${event.kind === 'action' ? 700 : 400};
                    `}
                    title={event.message}
                  >
                    {event.phase ? `[${event.phase}] ` : ''}
                    {event.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showDebugEmptyState ? (
        <div
          className={css`
            border: 1px solid var(--ui-border);
            border-radius: 10px;
            background: var(--chat-bg);
            padding: 0.85rem 0.9rem;
            font-size: 0.86rem;
            font-weight: 700;
            color: var(--chat-text);
          `}
        >
          No recent file changes yet.
        </div>
      ) : (
        <>
          {hasPromptContextPreview ? (
            <div
              className={css`
                border: 1px solid var(--ui-border);
                border-radius: 10px;
                background: var(--chat-bg);
                padding: 0.7rem 0.8rem;
              `}
            >
              <div
                className={css`
                  font-weight: 700;
                  margin-bottom: 0.4rem;
                  font-size: 0.8rem;
                `}
              >
                Recent file context
              </div>
              <pre
                className={css`
                  margin: 0;
                  white-space: pre-wrap;
                  word-break: break-word;
                  font-size: 0.74rem;
                  line-height: 1.45;
                  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                `}
              >
                {projectFilePromptContextPreview}
              </pre>
            </div>
          ) : null}
          {hasProjectFileChangeLogs ? (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 0.4rem;
              `}
            >
              {projectFileChangeLogs.map((entry) => {
                const totalChanges = countProjectFileChanges(entry.diff);
                return (
                  <div
                    key={entry.id}
                    className={css`
                      border: 1px solid var(--ui-border);
                      border-radius: 10px;
                      background: #fff;
                      padding: 0.6rem 0.7rem;
                      display: flex;
                      flex-direction: column;
                      gap: 0.28rem;
                    `}
                  >
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                        font-size: 0.72rem;
                        font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                        opacity: 0.85;
                      `}
                    >
                      <span>{entry.actorRole.toUpperCase()} #{entry.id}</span>
                      <span>
                        {totalChanges} file change
                        {totalChanges === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div
                      className={css`
                        font-size: 0.82rem;
                        line-height: 1.45;
                        color: var(--chat-text);
                      `}
                    >
                      {entry.summaryText || '[no summary]'}
                    </div>
                    <div
                      className={css`
                        font-size: 0.7rem;
                        font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                        opacity: 0.72;
                      `}
                    >
                      {formatRunEventTime(entry.createdAt * 1000)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
});

function BuildChatMessageRow({
  message,
  messages,
  index,
  lastAssistantIndex,
  generating,
  generatingStatus,
  assistantStatusSteps,
  currentActivityMessage,
  activeStreamMessageIds,
  onDeleteMessage
}: {
  message: ChatMessage;
  messages: ChatMessage[];
  index: number;
  lastAssistantIndex: number;
  generating: boolean;
  generatingStatus: string | null;
  assistantStatusSteps: string[];
  currentActivityMessage: string | null;
  activeStreamMessageIds: number[];
  onDeleteMessage: (message: ChatMessage) => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [componentRef, inView] = useInView({
    rootMargin: '480px 0px'
  });
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const isLastAssistant =
    message.role === 'assistant' && index === lastAssistantIndex;
  const isActiveStreamMessage = activeStreamMessageIds.includes(message.id);
  const isStreamingTarget =
    (generating && isActiveStreamMessage) ||
    (generating && message.role === 'assistant' && isLastAssistant);
  const shouldLazyLoad =
    messages.length > 10 && index < messages.length - 8 && !isStreamingTarget;
  const isVisible = useLazyLoad({
    id: `build-chat-message-${message.id}`,
    PanelRef: panelRef,
    inView,
    onSetPlaceholderHeight: setPlaceholderHeight,
    delay: 400
  });
  const contentShown =
    !shouldLazyLoad || isVisible || inView || placeholderHeight <= 0;

  return (
    <div
      ref={componentRef}
      className={css`
        display: flex;
        flex-direction: column;
        align-items: ${message.role === 'user' ? 'flex-end' : 'flex-start'};
        position: relative;
      `}
    >
      {contentShown ? (
        <div
          ref={panelRef}
          className={css`
            display: flex;
            flex-direction: column;
            align-items: ${message.role === 'user' ? 'flex-end' : 'flex-start'};
            position: relative;
            width: 100%;
          `}
        >
          <button
            onClick={() => onDeleteMessage(message)}
            disabled={isStreamingTarget}
            title={
              isStreamingTarget
                ? 'Cannot delete while this request is in progress'
                : 'Delete message'
            }
            className={`${css`
              position: absolute;
              top: -0.35rem;
              right: ${message.role === 'user' ? '-0.25rem' : 'auto'};
              left: ${message.role === 'user' ? 'auto' : '-0.25rem'};
              padding: 0;
              border: none;
              background: transparent;
              color: var(--chat-text);
              font-size: 1.05rem;
              line-height: 1;
              opacity: 0.55;
              pointer-events: auto;
              transition:
                opacity 0.15s ease,
                transform 0.15s ease,
                color 0.15s ease;
              transform: translateY(0);
              cursor: pointer;
              z-index: 2;
              &:hover,
              &:focus-visible {
                opacity: 1;
                color: ${Color.rose()};
                transform: translateY(-1px);
              }

              &:disabled {
                opacity: 0.35;
                pointer-events: none;
                cursor: not-allowed;
              }
            `} build-chat-delete-button`}
          >
            <Icon icon="times-circle" />
          </button>
          <div
            className={css`
              max-width: 85%;
              padding: 0.75rem 1rem;
              border-radius: 12px;
              background: ${message.role === 'user'
                ? 'var(--theme-bg)'
                : 'var(--chat-bg)'};
              color: ${message.role === 'user'
                ? 'var(--theme-text)'
                : 'var(--chat-text)'};
              word-break: break-word;
              font-size: 0.95rem;
              line-height: 1.4;
              border: 1px solid var(--ui-border);
            `}
          >
            {message.role === 'assistant' ? (
              <AssistantMessage
                message={message}
                messages={messages}
                isLatestAssistant={isLastAssistant}
                generating={generating}
                generatingStatus={generatingStatus}
                statusSteps={isLastAssistant ? assistantStatusSteps : []}
                currentActivityMessage={
                  isLastAssistant ? currentActivityMessage : null
                }
              />
            ) : (
              <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
            )}
          </div>
          <span
            className={css`
              font-size: 0.7rem;
              color: var(--chat-text);
              opacity: 0.5;
              margin-top: 0.25rem;
              padding: 0 0.5rem;
            `}
          >
            {timeSince(message.createdAt)}
          </span>
        </div>
      ) : (
        <div
          className={css`
            width: 100%;
            display: flex;
            justify-content: ${message.role === 'user'
              ? 'flex-end'
              : 'flex-start'};
          `}
        >
          <div
            className={css`
              width: min(85%, 42rem);
              height: ${Math.max(placeholderHeight, 56)}px;
              border-radius: 12px;
              border: 1px solid var(--ui-border);
              background: linear-gradient(
                90deg,
                rgba(236, 241, 246, 0.8) 0%,
                rgba(247, 249, 252, 0.95) 45%,
                rgba(236, 241, 246, 0.8) 100%
              );
              opacity: 0.72;
            `}
          />
        </div>
      )}
    </div>
  );
}

function AssistantMessage({
  message,
  messages,
  isLatestAssistant,
  generating,
  generatingStatus,
  statusSteps,
  currentActivityMessage
}: {
  message: ChatMessage;
  messages: ChatMessage[];
  isLatestAssistant: boolean;
  generating: boolean;
  generatingStatus: string | null;
  statusSteps: string[];
  currentActivityMessage: string | null;
}) {
  const [showDiff, setShowDiff] = useState(true);

  const previousCode = useMemo(() => {
    if (!message.codeGenerated) return null;
    const messageIndex = messages.findIndex((m) => m.id === message.id);
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].codeGenerated) {
        return messages[i].codeGenerated;
      }
    }
    return '';
  }, [message, messages]);

  const diffStats = useMemo(() => {
    if (!message.codeGenerated || previousCode === null) return null;
    const { stats } = computeLineDiff(previousCode, message.codeGenerated);
    return stats;
  }, [message.codeGenerated, previousCode]);

  const hasCodePayload = Boolean(message.codeGenerated || message.artifactVersionId);
  const hasChanges = diffStats && (diffStats.added > 0 || diffStats.removed > 0);
  const hasStreamingCodePreview =
    generating &&
    isLatestAssistant &&
    !message.codeGenerated &&
    Boolean(message.streamCodePreview && message.streamCodePreview.trim());
  const showSteps = statusSteps.length > 0 && generating;
  const normalizedCurrentActivityMessage = String(
    currentActivityMessage || ''
  ).trim();
  const showCurrentActivity =
    generating &&
    isLatestAssistant &&
    Boolean(normalizedCurrentActivityMessage) &&
    normalizedCurrentActivityMessage !== String(generatingStatus || '').trim();
  const waitingForCurrentAssistantResponse = generating && isLatestAssistant;
  const showNoCodeWarning =
    !hasCodePayload &&
    !waitingForCurrentAssistantResponse &&
    looksLikeCompletedCodeChangeClaim(message.content);

  return (
    <div>
      {hasCodePayload && (
        <div
          className={css`
            margin-bottom: 0.75rem;
            border-radius: 8px;
            border: 1px solid var(--ui-border);
            overflow: hidden;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.5rem;
              padding: 0.5rem 0.75rem;
              background: var(--chat-bg);
              color: var(--chat-text);
              font-size: 0.85rem;
              font-weight: 600;
            `}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.5rem;
              `}
            >
              <Icon icon="check" style={{ color: Color.green() }} />
              <span>Code updated</span>
              {hasChanges && (
                <span
                  className={css`
                    display: inline-flex;
                    gap: 0.4rem;
                    font-family: 'SF Mono', monospace;
                    font-size: 0.8rem;
                    font-weight: 500;
                  `}
                >
                  <span style={{ color: Color.green() }}>+{diffStats.added}</span>
                  <span style={{ color: Color.rose() }}>-{diffStats.removed}</span>
                </span>
              )}
            </div>
            {hasChanges && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className={css`
                  background: none;
                  border: none;
                  color: ${Color.logoBlue()};
                  cursor: pointer;
                  font-size: 0.8rem;
                  padding: 0;
                  display: flex;
                  align-items: center;
                  gap: 0.25rem;
                  &:hover {
                    text-decoration: underline;
                  }
                `}
              >
                {showDiff ? 'Hide' : 'Show'} diff
                <Icon icon={showDiff ? 'chevron-up' : 'chevron-down'} />
              </button>
            )}
          </div>
          {showDiff && hasChanges && previousCode !== null && (
            <CodeDiff
              oldCode={previousCode}
              newCode={message.codeGenerated || ''}
              collapsible={false}
              className={css`
                border: none;
                border-radius: 0;
                border-top: 1px solid var(--ui-border);
              `}
            />
          )}
        </div>
      )}
      {hasStreamingCodePreview && (
        <div
          className={css`
            margin-bottom: 0.75rem;
            border-radius: 8px;
            border: 1px solid var(--ui-border);
            background: var(--chat-bg);
            color: var(--chat-text);
            padding: 0.5rem 0.7rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            font-size: 0.8rem;
          `}
        >
          <span>Generating code draft...</span>
          <span
            className={css`
              opacity: 0.7;
              font-family: 'SF Mono', monospace;
            `}
          >
            {(message.streamCodePreview || '').length} chars
          </span>
        </div>
      )}
      {showNoCodeWarning && (
        <div
          className={css`
            margin-bottom: 0.75rem;
            border-radius: 8px;
            border: 1px solid ${Color.orange(0.35)};
            background: ${Color.orange(0.08)};
            padding: 0.6rem 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.45rem;
              font-size: 0.82rem;
              font-weight: 700;
              color: ${Color.orange()};
            `}
          >
            <Icon icon="exclamation-triangle" />
            No code changes were applied
          </div>
          <div
            className={css`
              font-size: 0.8rem;
              line-height: 1.35;
              color: var(--chat-text);
              opacity: 0.85;
            `}
          >
            Lumine replied like it made changes, but it did not return updated
            code. Your workspace stayed the same.
          </div>
        </div>
      )}
      {message.content ? (
        <RichText isAIMessage aiActionPlacement="inline" maxLines={15}>
          {message.content}
        </RichText>
      ) : generating && !showSteps ? (
        <ThinkingIndicator status={generatingStatus || 'thinking'} compact />
      ) : null}
      {showCurrentActivity && (
        <div
          className={css`
            margin-top: 0.55rem;
            padding: 0.55rem 0.7rem;
            border-radius: 8px;
            border: 1px solid rgba(52, 109, 255, 0.16);
            background: rgba(52, 109, 255, 0.05);
            color: var(--chat-text);
            display: grid;
            gap: 0.22rem;
          `}
        >
          <div
            className={css`
              font-size: 0.68rem;
              font-weight: 800;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              color: ${Color.logoBlue()};
            `}
          >
            Current Activity
          </div>
          <div
            className={css`
              font-size: 0.82rem;
              line-height: 1.4;
            `}
          >
            {normalizedCurrentActivityMessage}
          </div>
        </div>
      )}
      {showSteps && <StatusStepLog steps={statusSteps} />}
    </div>
  );
}

function StatusStepLog({ steps }: { steps: string[] }) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        margin-top: 0.5rem;
        font-size: 0.8rem;
        font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
      `}
    >
      {steps.map((step, index) => {
        const isCurrent = index === steps.length - 1;
        const label = formatStepLabel(step);
        return (
          <div
            key={index}
            className={css`
              display: flex;
              align-items: center;
              gap: 0.4rem;
              color: ${isCurrent ? 'var(--chat-text)' : Color.gray()};
              line-height: 1.5;
            `}
          >
            {isCurrent ? (
              <span style={{ color: Color.logoBlue() }}>&#9679;</span>
            ) : (
              <Icon
                icon="check"
                style={{ color: Color.green(), fontSize: '0.7rem' }}
              />
            )}
            <span>
              {label}
              {isCurrent && <AnimatedDots />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const dotAnimation = css`
  @keyframes dotPulse {
    0%, 20% { opacity: 0; }
    40% { opacity: 1; }
    100% { opacity: 1; }
  }
`;

function AnimatedDots() {
  return (
    <span
      className={css`
        ${dotAnimation}
        margin-left: 1px;
      `}
    >
      <span
        className={css`
          animation: dotPulse 1.4s infinite;
          animation-delay: 0s;
        `}
      >
        .
      </span>
      <span
        className={css`
          animation: dotPulse 1.4s infinite;
          animation-delay: 0.2s;
        `}
      >
        .
      </span>
      <span
        className={css`
          animation: dotPulse 1.4s infinite;
          animation-delay: 0.4s;
        `}
      >
        .
      </span>
    </span>
  );
}

const STATUS_LABEL_MAP: Record<string, string> = {
  thinking: 'Thinking',
  thinking_hard: 'Thinking hard',
  analyzing_code: 'Analyzing code',
  responding: 'Writing response',
  searching_web: 'Searching the web',
  reading_file: 'Reading files',
  retrieving_memory: 'Remembering',
  saving_file: 'Saving file',
  reading: 'Reading and thinking',
  recalling: 'Recalling memories'
};

function formatStepLabel(status: string): string {
  if (STATUS_LABEL_MAP[status]) return STATUS_LABEL_MAP[status];
  // If it already looks like a human label (e.g. "Loading build code..."), strip trailing dots
  if (status.includes(' ')) return status.replace(/\.+$/, '');
  return status;
}

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}

function looksLikeCompletedCodeChangeClaim(content: string) {
  if (!content || typeof content !== 'string') return false;

  const normalized = content.replace(/[’]/g, "'").toLowerCase();
  if (
    /(can't|cannot|unable|couldn't|could not|won't|didn't|did not|not possible|cannot do)/.test(
      normalized
    )
  ) {
    return false;
  }

  return [
    /\b(i|we)\s+(have|ve|did|just)?\s*(added|updated|fixed|implemented|wired|hooked|changed|created|built|patched|refactored)\b/,
    /\b(here('s| is)\s+(it|the updated version)|it('s| is)\s+(done|fixed|updated))\b/,
    /\b(wired up|changes?\s+(are in|applied|made)|updated code|follow\/unfollow buttons)\b/
  ].some((pattern) => pattern.test(normalized));
}

function formatTokenCount(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return new Intl.NumberFormat('en-US').format(safeValue);
}

function formatBytes(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (safeValue >= 1024 * 1024) {
    return `${(safeValue / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (safeValue >= 1024) {
    return `${(safeValue / 1024).toFixed(1)} KB`;
  }
  return `${Math.round(safeValue)} B`;
}

function buildLimitProgressItem({
  id,
  label,
  used,
  limit,
  text,
  caption,
  color
}: {
  id: string;
  label: string;
  used: number;
  limit: number;
  text: string;
  caption?: string;
  color?: string;
}): LimitProgressItem | null {
  if (!Number.isFinite(limit) || limit <= 0) return null;
  return {
    id,
    label,
    progress: Math.max(0, Math.min(100, (used / limit) * 100)),
    text,
    caption,
    color
  };
}

function LimitStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        border: 1px solid var(--ui-border);
        border-radius: 10px;
        background: var(--chat-bg);
        padding: 0.7rem 0.8rem;
      `}
    >
      <span
        className={css`
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--chat-text);
          opacity: 0.72;
        `}
      >
        {label}
      </span>
      <span
        className={css`
          font-size: 0.84rem;
          font-weight: 800;
          color: var(--chat-text);
          text-transform: capitalize;
        `}
      >
        {value}
      </span>
    </div>
  );
}

function getUsageStageLabel(stage: string) {
  switch (stage) {
    case 'planner':
      return 'Plan';
    case 'validator':
      return 'Validate';
    case 'codex':
      return 'Code';
    case 'narration':
      return 'Reply';
    default:
      return stage;
  }
}

function getRunEventLabel(kind: BuildRunEvent['kind']) {
  switch (kind) {
    case 'lifecycle':
      return 'run';
    case 'phase':
      return 'phase';
    case 'action':
      return 'agent';
    case 'usage':
      return 'usage';
    case 'status':
      return 'status';
    default:
      return kind;
  }
}

function getRunEventColor(kind: BuildRunEvent['kind']) {
  switch (kind) {
    case 'lifecycle':
      return Color.logoBlue();
    case 'phase':
      return Color.pink();
    case 'action':
      return Color.orange();
    case 'usage':
      return Color.green();
    case 'status':
      return Color.gray(0.9);
    default:
      return Color.gray();
  }
}

function formatRunEventTime(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '--:--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function countProjectFileChanges(diff: BuildProjectFileDiff | null | undefined) {
  if (!diff) return 0;
  return (
    (Array.isArray(diff.addedPaths) ? diff.addedPaths.length : 0) +
    (Array.isArray(diff.updatedPaths) ? diff.updatedPaths.length : 0) +
    (Array.isArray(diff.deletedPaths) ? diff.deletedPaths.length : 0)
  );
}
