import React from 'react';
import { css } from '@emotion/css';
import { headerNavCls } from './styles';
import { tabletMaxWidth } from '~/constants/css';

interface StatusHeaderProps {
  phase:
    | 'ANALYSIS'
    | 'WAIT_USER'
    | 'ANIM_ENGINE'
    | 'SUCCESS'
    | 'FAIL'
    | 'PROMO_SUCCESS'
    | 'PROMO_FAIL'
    | 'TA_CLEAR'
    | 'SOLUTION';
  inTimeAttack?: boolean;
  timeLeft?: number;
  // Optional navigation controls (shown e.g. in analysis mode)
  showNav?: boolean;
  canPrev?: boolean;
  canNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function StatusHeader({
  phase,
  inTimeAttack = false,
  timeLeft = 0,
  showNav = false,
  canPrev = false,
  canNext = false,
  onPrev,
  onNext
}: StatusHeaderProps) {
  const isUrgent = inTimeAttack && timeLeft <= 10;

  const getStatusStyle = () => {
    const baseStyle = {
      textAlign: 'center' as const,
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      fontSize: '1.25rem',
      fontWeight: '600' as const,
      border: '2px solid'
    };

    switch (phase) {
      case 'PROMO_SUCCESS':
      case 'TA_CLEAR':
        return {
          ...baseStyle,
          background: '#dcfce7',
          borderColor: '#16a34a',
          color: '#15803d'
        };

      case 'PROMO_FAIL':
      case 'FAIL':
        return {
          ...baseStyle,
          background: '#fecaca',
          borderColor: '#dc2626',
          color: '#dc2626'
        };

      case 'SUCCESS':
        return {
          ...baseStyle,
          background: '#fef3c7',
          borderColor: '#f59e0b',
          color: '#d97706'
        };

      case 'SOLUTION':
        return {
          ...baseStyle,
          background: '#fed7aa',
          borderColor: '#ea580c',
          color: '#c2410c'
        };

      default:
        if (inTimeAttack) {
          if (timeLeft > 0) {
            if (isUrgent) {
              return {
                ...baseStyle,
                background: '#fecaca',
                borderColor: '#dc2626',
                color: '#dc2626'
              };
            } else {
              return {
                ...baseStyle,
                background: '#fed7aa',
                borderColor: '#ea580c',
                color: '#c2410c'
              };
            }
          } else {
            return {
              ...baseStyle,
              background: '#fecaca',
              borderColor: '#dc2626',
              color: '#dc2626'
            };
          }
        }

        return {
          ...baseStyle,
          background: '#dbeafe',
          borderColor: '#3b82f6',
          color: '#1e40af'
        };
    }
  };

  const statusHeaderCls = css`
    ${Object.entries(getStatusStyle())
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value};`;
      })
      .join('\n    ')}
    position: relative;
    display: block;

    @media (max-width: ${tabletMaxWidth}) {
      font-size: 1.2rem;
      padding: 0.6rem 1.2rem;
    }

    ${inTimeAttack && isUrgent && timeLeft > 0
      ? `
      animation: pulse 1s infinite;
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
    `
      : ''}
    ${phase === 'FAIL'
      ? `
      animation: shake 0.5s ease-in-out;
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `
      : ''}
    ${phase === 'PROMO_SUCCESS'
      ? `
      animation: celebration 2s ease-in-out;
      @keyframes celebration {
        0% { transform: scale(1); }
        25% { transform: scale(1.05); }
        50% { transform: scale(1); }
        75% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
    `
      : ''}
    ${phase === 'TA_CLEAR'
      ? `
      animation: fadeOut 1s ease-in-out forwards;
      @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
      }
    `
      : ''}
  `;

  const navCss = headerNavCls;

  const getStatusText = () => {
    if (phase === 'PROMO_SUCCESS') {
      return '🎉 Promotion complete! Level unlocked!';
    }

    if (phase === 'TA_CLEAR') {
      return '✅ Nice! Keep going...';
    }

    if (inTimeAttack && timeLeft > 0) {
      return `⏱ ${timeLeft}s remaining`;
    }

    if (inTimeAttack && timeLeft <= 0) {
      return "Time's up... Promotion failed";
    }

    switch (phase) {
      case 'SUCCESS':
        return '🎉 Puzzle solved!';
      case 'FAIL':
        return '❌ Failed';
      case 'SOLUTION':
        return '💡 Solution shown';
      case 'WAIT_USER':
        return '🎯 Find the best move';
      case 'ANIM_ENGINE':
        return '⏳ Opponent responds...';
      case 'ANALYSIS':
        return '🎉 Analysis (solved)';
      default:
        return '';
    }
  };

  return (
    <div className={statusHeaderCls}>
      <div style={{ textAlign: 'center', fontWeight: 700 }}>
        {showNav ? 'Board Analysis' : getStatusText()}
      </div>
      {showNav && (
        <div className={navCss}>
          <button onClick={onPrev} disabled={!canPrev}>
            ←
          </button>
          <button onClick={onNext} disabled={!canNext}>
            →
          </button>
        </div>
      )}
    </div>
  );
}
