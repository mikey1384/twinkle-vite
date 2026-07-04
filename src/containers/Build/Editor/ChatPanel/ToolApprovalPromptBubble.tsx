import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import type { BuildPendingToolApproval } from './types';

function formatBatteryPercent(units: number) {
  const percent = (Number(units) || 0) / 10_000;
  if (percent <= 0) return '~0%';
  if (percent < 1) return '<1%';
  return `~${Math.round(percent)}%`;
}

export default function ToolApprovalPromptBubble({
  approval,
  busy,
  onApprove,
  onDecline
}: {
  approval: BuildPendingToolApproval;
  busy?: boolean;
  onApprove: (modelId: string) => void;
  onDecline: () => void;
}) {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const selectedOption = approval.modelOptions.find(
    (option) => option.id === selectedModelId
  );

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
      <div
        className={css`
          font-weight: 700;
        `}
      >
        {approval.question}
      </div>
      {approval.imagePrompt ? (
        <div
          className={css`
            color: ${Color.gray()};
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          `}
        >
          “{approval.imagePrompt}”
        </div>
      ) : null}
      {busy ? (
        <div
          className={css`
            color: ${Color.gray()};
          `}
        >
          Generating the image... this can take a minute.
        </div>
      ) : (
        <>
          <div
            className={css`
              display: grid;
              gap: 0.45rem;
            `}
          >
            {approval.modelOptions.map(function renderModelOption(option) {
              const selected = option.id === selectedModelId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedModelId(option.id)}
                  className={css`
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.8rem;
                    text-align: left;
                    border-radius: 10px;
                    padding: 0.6rem 0.85rem;
                    cursor: pointer;
                    font-size: var(--build-workshop-choice-font-size);
                    border: 1px solid
                      ${selected ? Color.logoBlue(0.6) : 'var(--ui-border)'};
                    background: ${selected
                      ? Color.logoBlue(0.08)
                      : 'transparent'};
                    color: var(--chat-text);
                    transition:
                      background-color 0.16s ease,
                      border-color 0.16s ease;
                    &:hover,
                    &:focus-visible {
                      border-color: ${Color.logoBlue(0.6)};
                    }
                  `}
                >
                  <span
                    className={css`
                      font-weight: 800;
                    `}
                  >
                    {option.label}
                  </span>
                  <span
                    className={css`
                      color: ${Color.gray()};
                      font-weight: 600;
                      white-space: nowrap;
                    `}
                  >
                    {option.qualityLabel} · {option.speedLabel} ·{' '}
                    {formatBatteryPercent(option.estimatedBatteryCost)} battery
                  </span>
                </button>
              );
            })}
          </div>
          <div
            className={css`
              display: flex;
              flex-wrap: wrap;
              gap: 0.45rem;
            `}
          >
            <button
              type="button"
              disabled={!selectedOption}
              onClick={() => selectedOption && onApprove(selectedOption.id)}
              className={css`
                border: 1px solid ${Color.green(0.24)};
                background: ${Color.green(0.12)};
                color: ${Color.green()};
                border-radius: 999px;
                padding: 0.5rem 0.9rem;
                font-size: var(--build-workshop-choice-font-size);
                font-weight: 800;
                cursor: pointer;
                &:disabled {
                  opacity: 0.55;
                  cursor: not-allowed;
                }
                &:hover:not(:disabled),
                &:focus-visible:not(:disabled) {
                  border-color: ${Color.green(0.42)};
                  background: ${Color.green(0.2)};
                }
              `}
            >
              {selectedOption
                ? `Generate with ${selectedOption.label}`
                : 'Choose a model to generate'}
            </button>
            <button
              type="button"
              onClick={onDecline}
              className={css`
                border: 1px solid rgba(148, 163, 184, 0.28);
                background: rgba(148, 163, 184, 0.1);
                color: #334155;
                border-radius: 999px;
                padding: 0.5rem 0.9rem;
                font-size: var(--build-workshop-choice-font-size);
                font-weight: 800;
                cursor: pointer;
                &:hover,
                &:focus-visible {
                  border-color: rgba(100, 116, 139, 0.42);
                  background: rgba(148, 163, 184, 0.18);
                  color: #1e293b;
                }
              `}
            >
              No thanks
            </button>
          </div>
          <div
            className={css`
              color: ${Color.gray()};
              font-size: var(--build-workshop-choice-font-size);
            `}
          >
            …or type a reply below to tell Lumine what you want instead.
          </div>
        </>
      )}
    </div>
  );
}
