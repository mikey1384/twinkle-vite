import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';

export const rewardLevels = [1, 2, 3, 4, 5, 25, 50];

export default function RewardAmountPicker({
  rewardLevel,
  onSetRewardLevel,
  disabled = false
}: {
  rewardLevel: number;
  onSetRewardLevel: (level: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Reward amount"
      className={css`
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
        gap: 8px;
        width: 100%;
        margin-top: 16px;
        button {
          min-height: 44px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          color: #334155;
          padding: 8px;
          font: inherit;
          font-size: 14px;
          line-height: 1.4;
          cursor: pointer;
        }
        button[aria-pressed='true'] {
          background: #eef2ff;
          border-color: #334155;
          box-shadow: inset 0 0 0 1px #334155;
          font-weight: 700;
        }
        button:focus-visible {
          outline: 2px solid #334155;
          outline-offset: 2px;
        }
        button:disabled {
          opacity: 0.6;
          cursor: default;
        }
      `}
    >
      {rewardLevels.map((level) => (
        <button
          key={level}
          type="button"
          disabled={disabled}
          aria-pressed={rewardLevel === level}
          aria-label={`${level * 200} XP for ${level * 200} coins`}
          onClick={() => {
            if (!disabled) onSetRewardLevel(level);
          }}
        >
          <Icon icon="certificate" />{' '}
          <span>{(level * 200).toLocaleString('en-US')} XP</span>
        </button>
      ))}
      <button
        type="button"
        disabled={disabled || rewardLevel === 0}
        onClick={() => {
          if (!disabled) onSetRewardLevel(0);
        }}
      >
        Clear
      </button>
    </div>
  );
}
