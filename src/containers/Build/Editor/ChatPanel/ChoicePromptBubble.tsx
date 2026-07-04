import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export interface ChoicePromptOption {
  key: string;
  label: string;
  detail?: string;
  tone?: 'positive' | 'neutral' | 'warning';
  disabled?: boolean;
}

const toneStyles = {
  positive: css`
    border: 1px solid ${Color.green(0.24)};
    background: ${Color.green(0.12)};
    color: ${Color.green()};
    &:hover:not(:disabled),
    &:focus-visible:not(:disabled) {
      border-color: ${Color.green(0.42)};
      background: ${Color.green(0.2)};
      color: ${Color.green()};
    }
  `,
  neutral: css`
    border: 1px solid rgba(148, 163, 184, 0.28);
    background: rgba(148, 163, 184, 0.1);
    color: #334155;
    &:hover:not(:disabled),
    &:focus-visible:not(:disabled) {
      border-color: rgba(100, 116, 139, 0.42);
      background: rgba(148, 163, 184, 0.18);
      color: #1e293b;
    }
  `,
  warning: css`
    border: 1px solid rgba(217, 119, 6, 0.2);
    background: rgba(245, 158, 11, 0.11);
    color: #b45309;
    &:hover:not(:disabled),
    &:focus-visible:not(:disabled) {
      border-color: rgba(217, 119, 6, 0.36);
      background: rgba(245, 158, 11, 0.18);
      color: #92400e;
    }
  `
};

export default function ChoicePromptBubble({
  question,
  options,
  footnote,
  busyLabel,
  onSelect
}: {
  question: string;
  options: ChoicePromptOption[];
  footnote?: string;
  busyLabel?: string | null;
  onSelect: (key: string) => void;
}) {
  const busy = Boolean(busyLabel);
  return (
    <div
      className={css`
        align-self: flex-start;
        max-width: 85%;
        padding: 0.85rem 1.05rem;
        border-radius: 12px;
        background: var(--chat-bg);
        color: var(--chat-text);
        border: 1px solid var(--ui-border);
        word-break: break-word;
        font-size: var(--build-workshop-message-font-size);
        line-height: 1.48;
        display: grid;
        gap: 0.65rem;
      `}
    >
      {question ? (
        <div
          className={css`
            font-weight: 700;
          `}
        >
          {question}
        </div>
      ) : null}
      {busy ? (
        <div
          className={css`
            color: ${Color.gray()};
          `}
        >
          {busyLabel}
        </div>
      ) : (
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            gap: 0.45rem;
          `}
        >
          {options.map(function renderOption(option) {
            return (
              <button
                key={option.key}
                type="button"
                disabled={option.disabled}
                onClick={() => onSelect(option.key)}
                className={css`
                  border-radius: 999px;
                  padding: 0.5rem 0.9rem;
                  font-size: var(--build-workshop-choice-font-size);
                  font-weight: 800;
                  cursor: pointer;
                  transition:
                    background-color 0.16s ease,
                    border-color 0.16s ease,
                    color 0.16s ease;
                  &:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                  }
                  ${toneStyles[option.tone || 'neutral']}
                `}
              >
                {option.label}
                {option.detail ? (
                  <span
                    className={css`
                      font-weight: 600;
                      opacity: 0.75;
                      margin-left: 0.4rem;
                    `}
                  >
                    {option.detail}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
      {footnote && !busy ? (
        <div
          className={css`
            color: ${Color.gray()};
            font-size: var(--build-workshop-choice-font-size);
          `}
        >
          {footnote}
        </div>
      ) : null}
    </div>
  );
}
