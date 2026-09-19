import React from 'react';
import type { RewardProposalEarnings as Earnings } from './types';

export default function RewardProposalEarnings({
  rewards
}: {
  rewards?: Earnings;
}) {
  if (!rewards?.rules.length) return null;
  return (
    <section aria-label="Rewards with these changes">
      <strong>Rewards with these changes</strong>
      <ul>
        {rewards.rules.map((rule, index) => (
          <li key={index}>
            {rule.title}: {rule.xp.toLocaleString()} XP ·{' '}
            {rule.coins.toLocaleString()} Coins
            {rule.maxLifetimeClaims
              ? ` · up to ${rule.maxLifetimeClaims} times per person in total`
              : ''}
            {rule.completionProof ? ' · climb checked by Twinkle' : ''}
          </li>
        ))}
      </ul>
      <p>
        Each person can earn up to{' '}
        {rewards.budgets.userDailyXP.toLocaleString()} XP and{' '}
        {rewards.budgets.userDailyCoins.toLocaleString()} Coins per day.
      </p>
    </section>
  );
}
