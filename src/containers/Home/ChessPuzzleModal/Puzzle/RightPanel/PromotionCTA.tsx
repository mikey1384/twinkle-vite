import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

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
          font-family: 'Courier New', monospace;
          cursor: pointer;
          display: flex;
          background: linear-gradient(145deg, #fef2f2, #fecaca);
          border: 3px solid #f87171;
          border-top-color: #fca5a5;
          border-left-color: #fca5a5;
          position: relative;
          overflow: hidden;
          transition: all 0.2s;
          color: #dc2626;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-weight: bold;
          font-size: 1rem;
          border-radius: 8px;
          padding: 0.75rem 1.25rem;
          margin-bottom: 0.75rem;
          box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(220, 38, 38, 0.1),
            0 4px 12px rgba(220, 38, 38, 0.3);
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
          animation: pulse 1.2s infinite;

          @keyframes pulse {
            0% {
              transform: scale(1);
              box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.8),
                inset -2px -2px 4px rgba(220, 38, 38, 0.1),
                0 4px 12px rgba(220, 38, 38, 0.3);
            }
            50% {
              transform: scale(1.05);
              box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.9),
                inset -2px -2px 4px rgba(220, 38, 38, 0.15),
                0 8px 16px rgba(220, 38, 38, 0.4);
            }
            100% {
              transform: scale(1);
              box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.8),
                inset -2px -2px 4px rgba(220, 38, 38, 0.1),
                0 4px 12px rgba(220, 38, 38, 0.3);
            }
          }

          &:before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(220, 38, 38, 0.1),
              transparent
            );
            transition: left 0.5s;
          }

          &:hover:not(:disabled) {
            background: linear-gradient(145deg, #ffffff, #fef2f2);
            border-color: #ef4444;
            border-top-color: #f87171;
            border-left-color: #f87171;
            animation: none;
            box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.9),
              inset -2px -2px 4px rgba(220, 38, 38, 0.15),
              0 6px 16px rgba(220, 38, 38, 0.4);
            transform: translateY(-1px);
          }

          &:hover:not(:disabled):before {
            left: 100%;
          }

          &:active:not(:disabled) {
            background: linear-gradient(145deg, #fecaca, #fef2f2);
            border-top-color: #ef4444;
            border-left-color: #ef4444;
            border-bottom-color: #fca5a5;
            border-right-color: #fca5a5;
            animation: none;
            box-shadow: inset -1px -1px 2px rgba(255, 255, 255, 0.9),
              inset 1px 1px 2px rgba(220, 38, 38, 0.2),
              0 2px 8px rgba(220, 38, 38, 0.2);
            transform: translateY(1px);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            animation: none;
            transform: none;
          }

          @media (max-width: ${tabletMaxWidth}) {
            font-size: 0.9rem;
          }
        `}
      >
        {startingPromotion ? '⏳ Starting...' : '🔥 Promotion trial unlocked!'}
      </button>
    );
  }

  if (cooldownUntilTomorrow) {
    return (
      <button
        disabled={true}
        className={css`
          font-family: 'Courier New', monospace;
          cursor: not-allowed;
          display: flex;
          background: linear-gradient(145deg, #f9fafb, #e5e7eb);
          border: 3px solid #d1d5db;
          border-top-color: #e5e7eb;
          border-left-color: #e5e7eb;
          color: #6b7280;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-weight: bold;
          font-size: 1rem;
          border-radius: 8px;
          padding: 0.75rem 1.25rem;
          margin-bottom: 0.75rem;
          opacity: 0.7;
          width: 100%;
          flex-direction: column;
          gap: 0.25rem;
          box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(107, 114, 128, 0.1),
            0 4px 8px rgba(107, 114, 128, 0.1);
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);

          @media (max-width: ${tabletMaxWidth}) {
            font-size: 0.9rem;
          }
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
