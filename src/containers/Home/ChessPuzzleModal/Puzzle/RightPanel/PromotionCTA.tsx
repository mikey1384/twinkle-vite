import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { radiusButton } from '../styles';

export default function PromotionCTA({
  needsPromotion,
  inTimeAttack,
  cooldownUntilTomorrow,
  nextDayTimestamp,
  startingPromotion,
  onPromotionClick
}: {
  needsPromotion: boolean;
  inTimeAttack: boolean;
  cooldownUntilTomorrow: boolean;
  nextDayTimestamp: number | null;
  startingPromotion: boolean;
  onPromotionClick: () => void | Promise<void>;
}) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!cooldownUntilTomorrow || !nextDayTimestamp) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = nextDayTimestamp - now;

      if (remaining <= 0) {
        setTimeLeft('');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntilTomorrow, nextDayTimestamp]);
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

  if (cooldownUntilTomorrow) {
    return (
      <button
        disabled={true}
        className={css`
          background: ${Color.gray(0.1)};
          color: ${Color.gray()};
          border: 1px solid ${Color.gray(0.3)};
          border-radius: ${radiusButton};
          padding: 0.75rem 1.25rem;
          font-weight: 600;
          cursor: not-allowed;
          margin-bottom: 0.75rem;
          opacity: 0.7;
          text-align: center;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        `}
      >
        <div>🔒 Promotion failed</div>
        <div style={{ fontSize: '0.85rem' }}>
          {timeLeft ? `Try again in ${timeLeft}` : 'Available tomorrow'}
        </div>
      </button>
    );
  }

  return null;
}

