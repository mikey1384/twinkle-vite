import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import Icon from '~/components/Icon';
import { useViewContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import Composer from './Composer';
import Header from './Header';
import RuntimeUploadsModal from './RuntimeUploadsModal';
import Transcript from './Transcript';
import { type ChatPanelCommunicationMode, type ChatPanelProps } from './types';
import { formatScaledRem } from './utils';

const panelClass = css`
  display: flex;
  flex-direction: column;
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
  @media (max-width: ${mobileMaxWidth}) {
    border-right: none;
    border-bottom: 1px solid var(--ui-border);
  }
`;

const communicationTabsClass = css`
  display: flex;
  justify-content: center;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
`;

const communicationHeaderClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
  @media (max-width: 44rem) {
    grid-template-columns: 1fr;
    justify-items: start;
  }
`;

const communicationHeaderTabsSlotClass = css`
  justify-self: center;
  max-width: 100%;
  @media (max-width: 44rem) {
    justify-self: start;
    overflow-x: auto;
  }
`;

const communicationHeaderSpacerClass = css`
  min-width: 0;
`;

const mainProjectButtonClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: var(--chat-text);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.56rem 0.85rem;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.1);
  white-space: nowrap;
  &:hover {
    border-color: var(--ui-border-strong);
    background: #f8fbff;
  }
`;

const scrollAreaClass = css`
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.2rem;
  background: #fff;
  min-height: 0;
`;

const peoplePaneClass = css`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #fff;
`;

type CommunicationMode = ChatPanelCommunicationMode;
const LUMINE_BOTTOM_SCROLL_THRESHOLD = 120;

export default function ChatPanel({
  className,
  workshopScale = 1,
  preferredCommunicationMode,
  onCommunicationModeChange,
  communicationScrollTops,
  onCommunicationScrollChange,
  showMainProjectNavigation,
  onOpenMainProject,
  peoplePanel,
  versionsPanel,
  luminePanelOverride,
  lumineTabLabel = 'Lumine',
  lumineTabIcon = 'sparkles',
  lumineChatVisibilityControl,
  messages,
  executionPlan,
  scopedPlanQuestion,
  followUpPrompt,
  runMode,
  generating,
  generatingStatus,
  assistantStatusSteps,
  copilotPolicy,
  aiUsagePolicy,
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
  const normalizedWorkshopScale = Number.isFinite(workshopScale)
    ? Math.max(0.96, Math.min(1.25, workshopScale))
    : 1;
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const AI_DISABLED_NOTICE = useViewContext((v) => v.state.aiDisabledNotice);
  const [limitsExpanded, setLimitsExpanded] = useState(false);
  const [communicationMode, setCommunicationMode] = useState<CommunicationMode>(
    () => normalizeCommunicationMode(preferredCommunicationMode)
  );
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const communicationScrollTopsRef = useRef(communicationScrollTops);
  const onCommunicationScrollChangeRef = useRef(onCommunicationScrollChange);
  const lumineScrollSaveTimeoutRef = useRef<number | null>(null);
  const pendingLumineScrollTopRef = useRef<number | null>(null);
  const lastSavedLumineScrollTopRef = useRef<number | null>(null);
  const lumineScrollSnapshotRef = useRef<{
    scrollTop: number;
    stickToBottom: boolean;
  } | null>(null);
  communicationScrollTopsRef.current = communicationScrollTops;
  onCommunicationScrollChangeRef.current = onCommunicationScrollChange;
  const hasPeoplePanel = Boolean(peoplePanel);
  const mainProjectNavigationShown =
    Boolean(showMainProjectNavigation) && Boolean(onOpenMainProject);
  const communicationOptions = useMemo(() => {
    const options: Array<{
      value: CommunicationMode;
      label: string;
      icon: string;
    }> = [];
    if (luminePanelOverride) {
      options.push({
        value: 'versions',
        label: lumineTabLabel,
        icon: lumineTabIcon
      });
    } else {
      options.push({
        value: 'lumine',
        label: lumineTabLabel,
        icon: lumineTabIcon
      });
      if (versionsPanel) {
        options.push({
          value: 'versions',
          label: 'Branches',
          icon: 'code-branch'
        });
      }
    }
    if (hasPeoplePanel) {
      options.push({ value: 'people', label: 'Team', icon: 'comments' });
    }
    return options;
  }, [
    hasPeoplePanel,
    luminePanelOverride,
    lumineTabIcon,
    lumineTabLabel,
    versionsPanel
  ]);
  const activeCommunicationMode = communicationOptions.some(
    (option) => option.value === communicationMode
  )
    ? communicationMode
    : communicationOptions[0]?.value || 'lumine';
  const energyPolicy = aiUsagePolicy;
  const energyUnavailable =
    !!energyPolicy &&
    typeof energyPolicy.energyRemaining === 'number' &&
    energyPolicy.energyRemaining <= 0;
  const aiInputDisabled = AI_FEATURES_DISABLED || energyUnavailable;
  const aiInputDisabledNotice = AI_FEATURES_DISABLED
    ? AI_DISABLED_NOTICE
    : energyUnavailable
      ? 'Recharge AI Energy to use Lumine.'
      : '';
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
        ? String(
            assistantStatusSteps[assistantStatusSteps.length - 1] || ''
          ).trim()
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
  const generationResetUi = useMemo(() => {
    if (!aiUsagePolicy) return null;
    const resetCost = Math.max(
      0,
      Math.floor(
        Number(aiUsagePolicy.resetCost ?? aiUsagePolicy.generationResetCost) ||
          0
      )
    );
    const resetPurchasesToday = Math.max(
      0,
      Math.floor(
        Number(
          aiUsagePolicy.resetPurchasesToday ??
            aiUsagePolicy.generationResetPurchasesToday
        ) || 0
      )
    );
    const quotaMaxed =
      typeof aiUsagePolicy.energyRemaining === 'number'
        ? aiUsagePolicy.energyRemaining <= 0
        : Number(aiUsagePolicy.generationRequestsPerDay || 0) > 0 &&
          Number(aiUsagePolicy.generationRequestsRemaining || 0) <= 0;
    if (!quotaMaxed || generating || resetCost < 1) {
      return null;
    }
    return {
      resetCost,
      resetPurchasesToday
    };
  }, [aiUsagePolicy, generating]);
  const showScopedPlanQuickReplies =
    isOwner &&
    executionPlan?.status === 'awaiting_confirmation' &&
    !generating &&
    !draftMessage.trim();
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

  useEffect(() => {
    if (activeCommunicationMode !== 'lumine') return;
    const snapshot = lumineScrollSnapshotRef.current;
    lumineScrollSnapshotRef.current = null;
    const savedScrollTop = Number(
      communicationScrollTopsRef.current?.lumine || 0
    );
    const frame = window.requestAnimationFrame(() => {
      const container = chatScrollRef.current;
      if (container) {
        container.scrollTo({
          top:
            snapshot && !snapshot.stickToBottom
              ? snapshot.scrollTop
              : savedScrollTop > 0
                ? savedScrollTop
              : container.scrollHeight,
          behavior: 'auto'
        });
        return;
      }
      chatEndRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'nearest'
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    activeCommunicationMode,
    chatEndRef,
    chatScrollRef
  ]);

  useEffect(() => {
    return () => {
      if (lumineScrollSaveTimeoutRef.current !== null) {
        window.clearTimeout(lumineScrollSaveTimeoutRef.current);
        lumineScrollSaveTimeoutRef.current = null;
      }
      pendingLumineScrollTopRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!preferredCommunicationMode) return;
    setCommunicationMode(preferredCommunicationMode);
  }, [preferredCommunicationMode]);

  function handleToggleLimitsExpanded() {
    setLimitsExpanded((prev) => !prev);
  }

  function handleCommunicationModeChange(nextMode: CommunicationMode) {
    if (activeCommunicationMode === 'lumine' && nextMode !== 'lumine') {
      const container = chatScrollRef.current;
      if (container) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        commitLumineScrollTop(container.scrollTop);
        lumineScrollSnapshotRef.current = {
          scrollTop: container.scrollTop,
          stickToBottom: distanceFromBottom <= LUMINE_BOTTOM_SCROLL_THRESHOLD
        };
      }
    }
    setCommunicationMode(nextMode);
    onCommunicationModeChange?.(nextMode);
  }

  function handleLumineScroll() {
    onChatScroll();
    const scrollTop = chatScrollRef.current?.scrollTop || 0;
    scheduleLumineScrollTopSave(scrollTop);
  }

  function scheduleLumineScrollTopSave(scrollTop: number) {
    pendingLumineScrollTopRef.current = scrollTop;
    if (lumineScrollSaveTimeoutRef.current !== null) {
      window.clearTimeout(lumineScrollSaveTimeoutRef.current);
    }
    lumineScrollSaveTimeoutRef.current = window.setTimeout(() => {
      lumineScrollSaveTimeoutRef.current = null;
      const pendingScrollTop = pendingLumineScrollTopRef.current;
      pendingLumineScrollTopRef.current = null;
      if (pendingScrollTop !== null) {
        commitLumineScrollTop(pendingScrollTop);
      }
    }, 160);
  }

  function commitLumineScrollTop(scrollTop: number) {
    const normalizedScrollTop = Math.max(0, Math.floor(Number(scrollTop) || 0));
    if (lastSavedLumineScrollTopRef.current === normalizedScrollTop) return;
    lastSavedLumineScrollTopRef.current = normalizedScrollTop;
    onCommunicationScrollChangeRef.current?.('lumine', normalizedScrollTop);
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
    if (!messageText || uploadInFlight || aiInputDisabled) return;
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
    <div
      className={className ? `${panelClass} ${className}` : panelClass}
      style={
        {
          '--build-workshop-title-font-size': formatScaledRem(
            1.2,
            normalizedWorkshopScale
          ),
          '--build-workshop-body-font-size': formatScaledRem(
            1,
            normalizedWorkshopScale
          ),
          '--build-workshop-label-font-size': formatScaledRem(
            0.96,
            normalizedWorkshopScale
          ),
          '--build-workshop-meta-font-size': formatScaledRem(
            0.88,
            normalizedWorkshopScale
          ),
          '--build-workshop-small-font-size': formatScaledRem(
            0.84,
            normalizedWorkshopScale
          ),
          '--build-workshop-tiny-font-size': formatScaledRem(
            0.78,
            normalizedWorkshopScale
          ),
          '--build-workshop-message-font-size': formatScaledRem(
            1.1,
            normalizedWorkshopScale
          ),
          '--build-workshop-message-meta-font-size': formatScaledRem(
            0.82,
            normalizedWorkshopScale
          ),
          '--build-workshop-input-font-size': formatScaledRem(
            1.06,
            normalizedWorkshopScale
          ),
          '--build-workshop-prompt-font-size': formatScaledRem(
            1.08,
            normalizedWorkshopScale
          ),
          '--build-workshop-choice-font-size': formatScaledRem(
            1,
            normalizedWorkshopScale
          )
        } as React.CSSProperties
      }
    >
      {mainProjectNavigationShown ? (
        <div className={communicationHeaderClass}>
          <button
            type="button"
            className={mainProjectButtonClass}
            onClick={onOpenMainProject}
          >
            <Icon icon="arrow-left" />
            Main Project
          </button>
          {communicationOptions.length > 1 ? (
            <div className={communicationHeaderTabsSlotClass}>
              <SegmentedToggle
                value={activeCommunicationMode}
                options={communicationOptions}
                onChange={handleCommunicationModeChange}
                ariaLabel="Switch communication mode"
                size="sm"
              />
            </div>
          ) : null}
          <span className={communicationHeaderSpacerClass} aria-hidden="true" />
        </div>
      ) : communicationOptions.length > 1 ? (
        <div className={communicationTabsClass}>
          <SegmentedToggle
            value={activeCommunicationMode}
            options={communicationOptions}
            onChange={handleCommunicationModeChange}
            ariaLabel="Switch communication mode"
            size="sm"
          />
        </div>
      ) : null}
      {activeCommunicationMode === 'people' ? (
        <div className={peoplePaneClass}>{peoplePanel}</div>
      ) : activeCommunicationMode === 'versions' ? (
        <div className={peoplePaneClass}>
          {versionsPanel || luminePanelOverride}
        </div>
      ) : luminePanelOverride ? (
        <div className={peoplePaneClass}>{luminePanelOverride}</div>
      ) : (
        <>
          <Header
            copilotPolicy={copilotPolicy}
            aiUsagePolicy={aiUsagePolicy}
            lumineChatVisibilityControl={lumineChatVisibilityControl}
            pageFeedbackEvents={pageFeedbackEvents}
            twinkleCoins={twinkleCoins}
            purchasingGenerationReset={purchasingGenerationReset}
            generationResetError={generationResetError}
            generationResetUi={generationResetUi}
            limitsExpanded={limitsExpanded}
            onPurchaseGenerationReset={onPurchaseGenerationReset}
            onOpenRuntimeUploadsManager={onOpenRuntimeUploadsManager}
            onToggleLimitsExpanded={handleToggleLimitsExpanded}
          />
          <div
            ref={chatScrollRef}
            onScroll={handleLumineScroll}
            className={scrollAreaClass}
          >
            <Transcript
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
          <Composer
            AI_FEATURES_DISABLED={AI_FEATURES_DISABLED}
            aiInputDisabled={aiInputDisabled}
            aiInputDisabledNotice={aiInputDisabledNotice}
            draftMessage={draftMessage}
            generating={generating}
            inputRef={inputRef}
            isOwner={isOwner}
            limitsExpanded={limitsExpanded}
            normalizedFollowUpQuestion={normalizedFollowUpQuestion}
            normalizedScopedPlanQuestion={normalizedScopedPlanQuestion}
            onAcceptFollowUpPrompt={onAcceptFollowUpPrompt}
            onCancelScopedPlan={onCancelScopedPlan}
            onContinueScopedPlan={onContinueScopedPlan}
            onDismissFollowUpPrompt={onDismissFollowUpPrompt}
            onDraftMessageChange={onDraftMessageChange}
            onOpenBuildChatUpload={onOpenBuildChatUpload}
            onPrefillRedirect={handlePrefillRedirect}
            onStopGeneration={onStopGeneration}
            onSubmitMessage={handleSubmitMessage}
            showGenericFollowUpQuickReplies={showGenericFollowUpQuickReplies}
            showScopedPlanQuickReplies={showScopedPlanQuickReplies}
            uploadInFlight={uploadInFlight}
          />
        </>
      )}
      <RuntimeUploadsModal
        copilotPolicy={copilotPolicy}
        runtimeUploadsModalShown={runtimeUploadsModalShown}
        runtimeUploadAssets={runtimeUploadAssets}
        runtimeUploadsNextCursor={runtimeUploadsNextCursor}
        runtimeUploadsLoading={runtimeUploadsLoading}
        runtimeUploadsLoadingMore={runtimeUploadsLoadingMore}
        runtimeUploadsError={runtimeUploadsError}
        runtimeUploadDeletingId={runtimeUploadDeletingId}
        onCloseRuntimeUploadsManager={onCloseRuntimeUploadsManager}
        onDeleteRuntimeUpload={onDeleteRuntimeUpload}
        onLoadMoreRuntimeUploads={onLoadMoreRuntimeUploads}
      />
    </div>
  );
}

function normalizeCommunicationMode(
  value?: ChatPanelCommunicationMode | null
): CommunicationMode {
  return value === 'people' || value === 'versions' ? value : 'lumine';
}
