import React from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

export default function CurrentLevelBadge({
  currentLevel
}: {
  currentLevel: number;
}) {
  const getLevelStyle = (level: number) => {
    if (level === 42) {
      return {
        background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
        border: '2px solid #64748b',
        color: '#f1f5f9',
        fontSize: '1.2rem',
        fontWeight: '700',
        letterSpacing: '0.8px',
        padding: '0.875rem 1.75rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(30, 41, 59, 0.3)',
        icon: '🌌',
        text: ''
      };
    }

    // Progressive styling based on level ranges
    if (level >= 37) {
      // Genius levels (37-41)
      return {
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        border: '2px solid #d97706',
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: '700',
        letterSpacing: '0.8px',
        padding: '0.875rem 1.75rem',
        borderRadius: '14px',
        boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)',
        icon: '👑',
        text: 'GENIUS'
      };
    }

    if (level >= 31) {
      // Legendary levels (31-36)
      return {
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        border: '2px solid #991b1b',
        color: 'white',
        fontSize: '1.15rem',
        fontWeight: '700',
        letterSpacing: '0.6px',
        padding: '0.8rem 1.6rem',
        borderRadius: '12px',
        boxShadow: '0 3px 12px rgba(220, 38, 38, 0.3)',
        icon: '🔥',
        text: 'LEGENDARY'
      };
    }

    if (level >= 25) {
      // Expert levels (25-30)
      return {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        border: '2px solid #7c3aed',
        color: 'white',
        fontSize: '1.15rem',
        fontWeight: '700',
        letterSpacing: '0.6px',
        padding: '0.8rem 1.6rem',
        borderRadius: '12px',
        boxShadow: '0 3px 12px rgba(139, 92, 246, 0.3)',
        icon: '⭐',
        text: 'EXPERT'
      };
    }

    if (level >= 20) {
      // Advanced levels (20-24)
      return {
        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        border: '2px solid #334155',
        color: 'white',
        fontSize: '1.1rem',
        fontWeight: '600',
        letterSpacing: '0.5px',
        padding: '0.75rem 1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(100, 116, 139, 0.2)',
        icon: '⚡',
        text: 'ADVANCED'
      };
    }

    if (level >= 15) {
      // Intermediate levels (15-19)
      return {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        border: '2px solid #1d4ed8',
        color: 'white',
        fontSize: '1.1rem',
        fontWeight: '600',
        letterSpacing: '0.5px',
        padding: '0.75rem 1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
        icon: '🎯',
        text: 'INTERMEDIATE'
      };
    }

    // Beginner levels (1-14)
    return {
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      border: '2px solid #22c55e',
      color: '#15803d',
      fontSize: '1.1rem',
      fontWeight: '600',
      letterSpacing: '0.5px',
      padding: '0.75rem 1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(34, 197, 94, 0.15)',
      icon: '🌱',
      text: 'BEGINNER'
    };
  };

  const style = getLevelStyle(currentLevel);
  const levelText = currentLevel === 42 ? style.text : `LEVEL ${currentLevel}`;

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${style.background};
        color: ${style.color};
        font-weight: ${style.fontWeight};
        font-size: ${style.fontSize};
        border-radius: ${style.borderRadius};
        padding: ${style.padding};
        margin-bottom: 0.75rem;
        text-align: center;
        letter-spacing: ${style.letterSpacing};
        border: ${style.border};
        position: relative;
        overflow: hidden;
        box-shadow: ${style.boxShadow};

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
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 1s ease;
        }

        &:hover:before {
          left: 100%;
        }

        @media (max-width: ${tabletMaxWidth}) {
          font-size: ${parseFloat(style.fontSize) * 0.9}rem;
          padding: 0.625rem 1.25rem;
        }
      `}
    >
      <span style={{ marginRight: '0.5rem', fontSize: '1.2em' }}>
        {style.icon}
      </span>
      {levelText}
      {currentLevel === 42 && (
        <span style={{ marginLeft: '0.5rem', fontSize: '0.8em', opacity: 0.9 }}>
          42
        </span>
      )}
    </div>
  );
}
