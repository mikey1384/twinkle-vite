import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

export interface BountyChallengeInfo {
  tier: 'legendary' | 'hard-won' | 'first-solve' | 'solved';
  // Twinkle sends whether it was a first try, never which try it took
  firstTry?: boolean;
  // beat a puzzle rated well above them
  upset?: boolean;
  // older API payloads (until the server stops sending it)
  attempt?: number;
  firstSolve: boolean;
  failersBefore: number;
  daysStanding: number;
  puzzleRating: number;
}

const count = (n: number, one: string, many: string) =>
  `${Number(n).toLocaleString('en-US')} ${n === 1 ? one : many}`;

// How hard-fought a rated puzzle solve was (Math Lab and other until-earned
// quiz apps), fixed by Twinkle at solve time. The louder the tier, the louder
// the card: a long-undefeated puzzle finally beaten is the biggest moment.
export default function BountyChallenge({
  challenge,
  compact = false
}: {
  challenge?: BountyChallengeInfo | null;
  compact?: boolean;
}) {
  if (!challenge || !TIERS[challenge.tier]) return null;
  const tier = TIERS[challenge.tier];
  const { text: headline, says } = tier.headline(challenge);
  // The facts line never repeats what the headline already says. It never
  // shows the solver's own misses (wrong answers, which try it took): a kid
  // shouldn't have their struggle posted to the feed. Other players' misses
  // and how long the puzzle stood celebrate the solve, so they stay.
  const facts = [
    says !== 'failers' &&
      challenge.failersBefore > 0 &&
      `${count(challenge.failersBefore, 'player', 'players')} missed it`,
    says !== 'days' &&
      challenge.daysStanding > 0 &&
      `stood ${count(challenge.daysStanding, 'day', 'days')}`,
    (challenge.firstTry ?? challenge.attempt === 1) &&
      'solved on the first try',
    challenge.puzzleRating > 0 &&
      `puzzle rating ${challenge.puzzleRating.toLocaleString('en-US')}`
  ].filter(Boolean) as string[];
  const factLine = facts.join(' · ');

  if (challenge.tier === 'solved') {
    if (!factLine) return null;
    return (
      <p
        className={`${challengeClass} bounty-challenge bounty-challenge--plain${compact ? ' bounty-challenge--compact' : ''}`}
      >
        {factLine.charAt(0).toUpperCase() + factLine.slice(1)}
      </p>
    );
  }

  return (
    <div
      className={`${challengeClass} bounty-challenge bounty-challenge--${tier.key}${compact ? ' bounty-challenge--compact' : ''}`}
    >
      <span className="bounty-challenge__label">
        <Icon icon={tier.icon} />
        {tier.label}
      </span>
      <span className="bounty-challenge__headline">{headline}</span>
      {(!compact || challenge.tier === 'legendary') && factLine && (
        <span className="bounty-challenge__facts">
          {factLine.charAt(0).toUpperCase() + factLine.slice(1)}
        </span>
      )}
    </div>
  );
}

const TIERS: Record<
  string,
  {
    key: string;
    label: string;
    icon: string;
    headline: (c: BountyChallengeInfo) => {
      text: string;
      says?: 'failers' | 'days';
    };
  }
> = {
  legendary: {
    key: 'legendary',
    label: 'Legendary solve',
    icon: 'crown',
    headline: (c) =>
      c.daysStanding > 0
        ? {
            text: `Undefeated for ${count(c.daysStanding, 'day', 'days')}, until now`,
            says: 'days'
          }
        : {
            text: `${count(c.failersBefore, 'player', 'players')} missed it, until now`,
            says: 'failers'
          }
  },
  'hard-won': {
    key: 'hard',
    label: 'Hard-won',
    icon: 'fire',
    headline: (c) =>
      c.failersBefore >= 2
        ? {
            text: `${count(c.failersBefore, 'player', 'players')} missed it first`,
            says: 'failers'
          }
        : // proud headlines only, never a count of the solver's misses
          (c.upset ?? (c.attempt !== undefined && c.attempt < 5))
          ? { text: 'Beat a puzzle rated above them' }
          : { text: 'Cracked a tough puzzle' }
  },
  'first-solve': {
    key: 'first',
    label: 'First to crack it',
    icon: 'trophy',
    headline: (c) =>
      c.failersBefore > 0
        ? {
            text: `First solver, after ${count(c.failersBefore, 'player', 'players')} missed it`,
            says: 'failers'
          }
        : { text: 'First solver of this puzzle' }
  },
  solved: {
    key: 'plain',
    label: 'Solved',
    icon: 'star',
    headline: () => ({ text: '' })
  }
};

const challengeClass = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  margin: 0;
  padding: 1rem 1.6rem;
  border-radius: 1.2rem;
  text-align: center;
  overflow-wrap: anywhere;
  animation: bounty-challenge-arrive 0.45s ease-out both;

  .bounty-challenge__label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.9rem;
    border-radius: 999px;
    font-size: max(1.1rem, 11px);
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .bounty-challenge__headline {
    font-size: max(1.7rem, 17px);
    font-weight: 800;
    line-height: 1.3;
  }

  .bounty-challenge__facts {
    font-size: max(1.2rem, 12px);
    line-height: 1.5;
    opacity: 0.85;
  }

  &.bounty-challenge--legendary {
    color: #fff;
    background: ${Color.darkPurple()};
    border: 2px solid ${Color.gold()};
    box-shadow: 0 0 0 4px ${Color.gold(0.25)};

    .bounty-challenge__label {
      color: ${Color.black()};
      background: ${Color.gold()};
    }

    .bounty-challenge__headline {
      font-size: max(2rem, 20px);
    }
  }

  &.bounty-challenge--hard {
    color: ${Color.black()};
    background: ${Color.lightOrange(0.2)};
    border: 1px solid ${Color.orange(0.55)};

    .bounty-challenge__label {
      color: #fff;
      background: ${Color.orange()};
    }
  }

  &.bounty-challenge--first {
    color: ${Color.black()};
    background: ${Color.green(0.1)};
    border: 1px solid ${Color.green(0.45)};

    .bounty-challenge__label {
      color: #fff;
      background: ${Color.fernGreen()};
    }
  }

  &.bounty-challenge--plain {
    padding: 0;
    color: ${Color.darkGray()};
    font-size: max(1.2rem, 12px);
    animation: none;
  }

  &.bounty-challenge--compact {
    align-items: flex-start;
    padding: 0.7rem 1rem;
    text-align: left;

    .bounty-challenge__headline,
    &.bounty-challenge--legendary .bounty-challenge__headline {
      font-size: max(1.4rem, 14px);
    }
  }

  &.bounty-challenge--plain.bounty-challenge--compact {
    padding: 0;
  }

  @keyframes bounty-challenge-arrive {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
