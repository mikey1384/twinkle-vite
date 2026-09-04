import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import AiEnergyCard from '~/components/AiEnergyCard';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import ProgressBar from '~/components/ProgressBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  BuildAiUsagePolicy,
  BuildCopilotPolicy,
  BuildLumineChatVisibility,
  BuildLumineMode,
  BuildLumineModel,
  BuildLumineModelPreference,
  BuildRunEvent,
  LimitProgressItem,
  LumineModelSelectionControl
} from './types';
import {
  buildLimitProgressItem,
  formatBytes,
  formatStepLabel,
  formatTokenCount
} from './helpers/utils';
import {
  getAdvancedLumineModelOptions,
  getAvailableLumineModes,
  getLumineModelOption,
  getLumineSelectionForMode,
  LUMINE_MODE_LABELS,
  normalizeLumineModelSelection
} from '../helpers/lumineModelSelection';

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

const headerTopRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const headerTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 800;
  color: var(--chat-text);
  font-size: var(--build-workshop-title-font-size);
`;

const headerActionsClass = css`
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
  flex-wrap: wrap;
`;

const minimizedRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.45rem;
`;

const minimizedHeaderClass = css`
  min-height: 0;
  padding: 0.55rem 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.55rem 1rem;
  }
`;

const headerIconButtonClass = css`
  flex: 0 0 auto;
  width: 2.45rem;
  height: 2.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: var(--chat-text);
  font-size: 1.1rem;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    transform 0.15s ease;
  &:hover,
  &:focus-visible {
    border-color: var(--theme-border);
    background: rgba(65, 140, 235, 0.08);
    transform: translateY(-1px);
    outline: none;
  }
`;

const headerPillButtonClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid var(--ui-border);
  background: #fff;
  color: var(--chat-text);
  border-radius: 999px;
  min-width: 8.5rem;
  padding: 0.42rem 1.1rem;
  font-size: var(--build-workshop-small-font-size);
  font-weight: 800;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
  &:hover,
  &:focus-visible {
    border-color: var(--theme-border);
    transform: translateY(-1px);
    outline: none;
  }
`;

function HeaderMinimizeToggle({
  minimized,
  onToggle
}: {
  minimized: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={minimized ? 'Expand Lumine header' : 'Minimize Lumine header'}
      title={minimized ? 'Expand header' : 'Minimize header'}
      className={headerIconButtonClass}
    >
      <Icon icon={minimized ? 'expand' : 'compress'} />
    </button>
  );
}

interface HeaderProps {
  copilotPolicy: BuildCopilotPolicy | null;
  aiUsagePolicy: BuildAiUsagePolicy | null;
  isOwner: boolean;
  lumineChatVisibilityControl?: {
    value: BuildLumineChatVisibility;
    savedValue: BuildLumineChatVisibility;
    loading: boolean;
    error: string;
    onSave: (
      value: BuildLumineChatVisibility
    ) => Promise<boolean | void> | boolean | void;
  } | null;
  lumineModelSelectionControl?: LumineModelSelectionControl | null;
  pageFeedbackEvents: BuildRunEvent[];
  twinkleCoins: number;
  purchasingGenerationReset: boolean;
  generationResetError: string;
  generationResetUi: {
    resetCost: number;
    resetPurchasesToday: number;
  } | null;
  limitsExpanded: boolean;
  minimized: boolean;
  onPurchaseGenerationReset: () => Promise<void> | void;
  onRequestProjectLimitIncrease: (selection: {
    files: boolean;
    size: boolean;
  }) => Promise<void> | void;
  onOpenRuntimeUploadsManager: () => void;
  onToggleLimitsExpanded: () => void;
  onToggleMinimized: () => void;
}

export default function Header({
  copilotPolicy,
  aiUsagePolicy,
  isOwner,
  lumineChatVisibilityControl,
  lumineModelSelectionControl,
  pageFeedbackEvents,
  twinkleCoins,
  purchasingGenerationReset,
  generationResetError,
  generationResetUi,
  limitsExpanded,
  minimized,
  onPurchaseGenerationReset,
  onRequestProjectLimitIncrease,
  onOpenRuntimeUploadsManager,
  onToggleLimitsExpanded,
  onToggleMinimized
}: HeaderProps) {
  const dailyGenerationUsage = useMemo(() => {
    if (!aiUsagePolicy) return null;
    if (typeof aiUsagePolicy.energyPercent === 'number') {
      return Math.max(0, Math.min(100, aiUsagePolicy.energyPercent));
    }
    if (Number(aiUsagePolicy.generationRequestsPerDay || 0) <= 0) return null;
    return Math.max(
      0,
      Math.min(
        100,
        (Number(aiUsagePolicy.generationRequestsToday || 0) /
          Number(aiUsagePolicy.generationRequestsPerDay || 1)) *
          100
      )
    );
  }, [aiUsagePolicy]);
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
  const visiblePageFeedbackEvents = pageFeedbackEvents.slice(-3).reverse();
  const projectLimitApproval = copilotPolicy?.projectLimitApproval || null;
  const latestProjectLimitRequest = projectLimitApproval?.latestRequest || null;
  const filePressure = Boolean(
    copilotPolicy &&
    copilotPolicy.usage.projectFileCount >=
      Math.max(1, Math.floor(copilotPolicy.limits.maxFilesPerProject * 0.8))
  );
  const sizePressure = Boolean(
    copilotPolicy &&
    copilotPolicy.usage.currentProjectBytes >=
      Math.max(1, Math.floor(copilotPolicy.limits.maxProjectBytes * 0.8))
  );
  const requestableFiles = Boolean(
    isOwner &&
    !projectLimitApproval?.isInherited &&
    filePressure &&
    projectLimitApproval?.canRequestFiles
  );
  const requestableSize = Boolean(
    isOwner &&
    !projectLimitApproval?.isInherited &&
    sizePressure &&
    projectLimitApproval?.canRequestSize
  );
  const showProjectLimitNudge =
    Boolean(requestableFiles || requestableSize) ||
    (latestProjectLimitRequest?.status === 'pending' &&
      isOwner &&
      !projectLimitApproval?.isInherited);

  const energyCard =
    dailyGenerationUsage != null ? (
      <AiEnergyCard
        variant="inline"
        energyPercent={dailyGenerationUsage}
        energySegments={aiUsagePolicy?.energySegments}
        energySegmentsRemaining={aiUsagePolicy?.energySegmentsRemaining}
        resetNeeded={!!generationResetUi}
        resetCost={generationResetUi?.resetCost}
        resetPurchaseNumber={
          generationResetUi
            ? generationResetUi.resetPurchasesToday + 1
            : undefined
        }
        twinkleCoins={twinkleCoins}
        rechargeLoading={purchasingGenerationReset}
        rechargeError={generationResetError}
        onRecharge={
          generationResetUi ? () => onPurchaseGenerationReset() : undefined
        }
      />
    ) : null;

  if (minimized) {
    return (
      <div className={`${headerClass} ${minimizedHeaderClass}`}>
        <div className={minimizedRowClass}>
          {lumineModelSelectionControl ? (
            <LumineModelSelectionSettings
              control={lumineModelSelectionControl}
              energyRemaining={aiUsagePolicy?.energyRemaining ?? null}
              compact
            />
          ) : null}
          {lumineChatVisibilityControl ? (
            <LumineChatVisibilitySettings
              control={lumineChatVisibilityControl}
              compact
            />
          ) : null}
          {energyCard ? (
            <div
              className={css`
                flex: 1;
                min-width: 0;
              `}
            >
              {energyCard}
            </div>
          ) : null}
          <HeaderMinimizeToggle minimized onToggle={onToggleMinimized} />
        </div>
        {showProjectLimitNudge ? (
          <ProjectLimitNudge
            approval={projectLimitApproval}
            requestFiles={requestableFiles}
            requestSize={requestableSize}
            onRequest={onRequestProjectLimitIncrease}
          />
        ) : null}
        {visiblePageFeedbackEvents.length > 0 ? (
          <div
            className={css`
              display: grid;
              gap: 0.55rem;
            `}
          >
            {visiblePageFeedbackEvents.map((event) => (
              <FeedbackNotice key={event.id} event={event} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={headerClass}>
      <div className={headerTopRowClass}>
        <div className={headerTitleClass}>
          <Icon icon="sparkles" />
          Lumine
        </div>
        {lumineModelSelectionControl || lumineChatVisibilityControl ? (
          <div className={headerActionsClass}>
            {lumineModelSelectionControl ? (
              <LumineModelSelectionSettings
                control={lumineModelSelectionControl}
                energyRemaining={aiUsagePolicy?.energyRemaining ?? null}
              />
            ) : null}
            {lumineChatVisibilityControl ? (
              <LumineChatVisibilitySettings
                control={lumineChatVisibilityControl}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {copilotPolicy ? (
        <div
          className={css`
            margin-top: 0.4rem;
            margin-bottom: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
            font-size: var(--build-workshop-body-font-size);
            color: var(--chat-text);
          `}
        >
          {energyCard}
          {showProjectLimitNudge ? (
            <ProjectLimitNudge
              approval={projectLimitApproval}
              requestFiles={requestableFiles}
              requestSize={requestableSize}
              onRequest={onRequestProjectLimitIncrease}
            />
          ) : null}
          {limitsExpanded ? (
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
                            'SF Mono', 'Menlo', 'Consolas', monospace;
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
                  value={`${formatTokenCount(copilotPolicy.limits.maxFileLines)} effective lines`}
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
                    Delete older Lumine file uploads across your builds to free
                    space.
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
          ) : null}
          <div
            className={css`
              display: flex;
              justify-content: center;
              align-items: center;
              flex-wrap: wrap;
              gap: 0.5rem;
              padding-top: 0.65rem;
            `}
          >
            <button
              type="button"
              onClick={onToggleMinimized}
              className={headerPillButtonClass}
              aria-label="Minimize Lumine header"
            >
              <Icon icon="compress" />
              Minimize
            </button>
            <button
              type="button"
              onClick={onToggleLimitsExpanded}
              className={headerPillButtonClass}
            >
              <Icon icon={limitsExpanded ? 'chevron-up' : 'chevron-down'} />
              {limitsExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      ) : null}
      {visiblePageFeedbackEvents.length > 0 ? (
        <div
          className={css`
            display: grid;
            gap: 0.55rem;
          `}
        >
          {visiblePageFeedbackEvents.map((event) => (
            <FeedbackNotice key={event.id} event={event} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProjectLimitNudge({
  approval,
  requestFiles,
  requestSize,
  onRequest
}: {
  approval: BuildCopilotPolicy['projectLimitApproval'];
  requestFiles: boolean;
  requestSize: boolean;
  onRequest: (selection: {
    files: boolean;
    size: boolean;
  }) => Promise<void> | void;
}) {
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const pending = approval?.latestRequest?.status === 'pending';
  const canApproveDirectly = Boolean(approval?.canApproveDirectly);
  const addFilesToPendingRequest = Boolean(
    pending &&
    requestFiles &&
    !Number(approval?.latestRequest?.requestedMaxFiles || 0)
  );
  const addSizeToPendingRequest = Boolean(
    pending &&
    requestSize &&
    !Number(approval?.latestRequest?.requestedMaxProjectBytes || 0)
  );
  const selectedFiles = pending
    ? canApproveDirectly
      ? Boolean(
          approval?.canRequestFiles &&
          (requestFiles || approval?.latestRequest?.requestedMaxFiles)
        )
      : addFilesToPendingRequest
    : requestFiles;
  const selectedSize = pending
    ? canApproveDirectly
      ? Boolean(
          approval?.canRequestSize &&
          (requestSize || approval?.latestRequest?.requestedMaxProjectBytes)
        )
      : addSizeToPendingRequest
    : requestSize;
  const canSendRequest = Boolean(selectedFiles || selectedSize);
  const labels = [
    selectedFiles ? `${approval?.requestedMaxFiles || 500} files` : '',
    selectedSize
      ? formatBytes(approval?.requestedMaxProjectBytes || 5 * 1024 * 1024)
      : ''
  ].filter(Boolean);
  return (
    <div
      className={css`
        border: 1px solid rgba(65, 140, 235, 0.24);
        border-radius: 12px;
        background: rgba(65, 140, 235, 0.08);
        padding: 0.9rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.8rem;
        flex-wrap: wrap;
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          min-width: 16rem;
          flex: 1 1 18rem;
        `}
      >
        <Icon icon="sparkles" />
        <div>
          <div
            className={css`
              font-weight: 900;
              color: var(--chat-text);
            `}
          >
            {pending
              ? canApproveDirectly
                ? 'This request is ready for your approval'
                : 'Mikey is reviewing your request'
              : 'Lumine noticed this project is getting full'}
          </div>
          <div
            className={css`
              margin-top: 0.18rem;
              color: var(--chat-text);
              opacity: 0.72;
              font-size: var(--build-workshop-meta-font-size);
              line-height: 1.4;
            `}
          >
            {pending
              ? canApproveDirectly
                ? `Approve ${labels.join(' and ')} for this project. The change takes effect immediately.`
                : canSendRequest
                  ? `This project is now also nearing ${labels.join(' and ')}. Add it to the same request while Mikey reviews it.`
                  : 'Your current limits stay in place until Mikey approves the request in chat.'
              : canApproveDirectly
                ? `Approve ${labels.join(' and ')} for this project. The change takes effect immediately.`
                : `Send Mikey a request for ${labels.join(' and ')}. Nothing changes until he approves it.`}
          </div>
        </div>
      </div>
      {canSendRequest ? (
        <Button color="logoBlue" loading={requesting} onClick={handleRequest}>
          {canApproveDirectly
            ? 'Approve more room'
            : pending
              ? 'Add to request'
              : 'Ask Mikey for more room'}
        </Button>
      ) : null}
      {requestError ? (
        <div
          className={css`
            flex-basis: 100%;
            color: ${Color.rose()};
            font-size: var(--build-workshop-meta-font-size);
            font-weight: 800;
          `}
        >
          {requestError}
        </div>
      ) : null}
    </div>
  );

  async function handleRequest() {
    if (requesting) return;
    setRequesting(true);
    setRequestError('');
    try {
      await onRequest({ files: selectedFiles, size: selectedSize });
    } catch (error: any) {
      setRequestError(
        error?.responseData?.error ||
          error?.response?.data?.error ||
          error?.message ||
          'Could not send this request. Please try again.'
      );
    } finally {
      setRequesting(false);
    }
  }
}

function LumineModelSelectionSettings({
  control,
  energyRemaining = null,
  compact = false
}: {
  control: LumineModelSelectionControl;
  energyRemaining?: number | null;
  compact?: boolean;
}) {
  const [advancedShown, setAdvancedShown] = useState(false);
  const availableModes = getAvailableLumineModes(control.modelOptions);
  const selectedOption = getLumineModelOption(
    control.modelOptions,
    control.value.model,
    control.value.mode
  );
  // Every run is capped at the energy the user has when it starts, so show
  // up front how much work the selected model can do inside that cap. Both
  // inputs are canonical server values; this only divides them for display.
  const energyBudgetHint = getLumineEnergyBudgetHint({
    energyRemaining,
    typicalCallEnergyUnits: selectedOption.typicalCallEnergyUnits,
    modeLabel: LUMINE_MODE_LABELS[selectedOption.mode] || selectedOption.label
  });
  const advancedModelOptions = getAdvancedLumineModelOptions({
    mode: control.value.mode,
    modelOptions: control.modelOptions
  });
  const hasAdvancedModelOptions = advancedModelOptions.length > 0;

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
        flex-wrap: wrap;
      `}
    >
      <LumineSelect
        label="Mode"
        value={control.value.mode}
        disabled={control.loading}
        compact={compact}
        icon="robot"
        onChange={handleModeChange}
      >
        {availableModes.map((mode) => (
          <option key={mode} value={mode}>
            {LUMINE_MODE_LABELS[mode]}
          </option>
        ))}
      </LumineSelect>
      {hasAdvancedModelOptions ? (
        <button
          type="button"
          disabled={control.loading}
          aria-expanded={advancedShown}
          aria-label="Toggle advanced Lumine model choices"
          title="Advanced model choices"
          onClick={() => setAdvancedShown((shown) => !shown)}
          className={css`
            min-height: 2.45rem;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            order: ${compact ? -1 : 0};
            border: 1px solid var(--ui-border);
            border-radius: 999px;
            background: #fff;
            padding: ${compact ? '0 0.72rem' : '0 0.85rem'};
            color: #1d4ed8;
            font-size: 1rem;
            font-weight: 900;
            cursor: ${control.loading ? 'not-allowed' : 'pointer'};
          `}
        >
          <Icon icon="gear" />
          {compact ? '' : ' Advanced'}
        </button>
      ) : null}
      {advancedShown && hasAdvancedModelOptions ? (
        <LumineSelect
          label="Model"
          value={selectedOption.model}
          disabled={control.loading}
          compact={compact}
          icon="bolt"
          onChange={handleModelChange}
        >
          {advancedModelOptions.map((option) => (
            <option key={option.model} value={option.model}>
              {option.label}
            </option>
          ))}
        </LumineSelect>
      ) : null}
      {control.error ? (
        <span
          className={css`
            flex-basis: 100%;
            text-align: right;
            color: #be123c;
            font-size: 1rem;
            font-weight: 800;
          `}
        >
          {control.error}
        </span>
      ) : null}
      {!control.error && energyBudgetHint ? (
        <span
          className={css`
            flex-basis: 100%;
            text-align: right;
            color: ${energyBudgetHint.tight ? '#b45309' : Color.darkGray()};
            font-size: 1rem;
            font-weight: 700;
            line-height: 1.35;
          `}
        >
          {energyBudgetHint.text}
        </span>
      ) : null}
    </div>
  );

  function saveSelection(nextSelection: BuildLumineModelPreference) {
    void Promise.resolve(control.onSave(nextSelection));
  }

  function handleModeChange(value: string) {
    setAdvancedShown(false);
    const nextSelection = getLumineSelectionForMode({
      mode: value as BuildLumineMode,
      modelOptions: control.modelOptions
    });
    if (nextSelection) {
      saveSelection(nextSelection);
    }
  }

  function handleModelChange(value: string) {
    const nextOption = getLumineModelOption(
      control.modelOptions,
      value as BuildLumineModel,
      control.value.mode
    );
    saveSelection(
      normalizeLumineModelSelection({
        selection: {
          model: value as BuildLumineModel,
          reasoningEffort: nextOption.defaultReasoningEffort,
          mode: nextOption.mode
        },
        modelOptions: control.modelOptions
      })
    );
  }
}

function LumineSelect({
  label,
  value,
  disabled,
  compact = false,
  icon,
  children,
  onChange
}: {
  label: string;
  value: string;
  disabled?: boolean;
  compact?: boolean;
  icon?: string;
  children: React.ReactNode;
  onChange: (value: string) => void;
}) {
  if (compact) {
    return (
      <label
        title={label}
        className={css`
          position: relative;
          flex: 0 0 auto;
          width: 2.45rem;
          height: 2.45rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--ui-border);
          border-radius: 999px;
          background: #fff;
          color: #1d4ed8;
          font-size: 1.1rem;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          transition:
            border-color 0.15s ease,
            background-color 0.15s ease,
            transform 0.15s ease;
          &:hover,
          &:focus-within {
            border-color: var(--theme-border);
            background: rgba(65, 140, 235, 0.08);
            transform: translateY(-1px);
          }
        `}
      >
        {icon ? <Icon icon={icon} /> : null}
        <select
          value={value}
          disabled={disabled}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className={css`
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            border: none;
            background: transparent;
            color: transparent;
            font: inherit;
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            &:focus,
            &:focus-visible {
              outline: none;
              box-shadow: none;
            }
          `}
        >
          {children}
        </select>
      </label>
    );
  }
  return (
    <label
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        border: 1px solid var(--ui-border);
        border-radius: 8px;
        background: #fff;
        padding: 0.34rem 0.45rem 0.34rem 0.62rem;
        color: var(--chat-text);
        font-size: 1rem;
        font-weight: 900;
      `}
    >
      <span
        className={css`
          opacity: 0.72;
          white-space: nowrap;
        `}
      >
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={css`
          min-width: 6rem;
          max-width: 10.5rem;
          border: none;
          background: transparent;
          color: #1d4ed8;
          font: inherit;
          font-size: 1rem;
          font-weight: 900;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          &:focus,
          &:focus-visible {
            outline: none;
            box-shadow: none;
          }
        `}
      >
        {children}
      </select>
    </label>
  );
}

function LumineChatVisibilitySettings({
  control,
  compact = false
}: {
  control: {
    value: BuildLumineChatVisibility;
    savedValue: BuildLumineChatVisibility;
    loading: boolean;
    error: string;
    onSave: (
      value: BuildLumineChatVisibility
    ) => Promise<boolean | void> | boolean | void;
  };
  compact?: boolean;
}) {
  const [modalShown, setModalShown] = useState(false);
  const [draftValue, setDraftValue] = useState<BuildLumineChatVisibility>(
    control.value
  );
  const selectedOption = getLumineChatVisibilityOption(control.value);
  const changed = draftValue !== control.savedValue;

  useEffect(() => {
    if (!modalShown) {
      setDraftValue(control.value);
    }
  }, [control.value, modalShown]);

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={handleOpenModal}
          className={`${headerIconButtonClass} ${css`
            && {
              color: #1d4ed8;
            }
          `}`}
          aria-label={`Share Lumine chat with ${selectedOption.title}`}
          title={`Share Lumine chat with ${selectedOption.title}`}
        >
          <Icon icon={selectedOption.icon} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpenModal}
          className={css`
            border: 1px solid rgba(36, 99, 235, 0.22);
            background: #fff;
            color: var(--chat-text);
            border-radius: 999px;
            min-height: 2.45rem;
            padding: 0.35rem 0.85rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            font-family: inherit;
            font-size: var(--build-workshop-small-font-size);
            font-weight: 900;
            cursor: pointer;
            transition:
              border-color 0.15s ease,
              background-color 0.15s ease,
              transform 0.15s ease;
            &:hover,
            &:focus-visible {
              border-color: var(--theme-border);
              background: rgba(65, 140, 235, 0.08);
              transform: translateY(-1px);
              outline: none;
            }
          `}
          aria-label="Change Lumine chat sharing"
        >
          <span
            className={css`
              opacity: 0.72;
            `}
          >
            Share Lumine chat with
          </span>
          <span
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.35rem;
              color: #1d4ed8;
            `}
          >
            <Icon icon={selectedOption.icon} />
            {selectedOption.title}
          </span>
        </button>
      )}

      {modalShown ? (
        <Modal
          modalKey="LumineChatVisibilitySettingsModal"
          isOpen
          onClose={control.loading ? () => {} : handleCloseModal}
          closeOnBackdropClick={!control.loading}
          title="Lumine Chat Sharing"
          size="sm"
          footer={
            <div>
              <Button
                variant="ghost"
                disabled={control.loading}
                onClick={handleCloseModal}
                style={{ marginRight: '0.7rem' }}
              >
                Cancel
              </Button>
              <Button
                color="logoBlue"
                loading={control.loading}
                disabled={control.loading || !changed}
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          }
        >
          <div
            className={css`
              display: grid;
              gap: 0.7rem;
            `}
          >
            {lumineChatVisibilityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={control.loading}
                onClick={() => setDraftValue(option.value)}
                className={css`
                  width: 100%;
                  border: 1px solid
                    ${
                      draftValue === option.value
                        ? '#1d4ed8'
                        : 'var(--ui-border)'
                    };
                  border-radius: 8px;
                  background: ${
                    draftValue === option.value
                      ? 'rgba(65, 140, 235, 0.12)'
                      : '#fff'
                  };
                  color: var(--chat-text);
                  padding: 0.85rem 0.9rem;
                  display: flex;
                  align-items: flex-start;
                  gap: 0.7rem;
                  text-align: left;
                  font-family: inherit;
                  cursor: ${control.loading ? 'not-allowed' : 'pointer'};
                  transition:
                    border-color 0.15s ease,
                    background-color 0.15s ease;
                  &:hover:not(:disabled),
                  &:focus-visible:not(:disabled) {
                    border-color: #1d4ed8;
                    background: rgba(65, 140, 235, 0.08);
                    outline: none;
                  }
                `}
              >
                <span
                  className={css`
                    width: 2rem;
                    height: 2rem;
                    border-radius: 999px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(65, 140, 235, 0.12);
                    color: #1d4ed8;
                    flex: 0 0 auto;
                  `}
                >
                  <Icon icon={option.icon} />
                </span>
                <span
                  className={css`
                    display: grid;
                    gap: 0.2rem;
                    min-width: 0;
                  `}
                >
                  <span
                    className={css`
                      font-size: 1.1rem;
                      font-weight: 900;
                    `}
                  >
                    {option.title}
                  </span>
                  <span
                    className={css`
                      color: ${Color.darkGray()};
                      font-size: 1.1rem;
                      line-height: 1.35;
                    `}
                  >
                    {option.description}
                  </span>
                </span>
              </button>
            ))}
            {control.error ? (
              <span
                className={css`
                  color: #be123c;
                  font-size: var(--build-workshop-small-font-size);
                  font-weight: 800;
                `}
              >
                {control.error}
              </span>
            ) : null}
          </div>
        </Modal>
      ) : null}
      {!modalShown && control.error ? (
        <div
          className={css`
            text-align: right;
            color: #be123c;
            font-size: var(--build-workshop-small-font-size);
            font-weight: 800;
          `}
        >
          {control.error}
        </div>
      ) : null}
    </>
  );

  function handleOpenModal() {
    setDraftValue(control.value);
    setModalShown(true);
  }

  function handleCloseModal() {
    if (control.loading) return;
    setDraftValue(control.value);
    setModalShown(false);
  }

  async function handleSave() {
    if (control.loading || !changed) return;
    const result = await control.onSave(draftValue);
    if (result === false) return;
    setModalShown(false);
  }
}

const lumineChatVisibilityOptions: Array<{
  value: BuildLumineChatVisibility;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'private',
    title: 'Nobody',
    description: 'Only you can see your Lumine chat history.',
    icon: 'lock'
  },
  {
    value: 'collaborators',
    title: 'Team',
    description: 'Team members can see the chat history.',
    icon: 'users'
  }
];

// Mirrors the server's per-run ceiling: a run may spend the remaining
// energy, and the loop never runs more than 16 model calls.
const LUMINE_MAX_MODEL_CALLS_PER_RUN = 16;

function getLumineEnergyBudgetHint({
  energyRemaining,
  typicalCallEnergyUnits,
  modeLabel
}: {
  energyRemaining: number | null;
  typicalCallEnergyUnits?: number;
  modeLabel: string;
}): { text: string; tight: boolean } | null {
  if (
    typeof energyRemaining !== 'number' ||
    !Number.isFinite(energyRemaining) ||
    !typicalCallEnergyUnits ||
    typicalCallEnergyUnits <= 0
  ) {
    return null;
  }
  if (energyRemaining <= 0) return null;
  const calls = Math.min(
    LUMINE_MAX_MODEL_CALLS_PER_RUN,
    Math.floor(energyRemaining / typicalCallEnergyUnits)
  );
  if (calls <= 3) {
    return {
      tight: true,
      text: `At your current energy, ${modeLabel} gets about ${Math.max(calls, 1)} model ${calls === 1 ? 'call' : 'calls'} per run: one small, precise step at a time. Recharge for bigger steps.`
    };
  }
  if (calls <= 7) {
    return {
      tight: false,
      text: `At your current energy, ${modeLabel} gets about ${calls} model calls per run: one focused change at a time.`
    };
  }
  return {
    tight: false,
    text: `At your current energy, ${modeLabel} gets about ${calls} model calls per run.`
  };
}

function getLumineChatVisibilityOption(value: BuildLumineChatVisibility) {
  return (
    lumineChatVisibilityOptions.find((option) => option.value === value) ||
    lumineChatVisibilityOptions[0]
  );
}

function FeedbackNotice({ event }: { event: BuildRunEvent }) {
  const normalizedMessage = String(event.message || '').trim();
  if (!normalizedMessage) return null;

  const label = formatStepLabel(
    String(event.phase || 'build').trim() || 'build'
  );
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
