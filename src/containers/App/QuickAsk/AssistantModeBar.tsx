import React from 'react';
import { css, cx } from '@emotion/css';
import { Color } from '~/constants/css';
import type { AssistantMode } from './assistantMode';

// The Temporary / Saved switch every Zero/Ciel surface shows (the floating
// window in both modes and the Home box), with one honest line saying where
// this conversation goes. Callers decide what a switch does on their surface.
export function assistantModeLabel(
  mode: AssistantMode,
  assistant: 'Zero' | 'Ciel'
) {
  return mode === 'temporary'
    ? 'Not saved to your history'
    : `Saved to your chat with ${assistant}`;
}

export default function AssistantModeBar({
  assistant,
  mode,
  busy = false,
  variant = 'strip',
  onChange
}: {
  assistant: 'Zero' | 'Ciel';
  mode: AssistantMode;
  busy?: boolean;
  // 'strip': the band under a window's header; 'inline': under the Home box
  variant?: 'strip' | 'inline';
  onChange: (next: AssistantMode) => void;
}) {
  return (
    <div
      data-no-drag=""
      className={cx(
        css`
          display: flex;
          align-items: center;
          gap: 0.8rem;
          min-width: 0;
          font-size: 1.15rem;
          color: #4c5767;
          flex-shrink: 0;
        `,
        variant === 'strip' &&
          css`
            padding: 0.5rem 0.9rem;
            background: #edf1f6;
            border-top: 1px solid var(--ui-border);
            border-bottom: 1px solid var(--ui-border);
          `
      )}
    >
      <div
        role="radiogroup"
        aria-label={`How your conversation with ${assistant} is kept`}
        className={css`
          display: inline-flex;
          flex-shrink: 0;
          padding: 2px;
          border: 1px solid var(--ui-border);
          border-radius: 999px;
          background: #e3e9f0;
        `}
      >
        {(['temporary', 'saved'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            disabled={busy}
            onClick={() => {
              if (mode !== option) onChange(option);
            }}
            className={css`
              border: none;
              border-radius: 999px;
              padding: 0.25rem 0.85rem;
              font-size: 1.1rem;
              font-weight: 700;
              background: transparent;
              color: #5b6880;
              cursor: pointer;
              &[aria-checked='true'] {
                background: #fff;
                color: ${Color.logoBlue()};
                box-shadow: 0 1px 2px #0002;
              }
              &:disabled {
                cursor: default;
              }
            `}
          >
            {option === 'temporary' ? 'Temporary' : 'Saved'}
          </button>
        ))}
      </div>
      <span
        aria-live="polite"
        className={css`
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        `}
      >
        {assistantModeLabel(mode, assistant)}
      </span>
    </div>
  );
}
