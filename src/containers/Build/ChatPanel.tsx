import React, { RefObject, useMemo, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import RichText from '~/components/Texts/RichText';
import CodeDiff from '~/components/CodeDiff';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import ProgressBar from '~/components/ProgressBar';
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
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid var(--ui-border);
  background: #fff;
  --build-workshop-title-font-size: 1.2rem;
  --build-workshop-body-font-size: 1rem;
  --build-workshop-label-font-size: 0.96rem;
  --build-workshop-meta-font-size: 0.88rem;
  --build-workshop-small-font-size: 0.84rem;
  --build-workshop-tiny-font-size: 0.78rem;
  --build-workshop-message-font-size: 1.1rem;
  --build-workshop-message-meta-font-size: 0.82rem;
  --build-workshop-input-font-size: 1.06rem;
  --build-workshop-prompt-font-size: 1.08rem;
  --build-workshop-choice-font-size: 1rem;
  font-size: var(--build-workshop-body-font-size);
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
  font-size: var(--build-workshop-title-font-size);
`;

const BUILD_ASSISTANT_PLACEHOLDER_TEXT =
  'Would you like me to continue working on this?';

function isBuildAssistantPlaceholderContent(content: string | null | undefined) {
  const normalizedContent = String(content || '').trim();
  return (
    !normalizedContent ||
    normalizedContent === BUILD_ASSISTANT_PLACEHOLDER_TEXT
  );
}


interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  codeGenerated: string | null;
  streamCodePreview?: string | null;
  uploadProgressPercent?: number | null;
  billingState?: 'charged' | 'not_charged' | 'pending' | null;
  artifactVersionId?: number | null;
  clientMessageId?: string | null;
  createdAt: number;
  source?: 'runtime_observation';
}

interface BuildCopilotPolicy {
  limits: {
    maxProjectBytes: number;
    maxFilesPerProject: number;
    maxFileLines: number;
    maxPublishedBuildStorageBytes: number;
    maxRuntimeFileStorageBytes: number;
    maxRuntimeFileBytes: number;
  };
  usage: {
    currentProjectBytes: number;
    projectBytesRemaining: number;
    projectFileCount: number;
    projectFileBytes: number;
    maxFilesPerProject: number;
    publishedBuildStorageBytes: number;
    publishedBuildStorageRemaining: number;
    publishedBuildCount: number;
    runtimeFileStorageBytes: number;
    runtimeFileStorageRemaining: number;
    runtimeFileCount: number;
  };
  requestLimits: {
    dayIndex: number;
    dayKey: string;
    generationBaseRequestsPerDay: number;
    generationResetPurchasesToday: number;
    generationResetCost: number;
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
  details?: {
    thoughtContent?: string | null;
    isComplete?: boolean;
    isThinkingHard?: boolean;
  } | null;
  usage?: {
    stage?: string | null;
    model?: string | null;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
}

interface BuildCurrentActivity {
  message: string;
}

interface BuildStatusStepEntry {
  status: string;
  thoughtContent: string;
  thoughtIsComplete: boolean;
  thoughtIsThinkingHard: boolean;
}

interface BuildRuntimeUploadAsset {
  id: number;
  buildId: number;
  buildTitle: string | null;
  buildSlug: string | null;
  buildIsPublic: boolean;
  fileName: string;
  originalFileName: string;
  mimeType: string | null;
  sizeBytes: number;
  filePath: string;
  url: string;
  thumbUrl: string | null;
  fileType: 'image' | 'audio' | 'pdf' | 'archive' | 'other';
  uploadedByUserId: number;
  createdAt: number;
}

interface BuildExecutionPlanSummary {
  status: 'awaiting_confirmation' | 'running' | 'completed' | 'cancelled';
}

interface BuildFollowUpPrompt {
  question?: string | null;
  suggestedMessage?: string | null;
  sourceMessageId?: number | null;
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
  scopedPlanQuestion?: string | null;
  followUpPrompt?: BuildFollowUpPrompt | null;
  runMode: 'user' | 'greeting' | 'runtime-autofix';
  generating: boolean;
  generatingStatus: string | null;
  assistantStatusSteps: string[];
  copilotPolicy: BuildCopilotPolicy | null;
  pageFeedbackEvents: BuildRunEvent[];
  runEvents: BuildRunEvent[];
  runError: string | null;
  activeStreamMessageIds: number[];
  isOwner: boolean;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onChatScroll: () => void;
  draftMessage: string;
  onDraftMessageChange: (value: string) => void;
  onSendMessage: (message: string) => Promise<boolean> | boolean;
  onContinueScopedPlan: () => void;
  onCancelScopedPlan: () => void;
  onAcceptFollowUpPrompt: () => void;
  onDismissFollowUpPrompt: () => void;
  onOpenBuildChatUpload: () => void;
  uploadInFlight: boolean;
  runtimeUploadsModalShown: boolean;
  runtimeUploadAssets: BuildRuntimeUploadAsset[];
  runtimeUploadsNextCursor: number | null;
  runtimeUploadsLoading: boolean;
  runtimeUploadsLoadingMore: boolean;
  runtimeUploadsError: string;
  runtimeUploadDeletingId: number | null;
  onOpenRuntimeUploadsManager: () => void;
  onCloseRuntimeUploadsManager: () => void;
  onLoadMoreRuntimeUploads: () => void;
  onDeleteRuntimeUpload: (asset: BuildRuntimeUploadAsset) => Promise<void> | void;
  twinkleCoins: number;
  purchasingGenerationReset: boolean;
  generationResetError: string;
  onPurchaseGenerationReset: () => Promise<void> | void;
  onStopGeneration: () => void;
  onFixRuntimeObservationMessage: (message: ChatMessage) => Promise<boolean> | boolean;
  onDeleteMessage: (message: ChatMessage) => void;
}

export default function ChatPanel({
  className,
  messages,
  executionPlan,
  scopedPlanQuestion,
  followUpPrompt,
  runMode,
  generating,
  generatingStatus,
  assistantStatusSteps,
  copilotPolicy,
  pageFeedbackEvents,
  runEvents,
  runError,
  activeStreamMessageIds,
  isOwner,
  chatScrollRef,
  chatEndRef,
  onChatScroll,
  draftMessage,
  onDraftMessageChange,
  onSendMessage,
  onContinueScopedPlan,
  onCancelScopedPlan,
  onAcceptFollowUpPrompt,
  onDismissFollowUpPrompt,
  onOpenBuildChatUpload,
  uploadInFlight,
  runtimeUploadsModalShown,
  runtimeUploadAssets,
  runtimeUploadsNextCursor,
  runtimeUploadsLoading,
  runtimeUploadsLoadingMore,
  runtimeUploadsError,
  runtimeUploadDeletingId,
  onOpenRuntimeUploadsManager,
  onCloseRuntimeUploadsManager,
  onLoadMoreRuntimeUploads,
  onDeleteRuntimeUpload,
  twinkleCoins,
  purchasingGenerationReset,
  generationResetError,
  onPurchaseGenerationReset,
  onStopGeneration,
  onFixRuntimeObservationMessage,
  onDeleteMessage
}: ChatPanelProps) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const AI_DISABLED_NOTICE = useViewContext((v) => v.state.aiDisabledNotice);
  const [limitsExpanded, setLimitsExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const aiInputDisabled = AI_FEATURES_DISABLED;
  const currentActivity = useMemo(() => {
    for (let index = runEvents.length - 1; index >= 0; index -= 1) {
      const event = runEvents[index];
      if (!event) continue;
      const message = String(event.message || '').trim();
      if (!message) continue;
      if (String(event.details?.thoughtContent || '').trim()) {
        continue;
      }
      if (
        event.kind === 'action' ||
        event.kind === 'status' ||
        event.kind === 'phase'
      ) {
        return {
          message
        };
      }
    }
    const fallbackStatus =
      assistantStatusSteps.length > 0
        ? String(assistantStatusSteps[assistantStatusSteps.length - 1] || '').trim()
        : '';
    return fallbackStatus ? { message: fallbackStatus } : null;
  }, [assistantStatusSteps, runEvents]);
  const statusStepEntries = useMemo(() => {
    const entries = assistantStatusSteps
      .map((status) => String(status || '').trim())
      .filter(Boolean)
      .map((status) => ({
        status,
        thoughtContent: '',
        thoughtIsComplete: false,
        thoughtIsThinkingHard: false
      }));
    if (entries.length === 0) return entries;
    let currentStepIndex = -1;
    let nextStepIndex = 0;
    for (const event of runEvents) {
      const message = String(event?.message || '').trim();
      if (!message) continue;
      if (
        nextStepIndex < entries.length &&
        message === entries[nextStepIndex].status
      ) {
        currentStepIndex = nextStepIndex;
        nextStepIndex += 1;
      }
      const thoughtContent = String(event?.details?.thoughtContent || '').trim();
      if (!thoughtContent) continue;
      const targetIndex =
        currentStepIndex >= 0 ? currentStepIndex : entries.length - 1;
      if (targetIndex < 0) continue;
      entries[targetIndex] = {
        ...entries[targetIndex],
        thoughtContent,
        thoughtIsComplete: Boolean(event?.details?.isComplete),
        thoughtIsThinkingHard: Boolean(event?.details?.isThinkingHard)
      };
    }
    return entries;
  }, [assistantStatusSteps, runEvents]);

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
        id: 'published-storage',
        label: 'Published build storage',
        used: usage.publishedBuildStorageBytes,
        limit: limits.maxPublishedBuildStorageBytes,
        text: `${formatBytes(usage.publishedBuildStorageBytes)} / ${formatBytes(limits.maxPublishedBuildStorageBytes)}`,
        caption: `${formatBytes(usage.publishedBuildStorageRemaining)} left across ${formatTokenCount(usage.publishedBuildCount)} published build${usage.publishedBuildCount === 1 ? '' : 's'}`,
        color: 'logoBlue'
      }),
      buildLimitProgressItem({
        id: 'runtime-file-storage',
        label: 'Lumine file storage',
        used: usage.runtimeFileStorageBytes,
        limit: limits.maxRuntimeFileStorageBytes,
        text: `${formatBytes(usage.runtimeFileStorageBytes)} / ${formatBytes(limits.maxRuntimeFileStorageBytes)}`,
        caption: `${formatBytes(usage.runtimeFileStorageRemaining)} left across ${formatTokenCount(usage.runtimeFileCount)} uploaded file${usage.runtimeFileCount === 1 ? '' : 's'}`,
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
  const groupedRuntimeUploadAssets = useMemo(() => {
    const groups: Array<{
      key: string;
      buildId: number;
      buildTitle: string;
      buildExists: boolean;
      assets: BuildRuntimeUploadAsset[];
    }> = [];
    const groupMap = new Map<
      string,
      {
        key: string;
        buildId: number;
        buildTitle: string;
        buildExists: boolean;
        assets: BuildRuntimeUploadAsset[];
      }
    >();
    for (const asset of runtimeUploadAssets) {
      const buildExists = Boolean(asset.buildTitle?.trim());
      const buildTitle =
        asset.buildTitle?.trim() ||
        `Deleted build #${formatTokenCount(asset.buildId)}`;
      const key = `${asset.buildId}:${buildTitle}`;
      let group = groupMap.get(key);
      if (!group) {
        group = {
          key,
          buildId: asset.buildId,
          buildTitle,
          buildExists,
          assets: []
        };
        groupMap.set(key, group);
        groups.push(group);
      }
      group.assets.push(asset);
    }
    return groups;
  }, [runtimeUploadAssets]);
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
  const generationResetUi = useMemo(() => {
    if (!copilotPolicy) return null;
    const requestLimits = copilotPolicy.requestLimits;
    const resetCost = Math.max(
      0,
      Math.floor(Number(requestLimits.generationResetCost) || 0)
    );
    const resetPurchasesToday = Math.max(
      0,
      Math.floor(Number(requestLimits.generationResetPurchasesToday) || 0)
    );
    const baseGenerationLimit = Math.max(
      0,
      Math.floor(Number(requestLimits.generationBaseRequestsPerDay) || 0)
    );
    const quotaMaxed =
      requestLimits.generationRequestsPerDay > 0 &&
      requestLimits.generationRequestsRemaining <= 0;
    if (!quotaMaxed || generating || resetCost < 1 || baseGenerationLimit < 1) {
      return null;
    }
    return {
      resetCost,
      resetPurchasesToday,
      baseGenerationLimit,
      hasEnoughCoins: twinkleCoins >= resetCost
    };
  }, [copilotPolicy, generating, twinkleCoins]);
  const showScopedPlanQuickReplies =
    isOwner &&
    executionPlan?.status === 'awaiting_confirmation' &&
    !generating &&
    !draftMessage.trim();
  const visiblePageFeedbackEvents = pageFeedbackEvents.slice(-3).reverse();
  const normalizedScopedPlanQuestion = String(scopedPlanQuestion || '').trim();
  const normalizedFollowUpQuestion = String(followUpPrompt?.question || '').trim();
  const normalizedFollowUpSuggestedMessage = String(
    followUpPrompt?.suggestedMessage || ''
  ).trim();
  const showGenericFollowUpQuickReplies =
    isOwner &&
    runMode === 'user' &&
    !showScopedPlanQuickReplies &&
    !generating &&
    !draftMessage.trim() &&
    Boolean(normalizedFollowUpQuestion) &&
    Boolean(normalizedFollowUpSuggestedMessage);

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
    onDraftMessageChange('No. Instead, ');
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
    if (!messageText || uploadInFlight) return;
    try {
      const didAccept = await Promise.resolve(onSendMessage(messageText));
      if (didAccept) {
        onDraftMessageChange('');
      }
    } catch (error) {
      console.error('Failed to send build message:', error);
    }
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
              font-size: var(--build-workshop-body-font-size);
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
                Quotas
              </span>
            </div>
            {dailyGenerationUsage != null && dailyGenerationBarText && (
              <>
                <div
                  className={css`
                    font-size: var(--build-workshop-label-font-size);
                    font-weight: 700;
                  `}
                >
                  Daily Code Generations
                </div>
                <ProgressBar
                  progress={dailyGenerationUsage}
                  text={dailyGenerationBarText}
                  style={{ marginTop: '-0.2rem' }}
                />
                {generationResetUi ? (
                  <div
                    className={css`
                      margin-top: 0.35rem;
                      display: flex;
                      flex-direction: column;
                      gap: 0.45rem;
                    `}
                  >
                    <div
                      className={css`
                        font-size: var(--build-workshop-meta-font-size);
                        line-height: 1.45;
                        color: var(--chat-text);
                        opacity: 0.78;
                      `}
                    >
                      {`You've used today's full quota. Reset #${generationResetUi.resetPurchasesToday + 1} adds ${formatTokenCount(generationResetUi.baseGenerationLimit)} more generations today.`}
                    </div>
                    <GameCTAButton
                      icon="redo"
                      variant="orange"
                      shiny
                      loading={purchasingGenerationReset}
                      disabled={
                        purchasingGenerationReset ||
                        !generationResetUi.hasEnoughCoins
                      }
                      onClick={onPurchaseGenerationReset}
                    >
                      {generationResetUi.hasEnoughCoins
                        ? `Reset quota (${generationResetUi.resetCost.toLocaleString()} coins)`
                        : `Need ${generationResetUi.resetCost.toLocaleString()} coins (you have ${twinkleCoins.toLocaleString()})`}
                    </GameCTAButton>
                    {generationResetError ? (
                      <div
                        className={css`
                          font-size: var(--build-workshop-meta-font-size);
                          line-height: 1.4;
                          color: ${Color.rose()};
                          font-weight: 700;
                        `}
                      >
                        {generationResetError}
                      </div>
                    ) : null}
                  </div>
                ) : null}
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
                              font-size: var(--build-workshop-label-font-size);
                              font-weight: 800;
                              color: var(--chat-text);
                            `}
                          >
                            {item.label}
                          </span>
                          <span
                            className={css`
                              font-size: var(--build-workshop-small-font-size);
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
                              font-size: var(--build-workshop-small-font-size);
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
                    <LimitStat
                      label="Uploaded file max"
                      value={formatBytes(copilotPolicy.limits.maxRuntimeFileBytes)}
                    />
                  </div>
                  <div
                    className={css`
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      gap: 0.75rem;
                      flex-wrap: wrap;
                      border: 1px solid var(--ui-border);
                      border-radius: 12px;
                      background: #fff;
                      padding: 0.9rem 1rem;
                    `}
                  >
                    <div
                      className={css`
                        display: flex;
                        flex-direction: column;
                        gap: 0.2rem;
                      `}
                    >
                      <span
                        className={css`
                          font-size: var(--build-workshop-label-font-size);
                          font-weight: 800;
                          color: var(--chat-text);
                        `}
                      >
                        Manage uploaded files
                      </span>
                      <span
                        className={css`
                          font-size: var(--build-workshop-meta-font-size);
                          color: var(--chat-text);
                          opacity: 0.7;
                        `}
                      >
                        Delete older Lumine file uploads across your builds to
                        free space.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenRuntimeUploadsManager}
                      className={css`
                        border: 1px solid rgba(36, 99, 235, 0.18);
                        background: rgba(59, 130, 246, 0.08);
                        color: #1d4ed8;
                        border-radius: 999px;
                        padding: 0.46rem 0.95rem;
                        font-size: var(--build-workshop-meta-font-size);
                        font-weight: 800;
                        cursor: pointer;
                        white-space: nowrap;
                      `}
                    >
                      Manage uploads
                    </button>
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
                  font-size: var(--build-workshop-small-font-size);
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
        {visiblePageFeedbackEvents.length > 0 ? (
          <div
            className={css`
              display: grid;
              gap: 0.55rem;
            `}
          >
            {visiblePageFeedbackEvents.map((event) => (
              <BuildPageFeedbackNotice key={event.id} event={event} />
            ))}
          </div>
        ) : null}
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
          messages={messages}
          runMode={runMode}
          generating={generating}
          generatingStatus={generatingStatus}
          assistantStatusSteps={assistantStatusSteps}
          currentActivity={currentActivity}
          statusStepEntries={statusStepEntries}
          runError={runError}
          activeStreamMessageIds={activeStreamMessageIds}
          isOwner={isOwner}
          chatEndRef={chatEndRef}
          onFixRuntimeObservationMessage={onFixRuntimeObservationMessage}
          onDeleteMessage={onDeleteMessage}
        />
      </div>

      {isOwner && !limitsExpanded && (
        <div
          className={css`
            padding: 0.9rem 1rem 1.1rem;
            background: #fff;
          `}
        >
          {(showScopedPlanQuickReplies || showGenericFollowUpQuickReplies) && (
            <div
              className={css`
                display: grid;
                gap: 0.65rem;
                margin-bottom: 0.7rem;
              `}
            >
              {(showScopedPlanQuickReplies
                ? normalizedScopedPlanQuestion
                : normalizedFollowUpQuestion) && (
                <div
                  className={css`
                    font-size: var(--build-workshop-prompt-font-size);
                    line-height: 1.45;
                    color: var(--chat-text);
                    font-weight: 700;
                  `}
                >
                  {showScopedPlanQuickReplies
                    ? normalizedScopedPlanQuestion
                    : normalizedFollowUpQuestion}
                </div>
              )}
              <div
                className={css`
                  display: flex;
                  flex-wrap: wrap;
                  gap: 0.45rem;
                `}
              >
                <button
                  type="button"
                  onClick={
                    showScopedPlanQuickReplies
                      ? onContinueScopedPlan
                      : onAcceptFollowUpPrompt
                  }
                  className={css`
                    border: 1px solid ${Color.green(0.24)};
                    background: ${Color.green(0.12)};
                    color: ${Color.green()};
                    border-radius: 999px;
                    padding: 0.5rem 0.9rem;
                    font-size: var(--build-workshop-choice-font-size);
                    font-weight: 800;
                    cursor: pointer;
                    transition:
                      background-color 0.16s ease,
                      border-color 0.16s ease,
                      color 0.16s ease;
                    &:hover,
                    &:focus-visible {
                      border-color: ${Color.green(0.42)};
                      background: ${Color.green(0.2)};
                      color: ${Color.green()};
                    }
                  `}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={
                    showScopedPlanQuickReplies
                      ? onCancelScopedPlan
                      : onDismissFollowUpPrompt
                  }
                  className={css`
                    border: 1px solid rgba(148, 163, 184, 0.28);
                    background: rgba(148, 163, 184, 0.1);
                    color: #334155;
                    border-radius: 999px;
                    padding: 0.5rem 0.9rem;
                    font-size: var(--build-workshop-choice-font-size);
                    font-weight: 800;
                    cursor: pointer;
                    transition:
                      background-color 0.16s ease,
                      border-color 0.16s ease,
                      color 0.16s ease;
                    &:hover,
                    &:focus-visible {
                      border-color: rgba(100, 116, 139, 0.42);
                      background: rgba(148, 163, 184, 0.18);
                      color: #1e293b;
                    }
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
                    padding: 0.5rem 0.9rem;
                    font-size: var(--build-workshop-choice-font-size);
                    font-weight: 800;
                    cursor: pointer;
                    transition:
                      background-color 0.16s ease,
                      border-color 0.16s ease,
                      color 0.16s ease;
                    &:hover,
                    &:focus-visible {
                      border-color: rgba(217, 119, 6, 0.36);
                      background: rgba(245, 158, 11, 0.18);
                      color: #92400e;
                    }
                  `}
                >
                  No (explain what you want instead)
                </button>
              </div>
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
              onChange={(e) => onDraftMessageChange(e.target.value)}
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
                font-size: var(--build-workshop-input-font-size);
                font-family: inherit;
                min-height: 48px;
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
              onClick={onOpenBuildChatUpload}
              disabled={aiInputDisabled || generating || uploadInFlight}
              variant="neutral"
              size="md"
              icon="upload"
              style={{ minWidth: '3rem' }}
            />
            <GameCTAButton
              onClick={() => void handleSubmitMessage()}
              disabled={aiInputDisabled || uploadInFlight || !draftMessage.trim()}
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
        </div>
      )}
      {runtimeUploadsModalShown && (
        <Modal
          modalKey="BuildRuntimeUploadsModal"
          isOpen
          onClose={onCloseRuntimeUploadsManager}
          title="Manage uploads"
          size="lg"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={onCloseRuntimeUploadsManager}
                uppercase={false}
              >
                Close
              </Button>
              {runtimeUploadsNextCursor && (
                <Button
                  color="blue"
                  variant="solid"
                  loading={runtimeUploadsLoadingMore}
                  onClick={onLoadMoreRuntimeUploads}
                  uppercase={false}
                >
                  Load more
                </Button>
              )}
            </>
          }
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1rem;
              width: 100%;
              max-width: 100%;
              min-height: 0;
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
              }
            `}
          >
            {copilotPolicy && (
              <div
                className={css`
                  border: 1px solid var(--ui-border);
                  border-radius: 12px;
                  background: var(--chat-bg);
                  padding: 0.95rem 1rem;
                `}
              >
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.8rem;
                    margin-bottom: 0.45rem;
                    flex-wrap: wrap;
                  `}
                >
                  <span
                    className={css`
                      font-size: 1.3rem;
                      font-weight: 800;
                      color: var(--chat-text);
                    `}
                  >
                    Lumine file storage
                  </span>
                  <span
                    className={css`
                      font-size: 1rem;
                      color: var(--chat-text);
                      opacity: 0.72;
                    `}
                  >
                    {formatBytes(copilotPolicy.usage.runtimeFileStorageRemaining)} left
                  </span>
                </div>
                <ProgressBar
                  progress={Math.max(
                    0,
                    Math.min(
                      100,
                      (copilotPolicy.usage.runtimeFileStorageBytes /
                        Math.max(
                          copilotPolicy.limits.maxRuntimeFileStorageBytes,
                          1
                        )) *
                        100
                    )
                  )}
                  text={`${formatBytes(copilotPolicy.usage.runtimeFileStorageBytes)} / ${formatBytes(copilotPolicy.limits.maxRuntimeFileStorageBytes)}`}
                  color="pink"
                />
                <div
                  className={css`
                    margin-top: 0.45rem;
                    font-size: 1rem;
                    color: var(--chat-text);
                    opacity: 0.72;
                  `}
                >
                  {formatTokenCount(copilotPolicy.usage.runtimeFileCount)} uploaded
                  file{copilotPolicy.usage.runtimeFileCount === 1 ? '' : 's'} across
                  your builds
                </div>
              </div>
            )}
            {runtimeUploadsError && (
              <div
                className={css`
                  border: 1px solid rgba(220, 38, 38, 0.16);
                  border-radius: 12px;
                  background: rgba(254, 242, 242, 0.96);
                  padding: 0.85rem 0.95rem;
                  color: #b91c1c;
                  font-size: 1.1rem;
                  font-weight: 700;
                `}
              >
                {runtimeUploadsError}
              </div>
            )}
            {runtimeUploadsLoading && runtimeUploadAssets.length === 0 ? (
              <div
                className={css`
                  border: 1px dashed var(--ui-border);
                  border-radius: 12px;
                  padding: 1.2rem 1rem;
                  text-align: center;
                  font-size: 1.1rem;
                  color: var(--chat-text);
                  opacity: 0.72;
                `}
              >
                Loading uploaded files...
              </div>
            ) : groupedRuntimeUploadAssets.length === 0 ? (
              <div
                className={css`
                  border: 1px dashed var(--ui-border);
                  border-radius: 12px;
                  padding: 1.2rem 1rem;
                  text-align: center;
                  font-size: 1.1rem;
                  color: var(--chat-text);
                  opacity: 0.72;
                `}
              >
                No uploaded files yet.
              </div>
            ) : (
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  gap: 0.9rem;
                  min-height: 0;
                  max-height: min(62vh, 620px);
                  overflow-y: auto;
                  padding-right: 0.15rem;
                `}
              >
                {groupedRuntimeUploadAssets.map((group) => (
                  <section
                    key={group.key}
                    className={css`
                      display: grid;
                      grid-template-rows: auto minmax(0, 1fr);
                      border: 1px solid var(--ui-border);
                      border-radius: 12px;
                      background: #fff;
                      overflow: hidden;
                      max-height: min(36vh, 320px);
                      @media (max-width: ${mobileMaxWidth}) {
                        max-height: min(40vh, 320px);
                      }
                    `}
                  >
                    <div
                      className={css`
                        padding: 0.85rem 1rem;
                        border-bottom: 1px solid var(--ui-border);
                        background: rgba(248, 250, 252, 0.9);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.75rem;
                        flex-wrap: wrap;
                      `}
                    >
                      <div
                        className={css`
                          display: flex;
                          flex-direction: column;
                          gap: 0.2rem;
                        `}
                      >
                        <span
                          className={css`
                            font-size: 1.2rem;
                            font-weight: 800;
                            color: var(--chat-text);
                          `}
                        >
                          {group.buildTitle}
                        </span>
                        <span
                          className={css`
                            font-size: 1rem;
                            color: var(--chat-text);
                            opacity: 0.68;
                          `}
                        >
                          Build #{formatTokenCount(group.buildId)}
                        </span>
                      </div>
                      {group.buildExists ? (
                        <a
                          href={`/build/${group.buildId}`}
                          className={css`
                            font-size: 1rem;
                            font-weight: 800;
                            color: #1d4ed8;
                            text-decoration: none;
                          `}
                        >
                          Open build
                        </a>
                      ) : (
                        <span
                          className={css`
                            font-size: 1rem;
                            color: var(--chat-text);
                            opacity: 0.6;
                          `}
                        >
                          Build deleted
                        </span>
                      )}
                    </div>
                    <div
                      className={css`
                        display: flex;
                        flex-direction: column;
                        min-height: 0;
                        overflow-y: auto;
                        overscroll-behavior: contain;
                      `}
                    >
                      {group.assets.map((asset) => (
                        <div
                          key={asset.id}
                          className={css`
                            display: grid;
                            grid-template-columns: auto minmax(0, 1fr) auto;
                            gap: 0.85rem;
                            align-items: center;
                            padding: 0.9rem 1rem;
                            border-top: 1px solid rgba(226, 232, 240, 0.65);
                            &:first-child {
                              border-top: none;
                            }
                            @media (max-width: ${mobileMaxWidth}) {
                              grid-template-columns: minmax(0, 1fr);
                            }
                          `}
                        >
                          {asset.thumbUrl && asset.fileType === 'image' ? (
                            <img
                              src={asset.thumbUrl}
                              alt={asset.originalFileName || asset.fileName}
                              className={css`
                                width: 56px;
                                height: 56px;
                                object-fit: cover;
                                border-radius: 12px;
                                border: 1px solid var(--ui-border);
                              `}
                            />
                          ) : (
                            <div
                              className={css`
                                width: 56px;
                                height: 56px;
                                border-radius: 12px;
                                border: 1px solid var(--ui-border);
                                background: rgba(59, 130, 246, 0.08);
                                color: #1d4ed8;
                                display: grid;
                                place-items: center;
                                font-size: 0.9rem;
                                font-weight: 800;
                                text-transform: uppercase;
                              `}
                            >
                              {asset.fileType}
                            </div>
                          )}
                          <div
                            className={css`
                              min-width: 0;
                              display: flex;
                              flex-direction: column;
                              gap: 0.24rem;
                            `}
                          >
                            <a
                              href={asset.url}
                              target="_blank"
                              rel="noreferrer"
                              className={css`
                                font-size: 1.1rem;
                                font-weight: 800;
                                color: var(--chat-text);
                                text-decoration: none;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                              `}
                            >
                              {asset.originalFileName || asset.fileName}
                            </a>
                            <div
                              className={css`
                                font-size: 1rem;
                                color: var(--chat-text);
                                opacity: 0.72;
                                display: flex;
                                flex-wrap: wrap;
                                gap: 0.35rem;
                              `}
                            >
                              <span>{formatBytes(asset.sizeBytes)}</span>
                              <span>•</span>
                              <span>{timeSince(asset.createdAt)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void onDeleteRuntimeUpload(asset)}
                            disabled={runtimeUploadDeletingId === asset.id}
                            className={css`
                              justify-self: end;
                              border: 1px solid rgba(220, 38, 38, 0.16);
                              background: rgba(254, 242, 242, 0.96);
                              color: #b91c1c;
                              border-radius: 999px;
                              padding: 0.48rem 0.95rem;
                              font-size: 1rem;
                              font-weight: 800;
                              cursor: pointer;
                              white-space: nowrap;
                              &:disabled {
                                cursor: wait;
                                opacity: 0.62;
                              }
                              @media (max-width: ${mobileMaxWidth}) {
                                justify-self: start;
                              }
                            `}
                          >
                            {runtimeUploadDeletingId === asset.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function BuildRunFailureNotice({ runError }: { runError: string }) {
  const normalizedRunError = String(runError || '').trim();
  if (!normalizedRunError) return null;

  return (
    <div
      className={css`
        border: 1px solid ${Color.rose(0.32)};
        background: ${Color.rose(0.08)};
        border-radius: 10px;
        padding: 0.75rem 0.8rem;
        display: grid;
        gap: 0.45rem;
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: ${Color.rose()};
          font-weight: 800;
          font-size: var(--build-workshop-label-font-size);
        `}
      >
        <Icon icon="exclamation-triangle" />
        <span>Last run failed</span>
      </div>
      <div
        className={css`
          font-size: var(--build-workshop-body-font-size);
          line-height: 1.45;
          color: var(--chat-text);
          white-space: pre-wrap;
          word-break: break-word;
        `}
      >
        {normalizedRunError}
      </div>
    </div>
  );
}

function BuildPageFeedbackNotice({ event }: { event: BuildRunEvent }) {
  const normalizedMessage = String(event.message || '').trim();
  if (!normalizedMessage) return null;

  const label = formatStepLabel(String(event.phase || 'build').trim() || 'build');
  const normalizedMessageKey = normalizedMessage.toLowerCase();
  const isErrorLike =
    label === 'Error' ||
    normalizedMessageKey.startsWith('unable ') ||
    normalizedMessageKey.startsWith('please wait') ||
    normalizedMessageKey.includes('failed');
  const isWarningLike = normalizedMessageKey.includes(
    'without a thumbnail instead'
  );
  const accentColor = isErrorLike
    ? Color.rose()
    : isWarningLike
      ? '#b45309'
      : '#1d4ed8';
  const backgroundColor = isErrorLike
    ? 'rgba(244, 63, 94, 0.08)'
    : isWarningLike
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(59, 130, 246, 0.08)';
  const borderColor = isErrorLike
    ? 'rgba(244, 63, 94, 0.16)'
    : isWarningLike
      ? 'rgba(245, 158, 11, 0.2)'
      : 'rgba(59, 130, 246, 0.18)';

  return (
    <div
      className={css`
        border: 1px solid ${borderColor};
        border-radius: 12px;
        background: ${backgroundColor};
        padding: 0.7rem 0.8rem;
        display: grid;
        gap: 0.3rem;
      `}
    >
      <div
        className={css`
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: var(--build-workshop-small-font-size);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0;
          color: ${accentColor};
        `}
      >
        <Icon icon={isErrorLike ? 'exclamation-triangle' : 'info-circle'} />
        {label}
      </div>
      <div
        className={css`
          font-size: var(--build-workshop-body-font-size);
          line-height: 1.45;
          color: var(--chat-text);
          white-space: pre-wrap;
          word-break: break-word;
        `}
      >
        {normalizedMessage}
      </div>
    </div>
  );
}

const BuildChatTranscript = React.memo(function BuildChatTranscript({
  messages,
  runMode,
  generating,
  generatingStatus,
  assistantStatusSteps,
  currentActivity,
  statusStepEntries,
  runError,
  activeStreamMessageIds,
  isOwner,
  chatEndRef,
  onFixRuntimeObservationMessage,
  onDeleteMessage
}: {
  messages: ChatMessage[];
  runMode: 'user' | 'greeting' | 'runtime-autofix';
  generating: boolean;
  generatingStatus: string | null;
  assistantStatusSteps: string[];
  currentActivity: BuildCurrentActivity | null;
  statusStepEntries: BuildStatusStepEntry[];
  runError: string | null;
  activeStreamMessageIds: number[];
  isOwner: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onFixRuntimeObservationMessage: (message: ChatMessage) => Promise<boolean> | boolean;
  onDeleteMessage: (message: ChatMessage) => void;
}) {
  const normalizedRunError =
    !generating && typeof runError === 'string' ? runError.trim() : '';
  const shouldShowRunFailureNotice =
    Boolean(normalizedRunError) &&
    !messages.some(
      (message) =>
        message.role === 'assistant' &&
        String(message.content || '').trim() === normalizedRunError
    );
  const emptyState = (
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
      <p
        style={{
          margin: 0,
          fontSize: 'var(--build-workshop-message-font-size)'
        }}
      >
        {isOwner
          ? 'Describe what you want to build and I will help you create it.'
          : 'No messages yet.'}
      </p>
    </div>
  );

  if (messages.length === 0) {
    if (!normalizedRunError) {
      return emptyState;
    }
    return (
      <div
        className={css`
          display: grid;
          gap: 1rem;
        `}
      >
        <BuildRunFailureNotice runError={normalizedRunError} />
        {emptyState}
        <div ref={chatEndRef} />
      </div>
    );
  }

  const lastAssistantIndex = findLastIndex(
    messages,
    (message) =>
      message.role === 'assistant' && message.source !== 'runtime_observation'
  );

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 1rem;
      `}
    >
      {shouldShowRunFailureNotice ? (
        <BuildRunFailureNotice runError={normalizedRunError} />
      ) : null}
      {messages.map((message, index) => {
        return (
          <BuildChatMessageRow
            key={message.id}
            message={message}
            messages={messages}
            runMode={runMode}
            index={index}
            lastAssistantIndex={lastAssistantIndex}
            generating={generating}
            generatingStatus={generatingStatus}
            assistantStatusSteps={assistantStatusSteps}
            currentActivity={currentActivity}
            statusStepEntries={statusStepEntries}
            activeStreamMessageIds={activeStreamMessageIds}
            isOwner={isOwner}
            onFixRuntimeObservationMessage={onFixRuntimeObservationMessage}
            onDeleteMessage={onDeleteMessage}
          />
        );
      })}
      <div ref={chatEndRef} />
    </div>
  );
});

function BuildChatMessageRow({
  message,
  messages,
  runMode,
  index,
  lastAssistantIndex,
  generating,
  generatingStatus,
  assistantStatusSteps,
  currentActivity,
  statusStepEntries,
  activeStreamMessageIds,
  isOwner,
  onFixRuntimeObservationMessage,
  onDeleteMessage
}: {
  message: ChatMessage;
  messages: ChatMessage[];
  runMode: 'user' | 'greeting' | 'runtime-autofix';
  index: number;
  lastAssistantIndex: number;
  generating: boolean;
  generatingStatus: string | null;
  assistantStatusSteps: string[];
  currentActivity: BuildCurrentActivity | null;
  statusStepEntries: BuildStatusStepEntry[];
  activeStreamMessageIds: number[];
  isOwner: boolean;
  onFixRuntimeObservationMessage: (message: ChatMessage) => Promise<boolean> | boolean;
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
  const hasMeaningfulAssistantContent =
    message.role === 'assistant' &&
    !isBuildAssistantPlaceholderContent(message.content);
  const isStreamingTarget =
    generating &&
    (isActiveStreamMessage ||
      (activeStreamMessageIds.length === 0 &&
        message.role === 'assistant' &&
        isLastAssistant &&
        (runMode === 'greeting' || !hasMeaningfulAssistantContent)));
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
          {!isStreamingTarget ? (
            <button
              onClick={() => onDeleteMessage(message)}
              title="Delete message"
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
              `} build-chat-delete-button`}
            >
              <Icon icon="times-circle" />
            </button>
          ) : null}
          <div
            className={css`
              max-width: 85%;
              padding: 0.85rem 1.05rem;
              border-radius: 12px;
              background: ${message.role === 'user'
                ? 'var(--theme-bg)'
                : 'var(--chat-bg)'};
              color: ${message.role === 'user'
                ? 'var(--theme-text)'
                : 'var(--chat-text)'};
              word-break: break-word;
              font-size: var(--build-workshop-message-font-size);
              line-height: 1.48;
              border: 1px solid var(--ui-border);
            `}
          >
            {message.role === 'assistant' ? (
              <AssistantMessage
                message={message}
                messages={messages}
                generating={generating}
                generatingStatus={generatingStatus}
                statusSteps={isStreamingTarget ? assistantStatusSteps : []}
                currentActivity={isStreamingTarget ? currentActivity : null}
                statusStepEntries={isStreamingTarget ? statusStepEntries : []}
                isOwner={isOwner}
                onFixRuntimeObservationMessage={onFixRuntimeObservationMessage}
                isStreamingTarget={isStreamingTarget}
              />
            ) : (
              <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
            )}
          </div>
          <span
            className={css`
              font-size: var(--build-workshop-message-meta-font-size);
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
  generating,
  generatingStatus,
  statusSteps,
  currentActivity,
  statusStepEntries,
  isOwner,
  onFixRuntimeObservationMessage,
  isStreamingTarget
}: {
  message: ChatMessage;
  messages: ChatMessage[];
  generating: boolean;
  generatingStatus: string | null;
  statusSteps: string[];
  currentActivity: BuildCurrentActivity | null;
  statusStepEntries: BuildStatusStepEntry[];
  isOwner: boolean;
  onFixRuntimeObservationMessage: (message: ChatMessage) => Promise<boolean> | boolean;
  isStreamingTarget: boolean;
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
  const rawVisibleMessageContent = isBuildAssistantPlaceholderContent(
    message.content
  )
    ? ''
    : message.content;
  const visibleMessageContent = rawVisibleMessageContent;
  const hasStreamingCodePreview =
    generating &&
    isStreamingTarget &&
    !message.codeGenerated &&
    Boolean(message.streamCodePreview && message.streamCodePreview.trim());
  const normalizedCurrentActivityMessage = String(
    currentActivity?.message || ''
  ).trim();
  const fallbackActivityMessage = useMemo(() => {
    return formatStepLabel(String(generatingStatus || 'thinking').trim());
  }, [generatingStatus]);
  const displayedCurrentActivityMessage =
    normalizedCurrentActivityMessage || fallbackActivityMessage;
  const showCurrentActivity = generating && isStreamingTarget;
  const shouldShowFallbackStep =
    generating &&
    isStreamingTarget &&
    statusSteps.length === 0 &&
    !rawVisibleMessageContent;
  const displayedStatusStepEntries = shouldShowFallbackStep
    ? [
        {
          status: String(generatingStatus || 'thinking').trim() || 'thinking',
          thoughtContent: '',
          thoughtIsComplete: false,
          thoughtIsThinkingHard: false
        }
      ]
    : statusStepEntries.length > 0
      ? statusStepEntries
      : statusSteps
          .map((status) => String(status || '').trim())
          .filter(Boolean)
          .map((status) => ({
            status,
            thoughtContent: '',
            thoughtIsComplete: false,
            thoughtIsThinkingHard: false
          }));
  const waitingForCurrentAssistantResponse = generating && isStreamingTarget;
  const showNoCodeWarning =
    !hasCodePayload &&
    !waitingForCurrentAssistantResponse &&
    (looksLikeCompletedCodeChangeClaim(visibleMessageContent) ||
      message.billingState === 'not_charged' ||
      message.billingState === 'pending');
  const uploadProgressPercent = Number(message.uploadProgressPercent ?? -1);
  const showUploadProgressBar =
    !hasCodePayload &&
    message.role === 'assistant' &&
    Number.isFinite(uploadProgressPercent) &&
    uploadProgressPercent >= 0;
  const showFixRuntimeObservationButton =
    isOwner &&
    message.source === 'runtime_observation' &&
    Boolean(String(message.content || '').trim());

  return (
    <div>
      {showUploadProgressBar && (
        <div
          className={css`
            margin-bottom: 0.55rem;
          `}
        >
          <div
            className={css`
              height: 0.38rem;
              width: 100%;
              overflow: hidden;
              border-radius: 999px;
              background: rgba(148, 163, 184, 0.18);
            `}
          >
            <div
              className={css`
                height: 100%;
                border-radius: 999px;
                background: linear-gradient(
                  90deg,
                  ${Color.logoBlue(0.82)},
                  ${Color.green(0.9)}
                );
                transition: width 220ms ease;
              `}
              style={{
                width: `${Math.max(3, Math.min(100, uploadProgressPercent))}%`
              }}
            />
          </div>
          <div
            className={css`
              margin-top: 0.3rem;
              display: flex;
              justify-content: flex-end;
              font-size: var(--build-workshop-small-font-size);
              color: var(--chat-text);
              opacity: 0.58;
            `}
          >
            {Math.round(Math.max(0, Math.min(100, uploadProgressPercent)))}%
          </div>
        </div>
      )}
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
              font-size: var(--build-workshop-meta-font-size);
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
                    font-size: var(--build-workshop-small-font-size);
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
                  font-size: var(--build-workshop-small-font-size);
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
            font-size: var(--build-workshop-meta-font-size);
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
              font-size: var(--build-workshop-meta-font-size);
              font-weight: 700;
              color: ${Color.orange()};
            `}
          >
            <Icon icon="exclamation-triangle" />
            No code changes were applied
          </div>
          <div
            className={css`
              font-size: var(--build-workshop-meta-font-size);
              line-height: 1.35;
              color: var(--chat-text);
              opacity: 0.85;
            `}
          >
            {message.billingState === 'not_charged'
              ? 'No workspace changes were saved, and this run was not charged.'
              : message.billingState === 'pending'
                ? 'No workspace changes were saved. Billing reconciliation is still pending.'
                : 'Lumine replied like it made changes, but it did not return updated code. Your workspace stayed the same.'}
          </div>
        </div>
      )}
      {visibleMessageContent ? (
        <RichText isAIMessage aiActionPlacement="inline" maxLines={15}>
          {visibleMessageContent}
        </RichText>
      ) : null}
      {showFixRuntimeObservationButton && (
        <div
          className={css`
            margin-top: ${visibleMessageContent ? '0.8rem' : '0'};
            display: flex;
            justify-content: center;
          `}
        >
          <GameCTAButton
            disabled={isStreamingTarget}
            onClick={() => void onFixRuntimeObservationMessage(message)}
            variant="pink"
            size="md"
            shiny
            style={{
              minWidth: '10.5rem',
              justifyContent: 'center'
            }}
          >
            Fix It
          </GameCTAButton>
        </div>
      )}
      {showCurrentActivity && (
        <div
          className={css`
            margin-top: ${visibleMessageContent ? '0.55rem' : '0'};
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
              font-size: var(--build-workshop-tiny-font-size);
              font-weight: 800;
              letter-spacing: 0;
              text-transform: uppercase;
              color: ${Color.logoBlue()};
            `}
          >
            Current Activity
          </div>
          <div
            className={css`
              font-size: var(--build-workshop-meta-font-size);
              line-height: 1.4;
            `}
          >
            {displayedCurrentActivityMessage}
          </div>
        </div>
      )}
      {displayedStatusStepEntries.length > 0 && (
        <StatusStepLog steps={displayedStatusStepEntries} />
      )}
    </div>
  );
}

function StatusStepLog({ steps }: { steps: BuildStatusStepEntry[] }) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        margin-top: 0.5rem;
        font-size: var(--build-workshop-meta-font-size);
        font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
      `}
    >
      {steps.map((step, index) => {
        const isCurrent = index === steps.length - 1;
        const label = formatStepLabel(step.status);
        return (
          <div
            key={index}
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.2rem;
              color: ${isCurrent ? 'var(--chat-text)' : Color.gray()};
              line-height: 1.5;
            `}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.4rem;
              `}
            >
              {isCurrent ? (
                <span style={{ color: Color.logoBlue() }}>&#9679;</span>
              ) : (
                <Icon
                  icon="check"
                  style={{
                    color: Color.green(),
                    fontSize: 'var(--build-workshop-tiny-font-size)'
                  }}
                />
              )}
              <span>
                {label}
                {isCurrent && <AnimatedDots />}
              </span>
            </div>
            {step.thoughtContent && (
              <div
                className={css`
                  margin-left: 1.15rem;
                  display: grid;
                  gap: 0.22rem;
                `}
              >
                <div
                  className={css`
                    padding: 0.42rem 0.58rem;
                    border-radius: 7px;
                    background: rgba(52, 109, 255, 0.05);
                    border-left: 3px solid
                      ${step.thoughtIsThinkingHard
                        ? Color.orange()
                        : Color.logoBlue()};
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-family: inherit;
                    font-size: var(--build-workshop-small-font-size);
                    line-height: 1.45;
                    color: var(--chat-text);
                    opacity: 0.94;
                  `}
                >
                  {step.thoughtContent}
                  {!step.thoughtIsComplete && (
                    <AnimatedDots style={{ marginLeft: '0.18rem' }} />
                  )}
                </div>
                <div
                  className={css`
                    display: inline-flex;
                    align-items: center;
                    gap: 0.12rem;
                    font-size: var(--build-workshop-tiny-font-size);
                    line-height: 1.1;
                    font-weight: 700;
                    color: ${step.thoughtIsThinkingHard
                      ? Color.orange()
                      : Color.logoBlue()};
                    opacity: 0.92;
                  `}
                >
                  <span>
                    {step.thoughtIsThinkingHard ? 'Thinking hard' : 'Thinking'}
                  </span>
                  <AnimatedDots />
                </div>
              </div>
            )}
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

function AnimatedDots({ style }: { style?: React.CSSProperties }) {
  return (
    <span
      style={style}
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
          font-size: var(--build-workshop-meta-font-size);
          font-weight: 700;
          color: var(--chat-text);
          opacity: 0.72;
        `}
      >
        {label}
      </span>
      <span
        className={css`
          font-size: var(--build-workshop-label-font-size);
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
