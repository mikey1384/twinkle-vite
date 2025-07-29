import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import { radiusCard } from '../styles';

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
        background: ${Color.white()};
        border: 1px solid ${Color.borderGray()};
        border-radius: ${radiusCard};
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            Win Streak
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span
            style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: Color[xpNumberColor]()
            }}
          >
            {currentStreak}
          </span>
          <span style={{ fontSize: '0.85rem', color: Color.darkGray() }}>
            / {targetStreak}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: Color.lightGray(),
          borderRadius: '4px',
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
          color: Color.darkGray(),
          textAlign: 'center'
        }}
      >
        {needsPromotion ? (
          <span style={{ color: Color.gold(), fontWeight: 600 }}>
            🔥 Promotion unlocked!
          </span>
        ) : currentStreak >= 7 ? (
          <span style={{ color: Color.orange() }}>
            {targetStreak - currentStreak} more wins to unlock promotion
          </span>
        ) : currentStreak >= 3 ? (
          <span style={{ color: Color.logoBlue() }}>
            Keep going! {targetStreak - currentStreak} more wins needed
          </span>
        ) : (
          <span>
            Win {targetStreak - currentStreak} puzzles in a row to unlock
            promotion
          </span>
        )}
      </div>
    </div>
  );
}
