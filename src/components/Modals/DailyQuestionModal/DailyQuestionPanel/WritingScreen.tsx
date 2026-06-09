import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ProgressBar from '~/components/ProgressBar';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  containerCls,
  pulseAnimation,
  questionTextSmallCls,
  statsRowCls,
  textareaCls,
  timerContainerCls
} from './styles';

export default function WritingScreen({
  inactivityTimer,
  minEffortBarShown,
  minEffortColor,
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
  onPaste
}: {
  inactivityTimer: number;
  minEffortBarShown: boolean;
  minEffortColor: string;
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
}) {
  return (
    <ErrorBoundary componentPath="DailyQuestionPanel/Writing">
      <div className={containerCls}>
        <div className={timerContainerCls}>
          <div
            className={css`
              font-size: 2.5rem;
              font-weight: bold;
              color: ${timeWarning && !responseTooLong
                ? Color.rose()
                : Color.black()};
              ${!restoredDraftNeedsFreshTyping &&
              !responseTooLong &&
              timeWarning
                ? `animation: ${pulseAnimation} 0.5s infinite;`
                : ''}
            `}
          >
            {restoredDraftNeedsFreshTyping || responseTooLong
              ? '--'
              : `${inactivityTimer}s`}
          </div>
          <div style={{ color: Color.darkerGray(), fontSize: '1.2rem' }}>
            {responseTooLong
              ? 'Shorten to continue'
              : restoredDraftNeedsFreshTyping
                ? 'Make one small edit to resume'
                : inactivityTimer <= 3
                  ? 'Done?'
                  : 'Keep typing!'}
          </div>
        </div>

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
          placeholder="Just start typing... don't stop to think, just write..."
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
              background: ${Color.yellow(0.14)};
              border: 1px solid ${Color.yellow(0.35)};
              color: ${Color.darkerGray()};
              font-size: 1.1rem;
              line-height: 1.4;
            `}
          >
            This restored draft needs one fresh edit before the timer resumes
            and it can be resubmitted safely.
          </div>
        )}

        <div className={statsRowCls}>
          <span style={{ color: Color.lightGray() }}>{wordCount} words</span>
          <span
            style={{
              color: responseTooLong ? Color.rose() : Color.lightGray(),
              fontSize: '1.1rem'
            }}
          >
            {responseTooLong
              ? `${charsOverLimit} chars over limit`
              : minLengthMet
                ? `${remainingMaxChars.toLocaleString()} chars left`
                : `${remainingChars} chars to go`}
          </span>
        </div>
        {minEffortBarShown && (
          <div style={{ width: '100%' }}>
            <ProgressBar
              text={minEffortDisplayLabel}
              color={minEffortColor}
              progress={minEffortProgress}
            />
          </div>
        )}
        <div
          style={{
            color: Color.lightGray(),
            fontSize: '1.1rem',
            marginTop: '0.3rem'
          }}
        >
          No backspace allowed - keep going!
        </div>
      </div>
    </ErrorBoundary>
  );
}
