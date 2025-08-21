import React from 'react';
import { Color } from '~/constants/css';
import { cardCls } from '../styles';
import Icon from '~/components/Icon';

function StreakProgressCard({
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

  const getProgressBarColor = () => {
    if (needsPromotion) return '#FFD700'; // Gold
    if (currentStreak >= 8) return '#FF8C00'; // Orange
    if (currentStreak >= 6) return '#FF4500'; // Red-orange
    if (currentStreak >= 3) return '#8A2BE2'; // Purple
    return '#4A90E2'; // Blue
  };

  return (
    <div className={cardCls}>
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
            width: '100%',
            transform: `scaleX(${progress})`,
            transformOrigin: 'left',
            background: getProgressBarColor(),
            borderRadius: '4px',
            transition:
              'transform 300ms ease-in-out, background 300ms ease-in-out',
            willChange: 'transform',
            backfaceVisibility: 'hidden'
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
            {targetStreak - currentStreak} more win{targetStreak - currentStreak === 1 ? '' : 's'} to unlock promotion
          </span>
        ) : currentStreak >= 3 ? (
          <span style={{ color: '#1e40af' }}>
            Keep going! {targetStreak - currentStreak} more win{targetStreak - currentStreak === 1 ? '' : 's'} needed
          </span>
        ) : (
          <span style={{ color: '#2d3748' }}>
            Win {targetStreak - currentStreak} puzzle{targetStreak - currentStreak === 1 ? '' : 's'} in a row to unlock
            promotion trial
          </span>
        )}
      </div>
    </div>
  );
}

export default React.memo(StreakProgressCard);
