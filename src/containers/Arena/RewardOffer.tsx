import React from 'react';
import { css } from '@emotion/css';
import RewardChips from '~/components/RewardChips';
import type { ArenaRewardOffer } from './types';

export default function RewardOffer({ offer, compact = false }: { offer: ArenaRewardOffer; compact?: boolean }) {
  const available = offer.xp > 0 || offer.coins > 0;
  const reduced = offer.freshPoints != null && offer.totalPoints != null && offer.freshPoints < offer.totalPoints;
  return <div className={offerCls} aria-label="Exam reward target">
    <strong>Reward target: {offer.target} / {offer.max}</strong>
    {!!offer.requirements?.length && (compact
      ? <p>Also reach 50% in each required skill group.</p>
      : <RewardRequirements requirements={offer.requirements} />)}
    {available ? <>
      <div><span>At target</span><RewardChips xp={offer.baseXP} coins={offer.baseCoins} /></div>
      <div><span>Full marks</span><RewardChips xp={offer.xp} coins={offer.coins} /></div>
    </> : <p>{offer.dailyRemaining === 0 ? 'Daily exam reward limit reached.' : 'These questions have already earned rewards.'}</p>}
    {!compact && <>
      <p>Reach all reward targets to earn XP and Coins. Higher total scores earn a larger bonus.</p>
      {reduced && <p>The amounts shown exclude questions you have already been rewarded for.</p>}
      {!!offer.pendingOverlapPoints && <p>Another exam containing some of these questions is awaiting its result. Each question can earn rewards once, so the final amounts may be lower.</p>}
      {offer.markingRequired && <p>Rewards arrive after the final Writing / Speaking marks.</p>}
      {offer.dailyRemaining != null && <p>{offer.dailyRemaining} of 5 exam rewards available today (UTC). Pending exams count towards the day you start them.</p>}
    </>}
  </div>;
}

export function RewardRequirements({ requirements, results = false }: {
  requirements: ArenaRewardOffer['requirements']; results?: boolean;
}) {
  if (!requirements?.length) return null;
  return <section className={requirementsCls} aria-label="Section reward targets">
    <p>{results ? 'Section reward targets' : 'Also reach these minimums (50% in each group):'}</p>
    <ul>{requirements.map(group => <li key={group.id}>
      <span>{group.label}</span>{' '}
      <strong>{results
        ? group.earned == null ? 'Marks pending' : `${group.earned} / ${group.max}`
        : `${group.target} / ${group.max}`}</strong>
      {results && <span> · minimum {group.target}{group.earned == null ? '' : group.earned >= group.target ? ' · Reached' : ' · Not reached'}</span>}
    </li>)}</ul>
  </section>;
}

const requirementsCls = css`
  width: 100%;
  font-size: 1.1rem;
  line-height: 1.4;
  p { margin: 0.2rem 0; }
  ul { margin: 0.25rem 0; padding-left: 1.4rem; }
  li { margin: 0.2rem 0; overflow-wrap: anywhere; }
`;

const offerCls = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: 1.2rem;
  line-height: 1.4;
  > div { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
  > div > span:first-child { min-width: 6.2rem; font-weight: 600; }
  p { margin: 0.2rem 0; font-size: 1.1rem; }
`;
