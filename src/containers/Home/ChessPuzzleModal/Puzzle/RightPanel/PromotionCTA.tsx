import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';
import { cardCls } from '../styles';
import { useAppContext, useKeyContext } from '~/contexts';

export default function PromotionCTA({
  needsPromotion,
  inTimeAttack,
  cooldownUntilTomorrow,
  nextDayTimestamp,
  startingPromotion,
  onPromotionClick,
  onRefreshPromotion
}: {
  needsPromotion: boolean;
  inTimeAttack: boolean;
  cooldownUntilTomorrow: boolean;
  nextDayTimestamp: number | null;
  startingPromotion: boolean;
  onPromotionClick: () => void | Promise<void>;
  onRefreshPromotion: () => void | Promise<void>;
}) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [unlocking, setUnlocking] = useState(false);

  const unlockPromotion = useAppContext(
    (v) => v.requestHelpers.unlockPromotion
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { userId, twinkleCoins } = useKeyContext((v) => v.myState);

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

  async function handleUnlockWithCoins() {
    if (!twinkleCoins || twinkleCoins < 100000) return;

    setUnlocking(true);
    try {
      const result = await unlockPromotion();
      if (result.success) {
        // Update coin balance with the new balance from server
        if (result.newBalance !== undefined) {
          onSetUserState({
            userId,
            newState: { twinkleCoins: result.newBalance }
          });
        }
        // Refresh the promotion status to update the UI
        onRefreshPromotion();
      }
    } catch (error) {
      console.error('Failed to unlock promotion with coins:', error);
      // Could add toast notification here
    } finally {
      setUnlocking(false);
    }
  }

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
    const canAffordUnlock = twinkleCoins >= 100000;

    return (
      <div style={{ marginBottom: '0.75rem' }}>
        {/* Status display */}
        <div
          className={css`
            ${cardCls};
            font-family: 'Courier New', monospace;
            display: flex;
            color: #6b7280;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 1rem;
            opacity: 0.7;
            width: 100%;
            flex-direction: column;
            gap: 0.25rem;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
            margin-bottom: 0.5rem;

            @media (max-width: ${tabletMaxWidth}) {
              font-size: 0.9rem;
            }
          `}
        >
          <div>🔒 Promotion failed</div>
          <div style={{ fontSize: '0.85rem' }}>
            {timeLeft ? `Try again in ${timeLeft}` : 'Available tomorrow'}
          </div>
        </div>

        {/* Coin unlock button */}
        <button
          onClick={handleUnlockWithCoins}
          disabled={!canAffordUnlock || unlocking}
          className={css`
            font-family: 'Courier New', monospace;
            cursor: ${canAffordUnlock && !unlocking
              ? 'pointer'
              : 'not-allowed'};
            display: flex;
            background: ${canAffordUnlock && !unlocking
              ? 'linear-gradient(145deg, #fef3c7, #fbbf24)'
              : 'linear-gradient(145deg, #f9fafb, #e5e7eb)'};
            border: 3px solid
              ${canAffordUnlock && !unlocking ? '#f59e0b' : '#d1d5db'};
            border-top-color: ${canAffordUnlock && !unlocking
              ? '#fbbf24'
              : '#e5e7eb'};
            border-left-color: ${canAffordUnlock && !unlocking
              ? '#fbbf24'
              : '#e5e7eb'};
            color: ${canAffordUnlock && !unlocking ? '#92400e' : '#6b7280'};
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 0.9rem;
            border-radius: 8px;
            padding: 0.6rem 1rem;
            width: 100%;
            flex-direction: column;
            gap: 0.25rem;
            opacity: ${canAffordUnlock && !unlocking ? 1 : 0.5};
            transition: all 0.15s ease;
            box-shadow: ${canAffordUnlock && !unlocking
              ? 'inset 2px 2px 4px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(245, 158, 11, 0.1), 0 4px 8px rgba(245, 158, 11, 0.2)'
              : 'inset 2px 2px 4px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(107, 114, 128, 0.1), 0 4px 8px rgba(107, 114, 128, 0.1)'};
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);

            &:hover:not(:disabled) {
              background: linear-gradient(145deg, #ffffff, #fef3c7);
              border-color: #d97706;
              border-top-color: #f59e0b;
              border-left-color: #f59e0b;
              box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.9),
                inset -2px -2px 4px rgba(245, 158, 11, 0.15),
                0 6px 12px rgba(245, 158, 11, 0.3);
              transform: translateY(-1px);
            }

            &:active:not(:disabled) {
              background: linear-gradient(145deg, #fbbf24, #fef3c7);
              border-top-color: #d97706;
              border-left-color: #d97706;
              border-bottom-color: #fbbf24;
              border-right-color: #fbbf24;
              box-shadow: inset -1px -1px 2px rgba(255, 255, 255, 0.9),
                inset 1px 1px 2px rgba(245, 158, 11, 0.2),
                0 2px 6px rgba(245, 158, 11, 0.2);
              transform: translateY(1px);
            }

            @media (max-width: ${tabletMaxWidth}) {
              font-size: 0.85rem;
              padding: 0.5rem 0.8rem;
            }
          `}
        >
          <div style={{ fontSize: '1.1em' }}>
            {unlocking ? '⏳ Unlocking...' : '💰 Unlock with Coins'}
          </div>
          <div style={{ fontSize: '0.8em', opacity: 0.9 }}>
            Cost: 100,000 coins
          </div>
          <div style={{ fontSize: '0.75em', opacity: 0.7 }}>
            You have: {twinkleCoins?.toLocaleString() || '0'}
          </div>
        </button>
      </div>
    );
  }

  return null;
}
