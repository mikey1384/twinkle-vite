import React, { RefObject, useMemo, useState } from 'react';
import Icon from '~/components/Icon';
import RichText from '~/components/Texts/RichText';
import ThinkingIndicator from '~/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator';
import CodeDiff from '~/components/CodeDiff';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { computeLineDiff } from '~/components/CodeDiff/diffUtils';
import GameCTAButton from '~/components/Buttons/GameCTAButton';

const panelClass = css`
  display: grid;
  grid-template-rows: auto 1fr auto;
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
  padding: 0 1rem;
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
  role: 'user' | 'assistant' | 'reviewer';
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
  estimatedCostUsd: number | null;
}

interface BuildCopilotPolicy {
  tier: 'free' | 'pro' | 'premium';
  assignedTier?: 'free' | 'pro' | 'premium';
  byo?: {
    enabled: boolean;
    requiredForPaidTiers: boolean;
    blockedAssignedTier: boolean;
  };
  pricing: {
    proMonthlyPriceUsd: number;
  };
  limits: {
    maxProjects: number;
    maxProjectBytes: number;
    maxFilesPerProject: number;
    maxFileBytes: number;
    maxPromptChars: number;
    historyMaxAgeSeconds: number;
    historyMaxMessages: number;
    historyMessageCharLimit: number;
    historyTotalCharBudget: number;
  };
  usage: {
    projectCount: number;
    projectCountRemaining: number;
    currentProjectBytes: number;
    projectBytesRemaining: number;
    projectFileCount: number;
    projectFileBytes: number;
    maxFilesPerProject: number;
    maxFileBytes: number;
  };
  requestBilling: {
    dayKey: string;
    tier: 'free' | 'pro' | 'premium';
    freeRequestsPerDay: number;
    coinCostPerRequest: number;
    billingEnabled: boolean;
    requestsToday: number;
    freeRequestsUsed: number;
    freeRequestsRemaining: number;
    paidRequestsToday: number;
    coinSpentToday: number;
    coinBalance: number | null;
  };
  codexReasoning: {
    allowedEfforts: Array<'low' | 'medium' | 'high' | 'xhigh'>;
    defaultEffort: 'low' | 'medium' | 'high' | 'xhigh';
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
    estimatedCostUsd?: number | null;
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

type BuildQueueMode = 'collect' | 'steer' | 'followup';
type BuildCodexReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh';

interface ChatPanelProps {
  messages: ChatMessage[];
  inputMessage: string;
  generating: boolean;
  generatingStatus: string | null;
  reviewerStatusSteps: string[];
  assistantStatusSteps: string[];
  usageMetrics: Record<string, BuildUsageMetric>;
  copilotPolicy: BuildCopilotPolicy | null;
  projectFileChangeLogs: BuildProjectFileChangeLog[];
  projectFilePromptContextPreview: string;
  projectFileChangeLogsLoading: boolean;
  projectFileChangeLogsError: string;
  projectFileChangeLogsLoadedAt: number | null;
  runEvents: BuildRunEvent[];
  queueMode: BuildQueueMode;
  selectedReasoningEffort: BuildCodexReasoningEffort;
  reasoningEffortOptions: BuildCodexReasoningEffort[];
  queuedCount: number;
  activeStreamMessageIds: number[];
  isOwner: boolean;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onChatScroll: () => void;
  onInputChange: (value: string) => void;
  onQueueModeChange: (mode: BuildQueueMode) => void;
  onReasoningEffortChange: (effort: BuildCodexReasoningEffort) => void;
  onSendMessage: () => void;
  onStopGeneration: () => void;
  onReloadProjectFileChangeLogs: (options?: { silent?: boolean }) => Promise<void>;
  onDeleteMessage: (message: ChatMessage) => void;
}

export default function ChatPanel({
  messages,
  inputMessage,
  generating,
  generatingStatus,
  reviewerStatusSteps,
  assistantStatusSteps,
  usageMetrics,
  copilotPolicy,
  projectFileChangeLogs,
  projectFilePromptContextPreview,
  projectFileChangeLogsLoading,
  projectFileChangeLogsError,
  projectFileChangeLogsLoadedAt,
  runEvents,
  queueMode,
  selectedReasoningEffort,
  reasoningEffortOptions,
  queuedCount,
  activeStreamMessageIds,
  isOwner,
  chatScrollRef,
  chatEndRef,
  onChatScroll,
  onInputChange,
  onQueueModeChange,
  onReasoningEffortChange,
  onSendMessage,
  onStopGeneration,
  onReloadProjectFileChangeLogs,
  onDeleteMessage
}: ChatPanelProps) {
  const [showCopilotDebug, setShowCopilotDebug] = useState(false);
  const usageRows = useMemo(() => {
    const stageOrder = ['planner', 'reviewer', 'validator', 'codex', 'narration'];
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
        if (row.estimatedCostUsd != null) {
          acc.estimatedCostUsd =
            acc.estimatedCostUsd == null
              ? row.estimatedCostUsd
              : acc.estimatedCostUsd + row.estimatedCostUsd;
        }
        return acc;
      },
      {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: null as number | null
      }
    );
  }, [usageRows]);

  const inputCharCount = inputMessage.length;
  const promptCharLimit = copilotPolicy?.limits.maxPromptChars ?? null;
  const projectCountUsage = useMemo(() => {
    if (!copilotPolicy) return null;
    return Math.max(
      0,
      Math.min(
        100,
        (copilotPolicy.usage.projectCount / copilotPolicy.limits.maxProjects) *
          100
      )
    );
  }, [copilotPolicy]);
  const projectByteUsage = useMemo(() => {
    if (!copilotPolicy) return null;
    return Math.max(
      0,
      Math.min(
        100,
        (copilotPolicy.usage.currentProjectBytes /
          copilotPolicy.limits.maxProjectBytes) *
          100
      )
    );
  }, [copilotPolicy]);
  const projectFileCountUsage = useMemo(() => {
    if (!copilotPolicy) return null;
    return Math.max(
      0,
      Math.min(
        100,
        (copilotPolicy.usage.projectFileCount /
          copilotPolicy.limits.maxFilesPerProject) *
          100
      )
    );
  }, [copilotPolicy]);
  const requestUsage = useMemo(() => {
    if (!copilotPolicy) return null;
    const billing = copilotPolicy.requestBilling;
    if (!billing.billingEnabled) return null;
    if (billing.freeRequestsPerDay <= 0) return 100;
    return Math.max(
      0,
      Math.min(100, (billing.freeRequestsUsed / billing.freeRequestsPerDay) * 100)
    );
  }, [copilotPolicy]);
  const nextRequestCostLabel = useMemo(() => {
    if (!copilotPolicy) return null;
    const billing = copilotPolicy.requestBilling;
    if (!billing.billingEnabled) return 'Included';
    if (billing.freeRequestsRemaining > 0) return 'Free';
    return `${formatTokenCount(billing.coinCostPerRequest)} coins`;
  }, [copilotPolicy]);

  function handleToggleCopilotDebug() {
    const nextValue = !showCopilotDebug;
    setShowCopilotDebug(nextValue);
    if (
      nextValue &&
      !projectFileChangeLogsLoading &&
      !projectFileChangeLogsLoadedAt
    ) {
      void onReloadProjectFileChangeLogs();
    }
  }

  function handleRefreshCopilotDebug() {
    void onReloadProjectFileChangeLogs();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  }

  return (
    <div className={panelClass}>
      <div className={headerClass}>
        <div className={headerTitleClass}>
          <Icon icon="sparkles" />
          Build Copilot
        </div>
        {copilotPolicy && (
          <div
            className={css`
              margin-top: 0.4rem;
              border: 1px solid var(--ui-border);
              border-radius: 10px;
              background: #fff;
              padding: 0.55rem 0.65rem;
              display: flex;
              flex-direction: column;
              gap: 0.42rem;
              font-size: 0.75rem;
              color: var(--chat-text);
            `}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.4rem;
              `}
            >
              <span
                className={css`
                  font-weight: 800;
                  opacity: 0.85;
                `}
              >
                Plan limits
              </span>
              <span
                className={css`
                  border-radius: 999px;
                  border: 1px solid var(--ui-border);
                  padding: 0.1rem 0.45rem;
                  font-size: 0.7rem;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 0.03em;
                  background: var(--chat-bg);
                `}
            >
                {copilotPolicy.tier}
              </span>
            </div>
            {copilotPolicy.byo?.blockedAssignedTier && (
              <div
                className={css`
                  border: 1px solid ${Color.orange(0.35)};
                  border-radius: 8px;
                  background: ${Color.orange(0.08)};
                  color: ${Color.orange(0.95)};
                  padding: 0.42rem 0.5rem;
                  font-size: 0.72rem;
                  line-height: 1.35;
                `}
              >
                Assigned {copilotPolicy.assignedTier || 'paid'} tier is inactive.
                Enable BYO to unlock paid Build limits.
              </div>
            )}
            <MetricBarRow
              label="Projects"
              value={`${formatTokenCount(copilotPolicy.usage.projectCount)} / ${formatTokenCount(copilotPolicy.limits.maxProjects)}`}
              meta={`${formatTokenCount(copilotPolicy.usage.projectCountRemaining)} left`}
              percent={projectCountUsage || 0}
            />
            <MetricBarRow
              label="Project size"
              value={`${formatBytes(copilotPolicy.usage.currentProjectBytes)} / ${formatBytes(copilotPolicy.limits.maxProjectBytes)}`}
              meta={`${formatBytes(copilotPolicy.usage.projectBytesRemaining)} left`}
              percent={projectByteUsage || 0}
            />
            <MetricBarRow
              label="Files"
              value={`${formatTokenCount(copilotPolicy.usage.projectFileCount)} / ${formatTokenCount(copilotPolicy.limits.maxFilesPerProject)}`}
              meta={`Per-file cap ${formatBytes(copilotPolicy.limits.maxFileBytes)}`}
              percent={projectFileCountUsage || 0}
            />
            {copilotPolicy.requestBilling.billingEnabled && requestUsage != null ? (
              <MetricBarRow
                label="Daily free requests"
                value={`${formatTokenCount(copilotPolicy.requestBilling.freeRequestsUsed)} / ${formatTokenCount(copilotPolicy.requestBilling.freeRequestsPerDay)}`}
                meta={`${formatTokenCount(copilotPolicy.requestBilling.freeRequestsRemaining)} free left`}
                percent={requestUsage}
              />
            ) : (
              <div
                className={css`
                  display: flex;
                  justify-content: space-between;
                  gap: 0.5rem;
                  font-size: 0.72rem;
                  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                `}
              >
                <span>Requests included</span>
                <span>{copilotPolicy.tier} tier</span>
              </div>
            )}
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
                font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
              `}
            >
              <span>Prompt {formatTokenCount(copilotPolicy.limits.maxPromptChars)} chars</span>
              <span>
                History {copilotPolicy.limits.historyMaxMessages} msgs /{' '}
                {Math.floor(copilotPolicy.limits.historyMaxAgeSeconds / 3600)}h
              </span>
            </div>
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
                font-size: 0.72rem;
                font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
              `}
            >
              <span>
                Paid requests {formatTokenCount(copilotPolicy.requestBilling.paidRequestsToday)}
                {' / '}
                {formatTokenCount(copilotPolicy.requestBilling.coinSpentToday)} coins
              </span>
              <span>
                Balance{' '}
                {copilotPolicy.requestBilling.coinBalance == null
                  ? 'n/a'
                  : formatTokenCount(copilotPolicy.requestBilling.coinBalance)}
              </span>
            </div>
          </div>
        )}
        {usageRows.length > 0 && (
          <div
            className={css`
              margin-top: 0.4rem;
              border: 1px solid var(--ui-border);
              border-radius: 10px;
              background: var(--chat-bg);
              padding: 0.55rem 0.65rem;
              display: flex;
              flex-direction: column;
              gap: 0.4rem;
              font-size: 0.76rem;
              color: var(--chat-text);
            `}
          >
            <div
              className={css`
                font-weight: 700;
                opacity: 0.8;
              `}
            >
              Current run usage
            </div>
            {usageRows.map((row) => (
              <div
                key={`${row.stage}-${row.model}`}
                className={css`
                  display: grid;
                  grid-template-columns: minmax(80px, auto) 1fr auto;
                  gap: 0.35rem 0.6rem;
                  align-items: center;
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
                <span
                  className={css`
                    opacity: 0.75;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  `}
                  title={row.model}
                >
                  {row.model}
                </span>
                <span
                  className={css`
                    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                    white-space: nowrap;
                  `}
                >
                  {formatTokenCount(row.totalTokens)} tok
                  {' / '}
                  {formatUsageCost(row.estimatedCostUsd)}
                </span>
              </div>
            ))}
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
                padding-top: 0.35rem;
                border-top: 1px solid var(--ui-border);
                font-weight: 700;
              `}
            >
              <span>Total</span>
              <span
                className={css`
                  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                `}
              >
                {formatTokenCount(usageTotals.inputTokens)} in /{' '}
                {formatTokenCount(usageTotals.outputTokens)} out /{' '}
                {formatTokenCount(usageTotals.totalTokens)} tok /{' '}
                {formatUsageCost(usageTotals.estimatedCostUsd)}
              </span>
            </div>
          </div>
        )}
        {runEvents.length > 0 && (
          <div
            className={css`
              border: 1px solid var(--ui-border);
              border-radius: 10px;
              background: #fff;
              padding: 0.55rem 0.65rem;
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
              font-size: 0.76rem;
              color: var(--chat-text);
              max-height: 160px;
              overflow-y: auto;
            `}
          >
            <div
              className={css`
                font-weight: 700;
                opacity: 0.82;
                margin-bottom: 0.1rem;
              `}
            >
              Current run timeline
            </div>
            {runEvents.slice(-12).map((event) => (
              <div
                key={event.id}
                className={css`
                  display: grid;
                  grid-template-columns: auto auto 1fr;
                  gap: 0.35rem;
                  align-items: baseline;
                  line-height: 1.35;
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
        <div
          className={css`
            border: 1px solid var(--ui-border);
            border-radius: 10px;
            background: #fff;
            padding: 0.55rem 0.65rem;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            font-size: 0.76rem;
            color: var(--chat-text);
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.5rem;
            `}
          >
            <span
              className={css`
                font-weight: 700;
                opacity: 0.85;
              `}
            >
              AI context debug
            </span>
            <div
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
              `}
            >
              <button
                type="button"
                onClick={handleRefreshCopilotDebug}
                disabled={projectFileChangeLogsLoading}
                className={css`
                  border: 1px solid var(--ui-border);
                  background: #fff;
                  color: var(--chat-text);
                  border-radius: 999px;
                  padding: 0.18rem 0.5rem;
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
              <button
                type="button"
                onClick={handleToggleCopilotDebug}
                className={css`
                  border: 1px solid var(--ui-border);
                  background: ${showCopilotDebug ? 'var(--chat-bg)' : '#fff'};
                  color: var(--chat-text);
                  border-radius: 999px;
                  padding: 0.18rem 0.5rem;
                  font-size: 0.68rem;
                  font-weight: 700;
                  cursor: pointer;
                `}
              >
                {showCopilotDebug ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.5rem;
              font-size: 0.7rem;
              font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
              opacity: 0.8;
            `}
          >
            <span>{formatTokenCount(projectFileChangeLogs.length)} logs</span>
            <span>
              {projectFileChangeLogsLoadedAt
                ? `Updated ${formatRunEventTime(projectFileChangeLogsLoadedAt)}`
                : 'Not loaded yet'}
            </span>
          </div>
          {showCopilotDebug && (
            <div
              className={css`
                margin-top: 0.15rem;
                display: flex;
                flex-direction: column;
                gap: 0.4rem;
              `}
            >
              {projectFileChangeLogsError ? (
                <div
                  className={css`
                    border: 1px solid ${Color.rose(0.35)};
                    background: ${Color.rose(0.07)};
                    color: ${Color.rose(0.95)};
                    border-radius: 8px;
                    padding: 0.5rem 0.55rem;
                    font-size: 0.74rem;
                  `}
                >
                  {projectFileChangeLogsError}
                </div>
              ) : null}
              <div
                className={css`
                  border: 1px solid var(--ui-border);
                  border-radius: 8px;
                  background: var(--chat-bg);
                  padding: 0.45rem 0.5rem;
                `}
              >
                <div
                  className={css`
                    font-weight: 700;
                    margin-bottom: 0.28rem;
                    font-size: 0.72rem;
                  `}
                >
                  Prompt context preview
                </div>
                <pre
                  className={css`
                    margin: 0;
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-size: 0.7rem;
                    line-height: 1.35;
                    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                    max-height: 160px;
                    overflow-y: auto;
                  `}
                >
                  {projectFilePromptContextPreview || '[no recent file changes]'}
                </pre>
              </div>
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  gap: 0.25rem;
                  max-height: 180px;
                  overflow-y: auto;
                `}
              >
                {projectFileChangeLogs.length === 0 ? (
                  <div
                    className={css`
                      font-size: 0.72rem;
                      opacity: 0.72;
                    `}
                  >
                    No project file change logs yet.
                  </div>
                ) : (
                  projectFileChangeLogs.map((entry) => {
                    const totalChanges = countProjectFileChanges(entry.diff);
                    return (
                      <div
                        key={entry.id}
                        className={css`
                          border: 1px solid var(--ui-border);
                          border-radius: 8px;
                          background: #fff;
                          padding: 0.4rem 0.5rem;
                          display: flex;
                          flex-direction: column;
                          gap: 0.2rem;
                        `}
                      >
                        <div
                          className={css`
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 0.5rem;
                            font-size: 0.69rem;
                            font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                            opacity: 0.85;
                          `}
                        >
                          <span>
                            {entry.actorRole.toUpperCase()} #{entry.id}
                          </span>
                          <span>
                            {totalChanges} file change{totalChanges === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div
                          className={css`
                            font-size: 0.73rem;
                            line-height: 1.35;
                          `}
                        >
                          {entry.summaryText || '[no summary]'}
                        </div>
                        <div
                          className={css`
                            font-size: 0.68rem;
                            font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                            opacity: 0.72;
                          `}
                        >
                          {formatRunEventTime(entry.createdAt * 1000)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
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
        {messages.length === 0 ? (
          <div
            className={css`
              text-align: center;
              padding: 2rem;
              color: var(--chat-text);
              opacity: 0.7;
            `}
          >
            <Icon icon="comments" size="2x" style={{ marginBottom: '0.8rem' }} />
            <p style={{ margin: 0, fontSize: '1.05rem' }}>
              {isOwner
                ? 'Describe what you want to build and I will help you create it.'
                : 'No messages yet.'}
            </p>
          </div>
        ) : (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1rem;
            `}
          >
            {messages.map((message, index) => {
              const isLastReviewer =
                message.role === 'reviewer' &&
                index === findLastIndex(messages, (m) => m.role === 'reviewer');
              const isLastAssistant =
                message.role === 'assistant' &&
                index === findLastIndex(messages, (m) => m.role === 'assistant');
              const isActiveStreamMessage = activeStreamMessageIds.includes(
                message.id
              );
              const isStreamingTarget =
                (generating && isActiveStreamMessage) ||
                (generating &&
                  ((message.role === 'assistant' && isLastAssistant) ||
                    (message.role === 'reviewer' && isLastReviewer)));

              return (
                <div
                  key={message.id}
                    className={css`
                      display: flex;
                      flex-direction: column;
                      align-items: ${message.role === 'user'
                        ? 'flex-end'
                        : 'flex-start'};
                      position: relative;
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
                      transition: opacity 0.15s ease, transform 0.15s ease,
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
                  {message.role === 'reviewer' && (
                    <span
                      className={css`
                        display: inline-flex;
                        align-items: center;
                        gap: 0.3rem;
                        font-size: 0.75rem;
                        font-weight: 700;
                        color: ${Color.orange()};
                        margin-bottom: 0.25rem;
                        padding: 0 0.3rem;
                      `}
                    >
                      <Icon icon="magnifying-glass" />
                      Code Review
                    </span>
                  )}
                  <div
                    className={css`
                      max-width: 85%;
                      padding: 0.75rem 1rem;
                      border-radius: 12px;
                      background: ${message.role === 'user'
                        ? 'var(--theme-bg)'
                        : message.role === 'reviewer'
                        ? '#fff8f0'
                        : 'var(--chat-bg)'};
                      color: ${message.role === 'user'
                        ? 'var(--theme-text)'
                        : 'var(--chat-text)'};
                      word-break: break-word;
                      font-size: 0.95rem;
                      line-height: 1.4;
                      border: 1px solid ${message.role === 'reviewer'
                        ? Color.orange(0.3)
                        : 'var(--ui-border)'};
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
                      />
                    ) : message.role === 'reviewer' ? (
                      <ReviewerMessage
                        message={message}
                        generating={generating}
                        generatingStatus={generatingStatus}
                        statusSteps={isLastReviewer ? reviewerStatusSteps : []}
                      />
                    ) : (
                      <span style={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </span>
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
              );
            })}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {isOwner && (
        <div
          className={css`
            padding: 0.9rem 1rem 1.1rem;
            background: #fff;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.5rem;
              margin-bottom: 0.55rem;
              flex-wrap: wrap;
            `}
          >
            <div
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
              `}
            >
              {(['collect', 'steer', 'followup'] as BuildQueueMode[]).map(
                (mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onQueueModeChange(mode)}
                    className={css`
                      border: 1px solid var(--ui-border);
                      background: ${queueMode === mode
                        ? 'var(--chat-bg)'
                        : '#fff'};
                      color: ${queueMode === mode
                        ? 'var(--chat-text)'
                        : Color.gray(0.95)};
                      border-radius: 999px;
                      padding: 0.2rem 0.55rem;
                      font-size: 0.72rem;
                      font-weight: 700;
                      text-transform: uppercase;
                      letter-spacing: 0.03em;
                      cursor: pointer;
                    `}
                  >
                    {mode}
                  </button>
                )
              )}
            </div>
            <div
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                font-size: 0.72rem;
                color: var(--chat-text);
              `}
            >
              <span
                className={css`
                  font-weight: 700;
                  opacity: 0.72;
                `}
              >
                Reasoning
              </span>
              <select
                value={selectedReasoningEffort}
                onChange={(e) =>
                  onReasoningEffortChange(
                    e.target.value as BuildCodexReasoningEffort
                  )
                }
                className={css`
                  border: 1px solid var(--ui-border);
                  background: #fff;
                  color: var(--chat-text);
                  border-radius: 999px;
                  padding: 0.16rem 0.5rem;
                  font-size: 0.72rem;
                  font-weight: 700;
                  cursor: pointer;
                  &:focus {
                    outline: none;
                    border-color: var(--theme-border);
                  }
                `}
              >
                {reasoningEffortOptions.map((effort) => (
                  <option key={effort} value={effort}>
                    {formatReasoningEffortLabel(effort)}
                  </option>
                ))}
              </select>
            </div>
            {queuedCount > 0 && (
              <span
                className={css`
                  font-size: 0.73rem;
                  color: var(--chat-text);
                  opacity: 0.72;
                  font-weight: 700;
                `}
              >
                {queuedCount} queued
              </span>
            )}
          </div>
          <div
            className={css`
              display: flex;
              gap: 0.5rem;
            `}
          >
            <textarea
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                generating
                  ? 'Type a follow-up to queue...'
                  : 'Describe what you want to build...'
              }
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
              onClick={onSendMessage}
              disabled={!inputMessage.trim()}
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
          {promptCharLimit != null && (
            <div
              className={css`
                margin-top: 0.42rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
                font-size: 0.72rem;
              `}
            >
              <span
                className={css`
                  color: ${inputCharCount > promptCharLimit
                    ? Color.rose()
                    : Color.gray(0.9)};
                  font-weight: 700;
                  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                `}
              >
                Prompt: {formatTokenCount(inputCharCount)} /{' '}
                {formatTokenCount(promptCharLimit)} chars
              </span>
              {copilotPolicy && (
                <span
                  className={css`
                    color: var(--chat-text);
                    opacity: 0.72;
                    font-weight: 700;
                  `}
                >
                  Next request: {nextRequestCostLabel}
                  {copilotPolicy.tier === 'free'
                    ? ` | Pro $${copilotPolicy.pricing.proMonthlyPriceUsd}/month`
                    : ''}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricBarRow({
  label,
  value,
  meta,
  percent
}: {
  label: string;
  value: string;
  meta: string;
  percent: number;
}) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.5rem;
        `}
      >
        <span
          className={css`
            font-weight: 700;
          `}
        >
          {label}
        </span>
        <span
          className={css`
            font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
            white-space: nowrap;
          `}
        >
          {value}
        </span>
      </div>
      <div
        className={css`
          height: 5px;
          border-radius: 999px;
          background: var(--chat-bg);
          overflow: hidden;
        `}
      >
        <div
          className={css`
            width: ${Math.max(0, Math.min(100, percent))}%;
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, #4f8df7, #5ad1ff);
          `}
        />
      </div>
      <div
        className={css`
          display: flex;
          justify-content: flex-end;
          font-size: 0.68rem;
          opacity: 0.7;
        `}
      >
        {meta}
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  messages,
  isLatestAssistant,
  generating,
  generatingStatus,
  statusSteps
}: {
  message: ChatMessage;
  messages: ChatMessage[];
  isLatestAssistant: boolean;
  generating: boolean;
  generatingStatus: string | null;
  statusSteps: string[];
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
            Copilot replied like it made changes, but it did not return updated
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
      {showSteps && <StatusStepLog steps={statusSteps} />}
    </div>
  );
}

function ReviewerMessage({
  message,
  generating,
  generatingStatus,
  statusSteps
}: {
  message: ChatMessage;
  generating: boolean;
  generatingStatus: string | null;
  statusSteps: string[];
}) {
  const showSteps = statusSteps.length > 0 && generating;

  return (
    <div>
      {message.content ? (
        <RichText isAIMessage aiActionPlacement="inline" maxLines={20}>
          {message.content}
        </RichText>
      ) : generating && !showSteps ? (
        <ThinkingIndicator status={generatingStatus || 'Reviewing code...'} compact />
      ) : null}
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

function formatReasoningEffortLabel(effort: BuildCodexReasoningEffort) {
  switch (effort) {
    case 'xhigh':
      return 'xhigh (pro+)';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
    default:
      return 'low';
  }
}

function formatTokenCount(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return new Intl.NumberFormat('en-US').format(safeValue);
}

function formatUsageCost(value: number | null) {
  if (value == null || !Number.isFinite(value)) return 'n/a';
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function formatBytes(value: number) {
  const bytes = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getUsageStageLabel(stage: string) {
  switch (stage) {
    case 'planner':
      return 'Plan';
    case 'reviewer':
      return 'Review';
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
      return 'action';
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
