import React, { RefObject } from 'react';
import { css } from '@emotion/css';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import OwnAiCliNotice from './OwnAiCliNotice';
import GameCTAButton from '~/components/Buttons/GameCTAButton';

interface ComposerProps {
  AI_FEATURES_DISABLED: boolean;
  aiInputDisabled: boolean;
  aiInputDisabledNotice: string;
  buildId: number;
  draftMessage: string;
  generating: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  isOwner: boolean;
  limitsExpanded: boolean;
  onDraftMessageChange: (value: string) => void;
  onOpenBuildChatUpload: () => void;
  onStopGeneration: () => void;
  onSubmitMessage: () => void;
  uploadInFlight: boolean;
}

export default function Composer({
  AI_FEATURES_DISABLED,
  aiInputDisabled,
  aiInputDisabledNotice,
  buildId,
  draftMessage,
  generating,
  inputRef,
  isOwner,
  limitsExpanded,
  onDraftMessageChange,
  onOpenBuildChatUpload,
  onStopGeneration,
  onSubmitMessage,
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
      {aiInputDisabled && !AI_FEATURES_DISABLED ? (
        <OwnAiCliNotice buildId={buildId} />
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
