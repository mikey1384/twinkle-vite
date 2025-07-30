import React from 'react';
import { css } from '@emotion/css';
import { Color, tabletMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

export default function StreakProgressCard({
  currentStreak,
  needsPromotion,
  xpNumberColor
}: {
  currentStreak: number;
  needsPromotion: boolean;
  xpNumberColor: string;
}) {
  const targetStreak = 10;
  const progress = Math.min(currentStreak / targetStreak, 1);
  const progressPercent = progress * 100;

  // Dynamic color for progress bar
  const getProgressBarColor = () => {
    if (needsPromotion) return '#FFD700'; // Gold
    if (currentStreak >= 8) return '#FF8C00'; // Orange
    if (currentStreak >= 6) return '#FF4500'; // Red-orange
    if (currentStreak >= 3) return '#8A2BE2'; // Purple
    return '#4A90E2'; // Blue
  };

  return (
    <div
      className={css`
        background: #f7fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;

        @media (max-width: ${tabletMaxWidth}) {
          padding: 0.8rem;
        }
      `}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon
            icon="fire"
            style={{ color: getProgressBarColor(), fontSize: '1.2rem' }}
          />
          <span
            style={{
              fontWeight: '600',
              fontSize: '0.9rem',
              color: '#374151'
            }}
          >
            Win Streak
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span
            style={{
              fontSize: '1.3rem',
              fontWeight: '700',
              color: Color[xpNumberColor]()
            }}
          >
            {currentStreak}
          </span>
          <span
            style={{
              fontSize: '0.85rem',
              color: '#6b7280'
            }}
          >
            / {targetStreak}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '12px',
          background: '#e2e8f0',
          border: '1px solid #cbd5e0',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '0.5rem'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: getProgressBarColor(),
            borderRadius: '4px',
            transition: 'width 0.3s ease-in-out, background 0.3s ease-in-out'
          }}
        />
      </div>

      {/* Status text */}
      <div
        style={{
          fontSize: '0.8rem',
          color: '#374151',
          textAlign: 'center',
          fontWeight: '600'
        }}
      >
        {needsPromotion ? (
          <span style={{ color: '#d97706', fontWeight: 'bold' }}>
            🔥 Promotion unlocked!
          </span>
        ) : currentStreak >= 7 ? (
          <span style={{ color: '#ea580c' }}>
            {targetStreak - currentStreak} more wins to unlock promotion
          </span>
        ) : currentStreak >= 3 ? (
          <span style={{ color: '#1e40af' }}>
            Keep going! {targetStreak - currentStreak} more wins needed
          </span>
        ) : (
          <span style={{ color: '#2d3748' }}>
            Win {targetStreak - currentStreak} puzzles in a row to unlock
            promotion
          </span>
        )}
      </div>
    </div>
  );
}
