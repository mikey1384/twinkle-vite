import React from 'react';
import { css, cx } from '@emotion/css';
import RewardChips from '~/components/RewardChips';
import { Color } from '~/constants/css';
import type { ArenaRewardStatus } from './types';

export default function ArenaRewards({
  xp, coins, label = 'Earned', rewardPending, markingPending, emptyNote,
  highlight = false, scoreBonusXp, scoreBonusCoins, rewardStatus, ariaLabel = 'Exam rewards'
}: {
  xp?: number;
  coins?: number;
  label?: 'Earned' | 'Up to' | 'Awarded';
  rewardPending?: boolean;
  markingPending?: boolean;
  emptyNote?: string;
  highlight?: boolean;
  // Optional paid breakdown supplied by the server. Never infer a bonus
  // from the score or treat a later marking top-up as a score bonus.
  scoreBonusXp?: number;
  scoreBonusCoins?: number;
  rewardStatus?: ArenaRewardStatus;
  ariaLabel?: string;
}) {
  const known = Number.isFinite(xp) && Number.isFinite(coins);
  const paid = known && (Number(xp) > 0 || Number(coins) > 0);
  const hasBonus = paid && Number.isFinite(scoreBonusXp) && Number.isFinite(scoreBonusCoins)
    && Number(scoreBonusXp) >= 0 && Number(scoreBonusCoins) >= 0
    && Number(scoreBonusXp) <= Number(xp) && Number(scoreBonusCoins) <= Number(coins)
    && (Number(scoreBonusXp) > 0 || Number(scoreBonusCoins) > 0);
  const note = rewardPending
    ? 'Reward payment pending'
    : markingPending
      ? 'Writing / Speaking marks pending'
      : !paid && known ? rewardStatus === 'below_target' ? 'Reward target not reached'
        : rewardStatus === 'below_skill_target' ? 'A section reward target was not reached'
          : rewardStatus === 'already_rewarded' ? 'These questions have already earned rewards'
          : rewardStatus === 'daily_limit' ? 'Daily exam reward limit reached' : emptyNote : null;
  return (
    <span className={cx(wrapCls, highlight && highlightCls)} aria-label={ariaLabel}>
      {highlight && paid && <span className={labelCls}>
        {rewardPending || markingPending ? 'Awarded so far' : label}
      </span>}
      <span className={rowCls}>
        {paid ? <>
          {!highlight && <span className={labelCls}>{label}</span>}
          <RewardChips xp={xp} coins={coins} className={cx(amountCls, highlight && highlightedAmountCls)} />
        </> : <span>{known
          ? highlight && (rewardPending || markingPending)
            ? 'Rewards pending'
            : `No XP or Coins earned${rewardPending || markingPending ? ' yet' : ''}`
          : 'Reward details unavailable'}</span>}
      </span>
      {hasBonus && <span className={bonusCls} aria-label="Score bonus included">
        <span>Includes score bonus</span>
        <RewardChips xp={scoreBonusXp} coins={scoreBonusCoins} />
      </span>}
      {note && <small>{note}</small>}
    </span>
  );
}

const wrapCls = css`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  color: ${Color.darkGray()};
  font-size: 1.2rem;
  line-height: 1.35;
  small { font-size: 1.1rem; }
`;
const rowCls = css`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
`;
const labelCls = css`font-size: 1.1rem; font-weight: 700;`;
const amountCls = css`font-size: 1.3rem;`;
const highlightCls = css`
  width: 100%;
  padding: 0.9rem 1.1rem;
  gap: 0.55rem;
  border: 1px solid ${Color.logoGreen(0.18)};
  border-radius: 9px;
  background: ${Color.white(0.85)};
  > span:first-child { font-weight: 700; }
`;
const highlightedAmountCls = css`
  &.xp { font-size: 2.3rem; }
  &.coins { font-size: 1.7rem; }
`;
const bonusCls = css`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 1.1rem;
`;
