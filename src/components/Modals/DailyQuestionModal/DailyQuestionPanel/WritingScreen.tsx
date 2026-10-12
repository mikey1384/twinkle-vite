import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import PaperProgress from '../PaperProgress';
import { PAPER, paperPrimaryButtonCls } from '../paperTheme';
import {
  containerCls,
  pulseAnimation,
  questionTextSmallCls,
  statsRowCls,
  textareaCls,
  timerContainerCls
} from './styles';

export default function WritingScreen({
  canSubmitKeywordDay,
  inactivityTimer,
  isKeywordDay,
  minEffortBarShown,
  minEffortDisplayLabel,
  minEffortProgress,
  minLengthMet,
  maxResponseLength,
  question,
  remainingMaxChars,
  remainingChars,
  response,
  responseTooLong,
  charsOverLimit,
  restoredDraftNeedsFreshTyping,
  textareaRef,
  timeWarning,
  wordCount,
  onBeforeInput,
  onCompositionEnd,
  onCompositionStart,
  onCut,
  onDragOver,
  onDrop,
  onInput,
  onKeyDown,
  onPaste,
  onSubmitKeywordDay
}: {
  canSubmitKeywordDay?: boolean;
  inactivityTimer: number;
  isKeywordDay?: boolean;
  minEffortBarShown: boolean;
  minEffortDisplayLabel: React.ReactNode;
  minEffortProgress: number;
  minLengthMet: boolean;
  maxResponseLength: number;
  question: string;
  remainingMaxChars: number;
  remainingChars: number;
  response: string;
  responseTooLong: boolean;
  charsOverLimit: number;
  restoredDraftNeedsFreshTyping: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  timeWarning: boolean;
  wordCount: number;
  onBeforeInput: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  onCompositionEnd: (e: React.CompositionEvent<HTMLTextAreaElement>) => void;
  onCompositionStart: () => void;
  onCut: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSubmitKeywordDay?: () => void;
}) {
  return (
    <ErrorBoundary componentPath="DailyQuestionPanel/Writing">
      <div className={containerCls}>
        {!isKeywordDay && (
          <div className={timerContainerCls}>
            <div
              className={css`
                font-family: ${PAPER.serif};
                font-size: 3.4rem;
                font-weight: 600;
                line-height: 1.1;
                color: ${
                  timeWarning && !responseTooLong ? PAPER.warn : PAPER.ink
                };
                ${
                  !restoredDraftNeedsFreshTyping &&
                  !responseTooLong &&
                  timeWarning
                    ? `animation: ${pulseAnimation} 0.5s infinite;`
                    : ''
                }
              `}
            >
              {restoredDraftNeedsFreshTyping || responseTooLong
                ? '--'
                : `${inactivityTimer}s`}
            </div>
            <div
              style={{
                color: PAPER.inkSoft,
                fontSize: '1.2rem',
                fontWeight: 600,
                letterSpacing: '0.04em'
              }}
            >
              {responseTooLong
                ? 'Shorten to continue'
                : restoredDraftNeedsFreshTyping
                  ? 'Make one small edit to resume'
                  : inactivityTimer <= 3
                    ? 'Done?'
                    : 'Keep typing!'}
            </div>
          </div>
        )}

        <p className={questionTextSmallCls}>{question}</p>

        <textarea
          ref={textareaRef}
          value={response}
          onChange={onInput}
          onBeforeInput={onBeforeInput}
          onKeyDown={onKeyDown}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onPaste={onPaste}
          onCut={onCut}
          onDragOver={onDragOver}
          onDrop={onDrop}
          placeholder={
            isKeywordDay
              ? 'Write a little or a lot — anything counts today...'
              : "Just start typing... don't stop to think, just write..."
          }
          className={textareaCls}
          maxLength={maxResponseLength}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          autoFocus
          data-enable-grammarly="false"
          data-gramm="false"
          data-gramm_editor="false"
          spellCheck={false}
        />

        {restoredDraftNeedsFreshTyping && (
          <div
            className={css`
              width: 100%;
              margin-top: 0.75rem;
              padding: 0.75rem 1rem;
              border-radius: 10px;
              background: ${PAPER.accentSoft};
              border-left: 4px solid ${PAPER.accent};
              color: ${PAPER.ink};
              font-size: 1.25rem;
              line-height: 1.4;
            `}
          >
            This restored draft needs one fresh edit before the timer resumes
            and it can be resubmitted safely.
          </div>
        )}

        <div className={statsRowCls}>
          <span style={{ color: PAPER.inkFaint }}>{wordCount} words</span>
          <span
            style={{
              color: responseTooLong ? PAPER.warn : PAPER.inkFaint,
              fontSize: '1.2rem'
            }}
          >
            {responseTooLong
              ? `${charsOverLimit} chars over limit`
              : isKeywordDay || minLengthMet
                ? `${remainingMaxChars.toLocaleString()} chars left`
                : `${remainingChars} chars to go`}
          </span>
        </div>
        {!isKeywordDay && minEffortBarShown && (
          <div style={{ width: '100%', marginTop: '0.8rem' }}>
            <PaperProgress
              label={minEffortDisplayLabel}
              progress={minEffortProgress}
              complete={minLengthMet}
            />
          </div>
        )}
        {isKeywordDay ? (
          <div
            className={css`
              width: 100%;
              display: flex;
              justify-content: center;
              margin-top: 1rem;
            `}
          >
            <button
              type="button"
              className={paperPrimaryButtonCls}
              disabled={!canSubmitKeywordDay || responseTooLong}
              onClick={() => onSubmitKeywordDay?.()}
            >
              <Icon icon="check" />
              Done
            </button>
          </div>
        ) : (
          <div
            style={{
              color: PAPER.inkFaint,
              fontSize: '1.2rem',
              marginTop: '0.6rem'
            }}
          >
            No backspace: keep going.
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
