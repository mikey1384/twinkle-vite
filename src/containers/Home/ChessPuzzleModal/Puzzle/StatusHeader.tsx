import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { radiusSmall } from './styles';

interface StatusHeaderProps {
  phase: 'WAIT_USER' | 'ANIM_ENGINE' | 'SUCCESS' | 'FAIL';
}

export default function StatusHeader({ phase }: StatusHeaderProps) {
  const statusHeaderCls = css`
    text-align: center;
    padding: 0.75rem 1.5rem;
    border-radius: ${radiusSmall};
    font-size: 1.5rem;
    font-weight: 600;
    background: ${phase === 'SUCCESS'
      ? Color.green(0.1)
      : phase === 'FAIL'
      ? Color.red(0.1)
      : Color.logoBlue(0.08)};
    color: ${phase === 'SUCCESS'
      ? Color.green()
      : phase === 'FAIL'
      ? Color.red()
      : Color.logoBlue()};
    border: 1px solid
      ${phase === 'SUCCESS'
        ? Color.green(0.3)
        : phase === 'FAIL'
        ? Color.red(0.3)
        : Color.logoBlue(0.2)};
  `;

  const getStatusText = () => {
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
