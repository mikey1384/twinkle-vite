import React from 'react';
import { css, cx } from '@emotion/css';
import PixelIcon from './PixelIcon';
import { GOLD_STREAK } from './marbleLooks';
import { PIXEL_FONT, inkShadow } from './pixelUi';

// The run's right-answer streak, beside the marbles (Mikey 11-15). The pips
// fill green toward GOLD_STREAK; from there the streak and its marbles are
// gold, so gold always means a great streak.
export default function StreakBadge({
  streak,
  className
}: {
  streak: number;
  className?: string;
}) {
  const gold = streak >= GOLD_STREAK;
  return (
    <span
      className={cx(badgeCls, gold && goldCls, !streak && idleCls, className)}
      role="status"
      aria-label={
        streak
          ? `Streak: ${streak} right in a row${gold ? ', gold streak' : ''}`
          : 'Streak: none yet'
      }
    >
      <PixelIcon name="flame" scale={2} className={streak ? undefined : flameOffCls} />
      {/* keyed so each new right answer pops the count */}
      <span key={streak} className={cx(countCls, streak > 0 && popCls)} aria-hidden>
        STREAK ×{streak}
      </span>
      <span className={pipsCls} aria-hidden>
        {Array.from({ length: GOLD_STREAK }, (_, i) => (
          <span
            key={i}
            className={cx(pipCls, i < streak && (gold ? pipGoldCls : pipOnCls))}
          />
        ))}
      </span>
    </span>
  );
}

const badgeCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.7rem;
  border: 2px solid #ff9a3d;
  border-radius: 4px;
  background: rgba(255, 122, 26, 0.16);
  color: #ffd0a1;
  font-family: ${PIXEL_FONT};
  font-size: 1rem;
  line-height: 1.6;
  white-space: nowrap;
`;
const goldCls = css`
  border-color: #ffcb32;
  background: rgba(255, 203, 50, 0.22);
  color: #ffdc73;
  ${inkShadow(2)}
`;
const idleCls = css`
  border-color: rgba(255, 255, 255, 0.25);
  background: none;
  color: #c4b3d6;
`;
const flameOffCls = css`
  filter: grayscale(1);
  opacity: 0.5;
`;
const countCls = css`
  display: inline-block;
`;
const popCls = css`
  animation: questStreakPop 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
  @keyframes questStreakPop {
    from {
      transform: scale(1.5);
    }
    to {
      transform: none;
    }
  }
`;
const pipsCls = css`
  display: inline-flex;
  gap: 3px;
`;
const pipCls = css`
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 1px #1a1426;
`;
const pipOnCls = css`
  background: #2fbf63;
`;
const pipGoldCls = css`
  background: #ffcb32;
`;
