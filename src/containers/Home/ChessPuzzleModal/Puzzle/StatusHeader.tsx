import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { radiusSmall } from './styles';

interface StatusHeaderProps {
  phase:
    | 'WAIT_USER'
    | 'ANIM_ENGINE'
    | 'SUCCESS'
    | 'FAIL'
    | 'PROMO_SUCCESS'
    | 'PROMO_FAIL'
    | 'TA_CLEAR';
  inTimeAttack?: boolean;
  timeLeft?: number | null;
}

export default function StatusHeader({
  phase,
  inTimeAttack = false,
  timeLeft = null
}: StatusHeaderProps) {
  const isUrgent = inTimeAttack && timeLeft !== null && timeLeft <= 10;

  const statusHeaderCls = css`
    text-align: center;
    padding: 0.75rem 1.5rem;
    border-radius: ${radiusSmall};
    font-size: 1.5rem;
    font-weight: 600;
    background: ${phase === 'PROMO_SUCCESS'
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      : phase === 'PROMO_FAIL'
      ? Color.red(0.15)
      : phase === 'TA_CLEAR'
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      : inTimeAttack && timeLeft !== null
      ? isUrgent
        ? Color.red(0.15)
        : Color.orange(0.1)
      : phase === 'SUCCESS'
      ? Color.green(0.1)
      : phase === 'FAIL'
      ? Color.red(0.1)
      : Color.logoBlue(0.08)};
    color: ${phase === 'PROMO_SUCCESS' ||
    phase === 'PROMO_FAIL' ||
    phase === 'TA_CLEAR'
      ? '#ffffff'
      : inTimeAttack && timeLeft !== null
      ? isUrgent
        ? Color.red()
        : Color.orange()
      : phase === 'SUCCESS'
      ? Color.green()
      : phase === 'FAIL'
      ? Color.red()
      : Color.logoBlue()};
    border: 1px solid
      ${phase === 'PROMO_SUCCESS' || phase === 'TA_CLEAR'
        ? 'transparent'
        : phase === 'PROMO_FAIL'
        ? Color.red(0.3)
        : inTimeAttack && timeLeft !== null
        ? isUrgent
          ? Color.red(0.3)
          : Color.orange(0.3)
        : phase === 'SUCCESS'
        ? Color.green(0.3)
        : phase === 'FAIL'
        ? Color.red(0.3)
        : Color.logoBlue(0.2)};
    ${inTimeAttack && isUrgent
      ? `
      animation: pulse 1s infinite;
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
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

  const getStatusText = () => {
    if (phase === 'PROMO_SUCCESS') {
      return '🎉 Promotion complete! Level unlocked!';
    }

    if (phase === 'PROMO_FAIL') {
      return '💔 Promotion failed - better luck next time!';
    }

    if (phase === 'TA_CLEAR') {
      return '✅ Nice! Keep going...';
    }

    if (inTimeAttack && timeLeft !== null) {
      return `⏱ ${timeLeft}s remaining`;
    }

    switch (phase) {
      case 'SUCCESS':
        return '🎉 Puzzle solved!';
      case 'FAIL':
        return '❌ Try again!';
      case 'WAIT_USER':
        return '🎯 Find the best move';
      case 'ANIM_ENGINE':
        return '⏳ Opponent responds...';
      default:
        return '';
    }
  };

  return <div className={statusHeaderCls}>{getStatusText()}</div>;
}
