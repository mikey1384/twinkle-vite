import React, { RefObject } from 'react';
import { css } from '@emotion/css';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { Color } from '~/constants/css';

interface ComposerProps {
  AI_FEATURES_DISABLED: boolean;
  aiInputDisabled: boolean;
  aiInputDisabledNotice: string;
  draftMessage: string;
  generating: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  isOwner: boolean;
  limitsExpanded: boolean;
  normalizedFollowUpQuestion: string;
  normalizedScopedPlanQuestion: string;
  onAcceptFollowUpPrompt: () => void;
  onCancelScopedPlan: () => void;
  onContinueScopedPlan: () => void;
  onDismissFollowUpPrompt: () => void;
  onDraftMessageChange: (value: string) => void;
  onOpenBuildChatUpload: () => void;
  onPrefillRedirect: () => void;
  onStopGeneration: () => void;
  onSubmitMessage: () => void;
  showGenericFollowUpQuickReplies: boolean;
  showScopedPlanQuickReplies: boolean;
  uploadInFlight: boolean;
}

export default function Composer({
  AI_FEATURES_DISABLED,
  aiInputDisabled,
  aiInputDisabledNotice,
  draftMessage,
  generating,
  inputRef,
  isOwner,
  limitsExpanded,
  normalizedFollowUpQuestion,
  normalizedScopedPlanQuestion,
  onAcceptFollowUpPrompt,
  onCancelScopedPlan,
  onContinueScopedPlan,
  onDismissFollowUpPrompt,
  onDraftMessageChange,
  onOpenBuildChatUpload,
  onPrefillRedirect,
  onStopGeneration,
  onSubmitMessage,
  showGenericFollowUpQuickReplies,
  showScopedPlanQuickReplies,
  uploadInFlight
}: ComposerProps) {
  if (!isOwner || limitsExpanded) {
    return null;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmitMessage();
    }
  }

  return (
    <div
      className={css`
        padding: 0.9rem 1rem 1.1rem;
        background: #fff;
      `}
    >
      {showScopedPlanQuickReplies || showGenericFollowUpQuickReplies ? (
        <div
          className={css`
            display: grid;
            gap: 0.65rem;
            margin-bottom: 0.7rem;
          `}
        >
          {showScopedPlanQuickReplies || normalizedFollowUpQuestion ? (
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
          ) : null}
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
              onClick={onPrefillRedirect}
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
      ) : null}
      {aiInputDisabled ? (
        <AIDisabledNotice
          title={
            AI_FEATURES_DISABLED
              ? 'Build AI Is Unavailable'
              : 'AI Energy Required'
          }
          notice={aiInputDisabledNotice}
          style={{ marginBottom: '0.6rem' }}
        />
      ) : null}
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
              ? aiInputDisabledNotice
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
          onClick={onSubmitMessage}
          disabled={aiInputDisabled || uploadInFlight || !draftMessage.trim()}
          variant={generating ? 'orange' : 'logoBlue'}
          size="md"
          icon="paper-plane"
          style={{ minWidth: '3rem' }}
        />
        {generating ? (
          <GameCTAButton
            onClick={onStopGeneration}
            variant="orange"
            size="md"
            icon="stop"
            style={{ minWidth: '3rem' }}
          />
        ) : null}
      </div>
    </div>
  );
}
