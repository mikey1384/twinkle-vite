import React from 'react';
import { css } from '@emotion/css';
import RewardChips from '~/components/RewardChips';
import type { ArenaRewardOffer } from './types';

export default function RewardOffer({ offer, compact = false }: { offer: ArenaRewardOffer; compact?: boolean }) {
  const available = offer.xp > 0 || offer.coins > 0;
  const reduced = offer.freshPoints != null && offer.totalPoints != null && offer.freshPoints < offer.totalPoints;
  return <div className={offerCls} aria-label="Exam reward target">
    {offer.mastery && <section className={masteryCls} aria-label="Full Hard mastery progress">
      <strong>{offer.mastery.completed ? 'Full Hard mastery completed' : `Full Hard mastery · ${offer.mastery.clears} / ${offer.mastery.required} clears`}</strong>
      <p>{offer.mastery.completed
        ? 'Your one-time mastery reward is complete. New papers earn ordinary rewards, with companion help available.'
        : offer.mastery.solo
          ? `Your next clear is the solo mastery run: ${offer.mastery.required} different papers mastered.`
          : `Clear ${offer.mastery.required} different Full Hard papers. The final clear is solo and pays 20× XP and Coins once.`}</p>
      {offer.mastery.pending && <p>Waiting for the final marks on your previous Full Hard paper.</p>}
    </section>}
    {offer.nextPaperAvailable === false && <p role="status">Your next different paper is being prepared. Previous results stay available for review.</p>}
    <strong>Reward target: {offer.target} / {offer.max}</strong>
    {!!offer.requirements?.length && (compact
      ? <p>Also reach 50% in each required skill group.</p>
      : <RewardRequirements requirements={offer.requirements} />)}
    {available ? <>
      <div><span>{offer.masteryReward && offer.target < offer.masteryReward.target ? 'Ordinary target' : 'At target'}</span><RewardChips xp={offer.baseXP} coins={offer.baseCoins} /></div>
      {offer.masteryReward && <div><span>Mastery clear ({offer.masteryReward.target}+)</span><RewardChips xp={offer.masteryReward.xp} coins={offer.masteryReward.coins} /></div>}
      <div><span>{offer.masteryReward ? 'Mastery · full marks' : 'Full marks'}</span><RewardChips xp={offer.xp} coins={offer.coins} /></div>
    </> : <p>{offer.dailyRemaining === 0 ? 'Daily exam reward limit reached.' : 'These questions have already earned rewards.'}</p>}
    {!compact && <>
      <p>Reach all reward targets to earn XP and Coins. Higher total scores earn a larger bonus.</p>
      {reduced && <p>The amounts shown exclude questions you have already been rewarded for.</p>}
      {!!offer.pendingOverlapPoints && <p>Another exam containing some of these questions is awaiting its result. Each question can earn rewards once, so the final amounts may be lower.</p>}
      {offer.markingRequired && <p>Rewards arrive after the final Writing / Speaking marks.</p>}
      <p>One new exam per day across all exams and lengths. Starting uses today’s attempt, even if you leave or do not reach the reward target. You can resume the same exam. Resets at 9:00 AM Korea time (00:00 UTC).</p>
      <p>Each new sitting uses a different published paper. If the next one is not ready, wait while you review previous results. There is no weekly cooldown.</p>
      {!offer.mastery && <p>Only Full + Hard advances the 25-clear mastery track. All other lengths and difficulties earn ordinary rewards.</p>}
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

const masteryCls = css`
  width: 100%; padding: 0.7rem 0; border-bottom: 1px solid currentColor;
  strong { font-size: 1.3rem; } p { margin: 0.3rem 0; }
`;

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
