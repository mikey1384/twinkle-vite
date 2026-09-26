import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import type { EarnHubApp } from './useEarnHub';

// Shared by every App Store card shape (top pick, grid card, ranked row) so
// the payout, today's status and the popularity line read the same everywhere.

export function getAppPayout(app: EarnHubApp) {
  const xp =
    app.minXP && app.minXP !== app.maxXP
      ? `${addCommasToNumber(app.minXP)}–${addCommasToNumber(app.maxXP)} XP`
      : `up to ${addCommasToNumber(app.maxXP)} XP`;
  return app.maxCoins > 0
    ? `${xp} + ${addCommasToNumber(app.maxCoins)} Coins`
    : xp;
}

export function getAppStatus(app: EarnHubApp) {
  const { today } = app;
  const rulesCount = app.rules.length;
  if (app.allRewardsCollected) {
    return { line: 'All rewards collected · you can keep playing', ratio: 1 };
  }
  if (today.capReached) {
    return {
      line: `Done for today · +${addCommasToNumber(today.xp)} XP${
        today.coins ? ` + ${addCommasToNumber(today.coins)} Coins` : ''
      }`,
      ratio: 1
    };
  }
  if (app.kind === 'completion') {
    const cap = app.budgets.userDailyXP;
    return {
      line: `${today.earnedRules} of ${rulesCount} cleared today${
        cap
          ? ` · ${addCommasToNumber(today.xp)} / ${addCommasToNumber(cap)} XP`
          : ''
      }`,
      ratio: cap
        ? Math.min(1, today.xp / cap)
        : today.earnedRules / Math.max(1, rulesCount)
    };
  }
  const tried = app.rules.some(
    (rule) => rule.attemptsToday > 0 && !rule.earnedToday
  );
  if (today.earnedRules) {
    return {
      line: `Earned today · +${addCommasToNumber(today.xp)} XP${
        today.coins ? ` + ${addCommasToNumber(today.coins)} Coins` : ''
      }`,
      ratio: 1
    };
  }
  return {
    line: tried
      ? `Today's bounty · tried, not solved yet`
      : `Today's bounty · not tried yet`,
    ratio: 0
  };
}

export function getAppSubtitle(app: EarnHubApp) {
  const rulesCount = app.rules.length;
  if (app.kind === 'completion') {
    return `${rulesCount} ${rulesCount === 1 ? 'reward' : 'rewards'}, once a day each`;
  }
  if (app.budgets.userDailyClaims === 1) {
    return `one bounty a day, ${rulesCount} ${rulesCount === 1 ? 'level' : 'levels'}`;
  }
  return `${rulesCount} ${rulesCount === 1 ? 'bounty' : 'bounties'}`;
}

// "12 players this week"; nothing at all when nobody played, so a quiet app
// is not labelled with a zero.
export function getPlayersLine(app: EarnHubApp) {
  const players = Number(app.popularity?.playersThisWeek) || 0;
  if (players <= 0) return '';
  return `${addCommasToNumber(players)} ${
    players === 1 ? 'player' : 'players'
  } this week`;
}

export const newBadgeClass = css`
  display: inline-block;
  margin-left: 0.6rem;
  padding: 0.1rem 0.7rem;
  border-radius: 999px;
  background: ${Color.green(0.14)};
  color: #1b6e1e;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.5;
  vertical-align: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;
