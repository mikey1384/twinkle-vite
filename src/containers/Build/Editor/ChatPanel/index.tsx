import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import Icon from '~/components/Icon';
import { useViewContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import BranchMainUpdateNotice from '../BranchMainUpdateNotice';
import ThreeVendorUpgradeNotice from '../ThreeVendorUpgradeNotice';
import Composer from './Composer';
import Header from './Header';
import RuntimeUploadsModal from './RuntimeUploadsModal';
import Transcript from './Transcript';
import {
  type ChatPanelCommunicationMode,
  type ChatPanelProps
} from './types';
import { buildLumineRuntimeDebugSnapshot } from './helpers/runtimeDebug';

const panelClass = css`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid var(--ui-border);
  background: #fff;
  --build-chat-accent: #2563eb;
  --build-chat-accent-strong: #1d4ed8;
  --build-chat-user-bg: #eef6ff;
  --build-chat-user-text: #1f2937;
  --build-chat-user-border: rgba(65, 140, 235, 0.28);
  --theme-bg: var(--build-chat-accent);
  --theme-hover-bg: var(--build-chat-accent-strong);
  --theme-text: #ffffff;
  --theme-border: var(--build-chat-accent);
  --ui-border: rgba(148, 163, 184, 0.28);
  --ui-border-strong: rgba(65, 140, 235, 0.52);
  --chat-bg: #f8fafc;
  --chat-title-bg: #eef4ff;
  --chat-hover-bg: #f1f6ff;
  --chat-hover-title-bg: #e2edff;
  --chat-text: #2f3747;
  --chat-border: rgba(148, 163, 184, 0.34);
  /* Reading text (messages, input, prompts) is sized close to the main site
     chat (1.6rem messages); chrome and fine print (label/meta/small/tiny)
     stay compact so the dense header/settings rows don't overflow.
     --build-workshop-font-scale is set inline by the component (desktop
     panel-width scaling); the bases must stay here in CSS so the mobile
     breakpoint below can override them. */
  --build-workshop-font-scale: 1;
  --build-workshop-title-font-size: calc(
    1.6rem * var(--build-workshop-font-scale)
  );
  --build-workshop-body-font-size: calc(
    1.4rem * var(--build-workshop-font-scale)
  );
  --build-workshop-label-font-size: calc(
    1.2rem * var(--build-workshop-font-scale)
  );
  --build-workshop-meta-font-size: calc(
    1.1rem * var(--build-workshop-font-scale)
  );
  --build-workshop-small-font-size: calc(
    1.1rem * var(--build-workshop-font-scale)
  );
  --build-workshop-tiny-font-size: max(
    1rem,
    1rem * var(--build-workshop-font-scale)
  );
  --build-workshop-message-font-size: calc(
    1.5rem * var(--build-workshop-font-scale)
  );
  --build-workshop-message-meta-font-size: calc(
    1.1rem * var(--build-workshop-font-scale)
  );
  --build-workshop-input-font-size: calc(
    1.5rem * var(--build-workshop-font-scale)
  );
  --build-workshop-prompt-font-size: calc(
    1.4rem * var(--build-workshop-font-scale)
  );
  --build-workshop-choice-font-size: calc(
    1.3rem * var(--build-workshop-font-scale)
  );
  font-size: var(--build-workshop-body-font-size);
  @media (max-width: ${mobileMaxWidth}) {
    border-right: none;
    border-bottom: 1px solid var(--ui-border);
    /* The site root font drops from 10px to 8px at this breakpoint
       (styles.css), which would shrink all the sizes above by 20% on
       phones; these overrides restore roughly the same physical px sizes
       as desktop. */
    --build-workshop-title-font-size: calc(
      2rem * var(--build-workshop-font-scale)
    );
    --build-workshop-body-font-size: calc(
      1.7rem * var(--build-workshop-font-scale)
    );
    --build-workshop-label-font-size: calc(
      1.4rem * var(--build-workshop-font-scale)
    );
    --build-workshop-meta-font-size: calc(
      1.3rem * var(--build-workshop-font-scale)
    );
    --build-workshop-small-font-size: calc(
      1.3rem * var(--build-workshop-font-scale)
    );
    --build-workshop-tiny-font-size: calc(
      1.2rem * var(--build-workshop-font-scale)
    );
    --build-workshop-message-font-size: calc(
      1.8rem * var(--build-workshop-font-scale)
    );
    --build-workshop-message-meta-font-size: calc(
      1.3rem * var(--build-workshop-font-scale)
    );
    --build-workshop-input-font-size: calc(
      1.8rem * var(--build-workshop-font-scale)
    );
    --build-workshop-prompt-font-size: calc(
      1.7rem * var(--build-workshop-font-scale)
    );
    --build-workshop-choice-font-size: calc(
      1.6rem * var(--build-workshop-font-scale)
    );
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
  container-type: inline-size;
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
  justify-self: start;
  width: max-content;
  max-width: 100%;
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
  @container (max-width: 42rem) {
    width: 2.75rem;
    height: 2.75rem;
    justify-content: center;
    padding: 0;
  }
`;

const mainProjectButtonLabelClass = css`
  @container (max-width: 42rem) {
    display: none;
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

const mainUpdateNoticePlacementClass = css`
  margin: 0.85rem 1.2rem 0;
  @media (max-width: ${mobileMaxWidth}) {
    margin: 0.75rem 1rem 0;
  }
`;

type CommunicationMode = ChatPanelCommunicationMode;
const LUMINE_BOTTOM_SCROLL_THRESHOLD = 120;
// Persisted in place of a px scrollTop when the user was at the bottom, so a
// later restore can target the *current* bottom; saved px positions go stale
// whenever layout reflows (font loads, message clamping, resized panel).
const LUMINE_SCROLL_BOTTOM_SENTINEL = Number.MAX_SAFE_INTEGER;

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
  lumineModelSelectionControl,
  mainUpdateNoticeControl,
  threeUpgradeNoticeControl,
  messages,
  executionPlan,
  scopedPlanQuestion,
  followUpPrompt,
  runMode,
  generating,
  generatingStatus,
  assistantStatusSteps,
  requestId,
  agentContext,
  lifecycle,
  copilotPolicy,
  aiUsagePolicy,
  pageFeedbackEvents,
  runEvents,
  runError,
  activeStreamMessageIds,
  isOwner,
  buildId,
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
  onCreateGeneratedRuntimeAsset,
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
  const lumineStickToBottomRef = useRef(true);
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
      const thoughtContent = String(
        event?.details?.thoughtContent || ''
      ).trim();
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
  const runtimeDebugSnapshot = useMemo(() => {
    if (!import.meta.env.DEV) return null;
    return buildLumineRuntimeDebugSnapshot({
      requestId,
      agentContext,
      lifecycle,
      runEvents
    });
  }, [agentContext, lifecycle, requestId, runEvents]);
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
  const normalizedFollowUpQuestion = String(
    followUpPrompt?.question || ''
  ).trim();
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
    const restoreToBottom = snapshot
      ? snapshot.stickToBottom
      : savedScrollTop <= 0 || savedScrollTop >= LUMINE_SCROLL_BOTTOM_SENTINEL;
    const frame = window.requestAnimationFrame(() => {
      lumineStickToBottomRef.current = restoreToBottom;
      const container = chatScrollRef.current;
      if (container) {
        container.scrollTo({
          top: restoreToBottom
            ? container.scrollHeight
            : snapshot
              ? snapshot.scrollTop
              : savedScrollTop,
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
  }, [activeCommunicationMode, chatEndRef, chatScrollRef]);

  // A single scrollTo lands short whenever content keeps growing after the
  // frame it was issued in (markdown layout, message clamping, font loads,
  // streaming). While the user is at the bottom, keep them pinned through
  // any content growth.
  useEffect(() => {
    if (activeCommunicationMode !== 'lumine') return;
    const container = chatScrollRef.current;
    const content = container?.firstElementChild;
    if (!container || !content || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (!lumineStickToBottomRef.current) return;
      container.scrollTop = container.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [activeCommunicationMode, chatScrollRef]);

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
        const stickToBottom =
          distanceFromBottom <= LUMINE_BOTTOM_SCROLL_THRESHOLD;
        commitLumineScrollTop(
          stickToBottom ? LUMINE_SCROLL_BOTTOM_SENTINEL : container.scrollTop
        );
        lumineScrollSnapshotRef.current = {
          scrollTop: container.scrollTop,
          stickToBottom
        };
      }
    }
    setCommunicationMode(nextMode);
    onCommunicationModeChange?.(nextMode);
  }

  function handleLumineScroll() {
    onChatScroll();
    const container = chatScrollRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const stickToBottom = distanceFromBottom <= LUMINE_BOTTOM_SCROLL_THRESHOLD;
    lumineStickToBottomRef.current = stickToBottom;
    scheduleLumineScrollTopSave(
      stickToBottom ? LUMINE_SCROLL_BOTTOM_SENTINEL : container.scrollTop
    );
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
          '--build-workshop-font-scale': String(normalizedWorkshopScale)
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
            <Icon icon="home" />
            <span className={mainProjectButtonLabelClass}>Main</span>
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
          {mainUpdateNoticeControl?.shown ? (
            <BranchMainUpdateNotice
              className={mainUpdateNoticePlacementClass}
              canUpdate={mainUpdateNoticeControl.canUpdate}
              loading={mainUpdateNoticeControl.loading}
              error={mainUpdateNoticeControl.error}
              onUpdate={mainUpdateNoticeControl.onUpdate}
            />
          ) : null}
          {threeUpgradeNoticeControl?.shown ? (
            <ThreeVendorUpgradeNotice
              className={mainUpdateNoticePlacementClass}
              loading={generating}
              disabled={aiInputDisabled}
              onUpgrade={threeUpgradeNoticeControl.onUpgrade}
              onDismiss={threeUpgradeNoticeControl.onDismiss}
            />
          ) : null}
          <Header
            copilotPolicy={copilotPolicy}
            aiUsagePolicy={aiUsagePolicy}
            lumineChatVisibilityControl={lumineChatVisibilityControl}
            lumineModelSelectionControl={lumineModelSelectionControl}
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
              runtimeDebugSnapshot={runtimeDebugSnapshot}
              runError={runError}
              activeStreamMessageIds={activeStreamMessageIds}
              isOwner={isOwner}
              chatEndRef={chatEndRef}
              quickReplyShown={
                showScopedPlanQuickReplies || showGenericFollowUpQuickReplies
              }
              quickReplyQuestion={
                showScopedPlanQuickReplies
                  ? normalizedScopedPlanQuestion
                  : normalizedFollowUpQuestion
              }
              onQuickReplyYes={
                showScopedPlanQuickReplies
                  ? onContinueScopedPlan
                  : onAcceptFollowUpPrompt
              }
              onQuickReplyNo={
                showScopedPlanQuickReplies
                  ? onCancelScopedPlan
                  : onDismissFollowUpPrompt
              }
              onQuickReplyRedirect={handlePrefillRedirect}
              onFixRuntimeObservationMessage={onFixRuntimeObservationMessage}
              onDeleteMessage={onDeleteMessage}
            />
          </div>
          <Composer
            AI_FEATURES_DISABLED={AI_FEATURES_DISABLED}
            aiInputDisabled={aiInputDisabled}
            aiInputDisabledNotice={aiInputDisabledNotice}
            buildId={buildId}
            draftMessage={draftMessage}
            generating={generating}
            inputRef={inputRef}
            isOwner={isOwner}
            limitsExpanded={limitsExpanded}
            onDraftMessageChange={onDraftMessageChange}
            onOpenBuildChatUpload={onOpenBuildChatUpload}
            onStopGeneration={onStopGeneration}
            onSubmitMessage={handleSubmitMessage}
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
        onCreateGeneratedRuntimeAsset={onCreateGeneratedRuntimeAsset}
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
