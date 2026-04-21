import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import CodeDiff from '~/components/CodeDiff';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import RichText from '~/components/Texts/RichText';
import { Color } from '~/constants/css';
import { computeLineDiff } from '~/components/CodeDiff/diffUtils';
import { BuildCurrentActivity, BuildStatusStepEntry, ChatMessage } from './types';
import {
  formatStepLabel,
  isBuildAssistantPlaceholderContent,
  looksLikeCompletedCodeChangeClaim
} from './utils';

interface AssistantMessageProps {
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
}

const dotAnimation = css`
  @keyframes dotPulse {
    0%,
    20% {
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
    100% {
      opacity: 1;
    }
  }
`;

export default function AssistantMessage({
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
}: AssistantMessageProps) {
  const [showDiff, setShowDiff] = useState(true);

  const previousCode = useMemo(() => {
    if (!message.codeGenerated) return null;
    const messageIndex = messages.findIndex((m) => m.id === message.id);
    for (let index = messageIndex - 1; index >= 0; index -= 1) {
      if (messages[index].codeGenerated) {
        return messages[index].codeGenerated;
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
  const fallbackActivityMessage = formatStepLabel(
    String(generatingStatus || 'thinking').trim()
  );
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
      {showUploadProgressBar ? (
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
      ) : null}
      {hasCodePayload ? (
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
              {hasChanges ? (
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
              ) : null}
            </div>
            {hasChanges ? (
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
            ) : null}
          </div>
          {showDiff && hasChanges && previousCode !== null ? (
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
          ) : null}
        </div>
      ) : null}
      {hasStreamingCodePreview ? (
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
      ) : null}
      {showNoCodeWarning ? (
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
      ) : null}
      {visibleMessageContent ? (
        <RichText isAIMessage aiActionPlacement="inline" maxLines={15}>
          {visibleMessageContent}
        </RichText>
      ) : null}
      {showFixRuntimeObservationButton ? (
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
      ) : null}
      {showCurrentActivity ? (
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
      ) : null}
      {displayedStatusStepEntries.length > 0 ? (
        <StatusStepLog steps={displayedStatusStepEntries} />
      ) : null}
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
                {isCurrent ? <AnimatedDots /> : null}
              </span>
            </div>
            {step.thoughtContent ? (
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
                  {!step.thoughtIsComplete ? (
                    <AnimatedDots style={{ marginLeft: '0.18rem' }} />
                  ) : null}
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
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

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
