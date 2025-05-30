import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { radiusSmall } from './styles';

interface StatusHeaderProps {
  phase: 'WAIT_USER' | 'ANIM_ENGINE' | 'SUCCESS' | 'FAIL';
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
    background: ${inTimeAttack && timeLeft !== null
      ? isUrgent
        ? Color.red(0.15)
        : Color.orange(0.1)
      : phase === 'SUCCESS'
      ? Color.green(0.1)
      : phase === 'FAIL'
      ? Color.red(0.1)
      : Color.logoBlue(0.08)};
    color: ${inTimeAttack && timeLeft !== null
      ? isUrgent
        ? Color.red()
        : Color.orange()
      : phase === 'SUCCESS'
      ? Color.green()
      : phase === 'FAIL'
      ? Color.red()
      : Color.logoBlue()};
    border: 1px solid
      ${inTimeAttack && timeLeft !== null
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
  `;

  const getStatusText = () => {
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
