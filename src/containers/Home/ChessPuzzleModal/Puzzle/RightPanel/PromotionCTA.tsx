import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { radiusButton } from '../styles';
import { formatCooldownTime } from './utils';

export default function PromotionCTA({
  needsPromotion,
  inTimeAttack,
  cooldownSeconds,
  startingPromotion,
  onPromotionClick
}: {
  needsPromotion: boolean;
  inTimeAttack: boolean;
  cooldownSeconds: number | null;
  startingPromotion: boolean;
  onPromotionClick: () => void | Promise<void>;
}) {
  if (inTimeAttack) return null;

  if (needsPromotion) {
    return (
      <button
        onClick={onPromotionClick}
        disabled={startingPromotion}
        className={css`
          background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
          color: #fff;
          border: none;
          border-radius: ${radiusButton};
          padding: 0.75rem 1.25rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
          animation: pulse 1.2s infinite;
          cursor: pointer;
          margin-bottom: 0.75rem;
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
            100% {
              transform: scale(1);
            }
          }
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            animation: none;
          }
        `}
      >
        {startingPromotion
          ? '⏳ Starting...'
          : '🔥 Promotion unlocked! Play now'}
      </button>
    );
  }

  if (cooldownSeconds) {
    return (
      <div
        style={{
          fontSize: '0.9rem',
          color: Color.gray(),
          textAlign: 'center',
          marginBottom: '0.75rem'
        }}
      >
        Next promotion in {formatCooldownTime(cooldownSeconds)}
      </div>
    );
  }

  return null;
}
