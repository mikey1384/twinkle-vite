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
  BuildRunEvent,
  LimitProgressItem
} from './types';
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

interface HeaderProps {
  copilotPolicy: BuildCopilotPolicy | null;
  aiUsagePolicy: BuildAiUsagePolicy | null;
  lumineChatVisibilityControl?: {
    value: BuildLumineChatVisibility;
    savedValue: BuildLumineChatVisibility;
    loading: boolean;
    error: string;
    onSave: (
      value: BuildLumineChatVisibility
    ) => Promise<boolean | void> | boolean | void;
  } | null;
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
  aiUsagePolicy,
  lumineChatVisibilityControl,
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

  return (
    <div className={headerClass}>
      <div className={headerTopRowClass}>
        <div className={headerTitleClass}>
          <Icon icon="sparkles" />
          Lumine
        </div>
        {lumineChatVisibilityControl ? (
          <LumineChatVisibilitySettings
            control={lumineChatVisibilityControl}
          />
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
          {dailyGenerationUsage != null ? (
            <AiEnergyCard
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

function LumineChatVisibilitySettings({
  control
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
      <button
        type="button"
        onClick={handleOpenModal}
        className={css`
          margin-left: auto;
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
                    ${draftValue === option.value
                      ? '#1d4ed8'
                      : 'var(--ui-border)'};
                  border-radius: 8px;
                  background: ${draftValue === option.value
                    ? 'rgba(65, 140, 235, 0.12)'
                    : '#fff'};
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
                      font-size: 1rem;
                      font-weight: 900;
                    `}
                  >
                    {option.title}
                  </span>
                  <span
                    className={css`
                      color: ${Color.darkGray()};
                      font-size: 0.92rem;
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
    description: 'Project collaborators can review the transcript.',
    icon: 'users'
  }
];

function getLumineChatVisibilityOption(value: BuildLumineChatVisibility) {
  return (
    lumineChatVisibilityOptions.find((option) => option.value === value) ||
    lumineChatVisibilityOptions[0]
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
