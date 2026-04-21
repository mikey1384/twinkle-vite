import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import AiEnergyCard from '~/components/AiEnergyCard';
import Icon from '~/components/Icon';
import ProgressBar from '~/components/ProgressBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { BuildCopilotPolicy, BuildRunEvent, LimitProgressItem } from './types';
import {
  buildLimitProgressItem,
  formatBytes,
  formatStepLabel,
  formatTokenCount
} from './utils';

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

interface HeaderProps {
  copilotPolicy: BuildCopilotPolicy | null;
  pageFeedbackEvents: BuildRunEvent[];
  twinkleCoins: number;
  purchasingGenerationReset: boolean;
  generationResetError: string;
  generationResetUi: {
    resetCost: number;
    resetPurchasesToday: number;
  } | null;
  limitsExpanded: boolean;
  onPurchaseGenerationReset: () => Promise<void> | void;
  onOpenRuntimeUploadsManager: () => void;
  onToggleLimitsExpanded: () => void;
}

export default function Header({
  copilotPolicy,
  pageFeedbackEvents,
  twinkleCoins,
  purchasingGenerationReset,
  generationResetError,
  generationResetUi,
  limitsExpanded,
  onPurchaseGenerationReset,
  onOpenRuntimeUploadsManager,
  onToggleLimitsExpanded
}: HeaderProps) {
  const dailyGenerationUsage = useMemo(() => {
    if (!copilotPolicy) return null;
    const requestLimits = copilotPolicy.requestLimits;
    if (typeof requestLimits.energyPercent === 'number') {
      return Math.max(0, Math.min(100, requestLimits.energyPercent));
    }
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

  return (
    <div className={headerClass}>
      <div className={headerTitleClass}>
        <Icon icon="sparkles" />
        Lumine
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
          {dailyGenerationUsage != null ? (
            <AiEnergyCard
              energyPercent={dailyGenerationUsage}
              energySegments={copilotPolicy.requestLimits.energySegments}
              energySegmentsRemaining={
                copilotPolicy.requestLimits.energySegmentsRemaining
              }
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
                generationResetUi
                  ? () => onPurchaseGenerationReset()
                  : undefined
              }
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
                  value={`${formatTokenCount(copilotPolicy.limits.maxFileLines)} lines`}
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
              padding-top: 0.65rem;
            `}
          >
            <button
              type="button"
              onClick={onToggleLimitsExpanded}
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

function FeedbackNotice({ event }: { event: BuildRunEvent }) {
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
