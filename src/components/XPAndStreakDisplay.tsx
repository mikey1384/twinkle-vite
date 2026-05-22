import React from 'react';
import { css } from '@emotion/css';
import { Color, getStreakColor } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

const DEFAULT_XP_NUMBER_COLOR = 'rgba(97, 226, 101, 1)';

export default function XPAndStreakDisplay({
  className,
  xpAwarded,
  streak,
  style
}: {
  className?: string;
  xpAwarded?: number;
  streak?: number;
  style?: React.CSSProperties;
}) {
  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const xpNumberColor = xpNumberRole.getColor() || DEFAULT_XP_NUMBER_COLOR;

  const showXP = xpAwarded && xpAwarded > 0;
  const showStreak = streak && streak > 0;

  if (!showXP && !showStreak) {
    return null;
  }

  return (
    <div
      className={`${css`
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      `} ${className || ''}`}
      style={style}
    >
      {!!showXP && (
        <span
          className={css`
            font-size: 1.2rem;
            font-weight: bold;
          `}
        >
          <span style={{ color: xpNumberColor }}>
            +{addCommasToNumber(xpAwarded)}
          </span>{' '}
          <span style={{ color: Color.gold() }}>XP</span>
        </span>
      )}
      {!!showStreak && (
        <span
          className={css`
            font-size: 1.2rem;
            font-weight: bold;
            color: ${getStreakColor(streak)};
          `}
        >
          🔥 {streak}-day streak
        </span>
      )}
    </div>
  );
}
