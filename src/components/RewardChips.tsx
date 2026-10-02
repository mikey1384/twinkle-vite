import React from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

// Shared by daily bonuses, mission rewards, and app bounties. The caller owns
// the row and its responsive placement; each amount keeps the same treatment.
export default function RewardChips({
  xp,
  coins,
  className
}: {
  xp?: number;
  coins?: number;
  className?: string;
}) {
  return (
    <>
      {Number(xp) > 0 && (
        <span className={cx(rewardChipClass, 'reward-amount-chip xp', className)}>
          <span className="reward-chip__xp-number">
            {addCommasToNumber(Number(xp))}
          </span>
          <span className="reward-chip__xp-label">XP</span>
        </span>
      )}
      {Number(coins) > 0 && (
        <span
          className={cx(rewardChipClass, 'reward-amount-chip coins', className)}
          aria-label={`${addCommasToNumber(Number(coins))} ${Number(coins) === 1 ? 'coin' : 'coins'}`}
        >
          <Icon icon="coins" />
          {addCommasToNumber(Number(coins))}
        </span>
      )}
    </>
  );
}

export const rewardChipClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: ${Color.black(0.05)};
  color: ${Color.darkGray()};
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;

  &.xp {
    gap: 0.24rem;
    border: 1px solid ${Color.logoGreen(0.18)};
    background: ${Color.logoGreen(0.09)};
  }

  .reward-chip__xp-number {
    color: ${Color.logoGreen()};
  }

  .reward-chip__xp-label {
    color: ${Color.gold()};
  }

  &.coins {
    background: ${Color.brownOrange(0.13)};
    color: ${Color.brownOrange()};
  }
`;
