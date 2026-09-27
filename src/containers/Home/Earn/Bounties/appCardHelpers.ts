import { css } from '@emotion/css';
import { Color, lineClamp } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import type { EarnHubApp, EarnHubRule } from './useEarnHub';
import { countRewardRows } from './rewardGroups';

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
    // A one-time reward already collected on an earlier day can't be
    // cleared today, so it is not counted as one still to go.
    const countable = app.rules.filter(
      (rule) => rule.earnedToday || rule.lifetime?.remaining !== 0
    ).length;
    // With series the card says "12 rewards" while up to 19 can pay today;
    // "5 of 19" beside it would read as a different list, so say what was
    // earned and let the XP bar show how far along the day is.
    const progress =
      countRewardRows(app.rules) < app.rules.length
        ? `${today.earnedRules} ${
            today.earnedRules === 1 ? 'reward' : 'rewards'
          } earned today`
        : `${today.earnedRules} of ${countable} cleared today`;
    return {
      line: `${progress}${
        cap
          ? ` · ${addCommasToNumber(today.xp)} / ${addCommasToNumber(cap)} XP`
          : ''
      }`,
      ratio: cap
        ? Math.min(1, today.xp / cap)
        : today.earnedRules / Math.max(1, countable)
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

// Counts rows of the rewards dialog, so a series (Fell a great foe, up to 3
// a day) is one reward here too; today's status line still counts payouts.
export function getAppSubtitle(app: EarnHubApp) {
  const rulesCount = countRewardRows(app.rules);
  if (app.kind === 'completion') {
    const noun = `${rulesCount} ${rulesCount === 1 ? 'reward' : 'rewards'}`;
    if (app.rules.some((rule) => rule.maxLifetimeClaims))
      return `${noun}, daily and one-time`;
    return rulesCount < app.rules.length
      ? `${noun}, daily`
      : `${noun}, once a day each`;
  }
  if (app.budgets.userDailyClaims === 1) {
    return `one bounty a day, ${rulesCount} ${rulesCount === 1 ? 'level' : 'levels'}`;
  }
  return `${rulesCount} ${rulesCount === 1 ? 'bounty' : 'bounties'}`;
}

// What one rule pays, e.g. "+10,000 XP · +2,000 Coins".
export function getRulePayout(rule: EarnHubRule) {
  return [
    rule.xp ? `+${addCommasToNumber(rule.xp)} XP` : '',
    rule.coins ? `+${addCommasToNumber(rule.coins)} Coins` : ''
  ]
    .filter(Boolean)
    .join(' · ');
}

// The conditions the server holds a rule to, in plain words: how often it
// pays and, for longer activities, the least time it takes. Timers under five
// minutes are only there to stop instant claims and would read as noise.
export function getRuleConditions(rule: EarnHubRule) {
  const conditions: string[] = [];
  const limit = rule.lifetime?.limit ?? rule.maxLifetimeClaims;
  if (limit === 1) conditions.push('Once per account');
  else if (limit) {
    conditions.push(
      rule.lifetime
        ? `${rule.lifetime.remaining} of ${limit} left in total`
        : `Up to ${limit} times in total`
    );
  } else conditions.push('Once a day');
  if (rule.minSeconds && rule.minSeconds >= 300) {
    const minutes = Math.round(rule.minSeconds / 60);
    conditions.push(
      minutes >= 60 && minutes % 60 === 0
        ? `Takes at least ${minutes / 60} ${minutes === 60 ? 'hour' : 'hours'}`
        : `Takes at least ${minutes} min`
    );
  }
  return conditions;
}

// Where this member stands on one rule today.
export function getRuleState(
  rule: EarnHubRule
): { key: 'earned' | 'collected' | 'unavailable' | 'open'; label: string } {
  if (rule.earnedToday) return { key: 'earned', label: 'Earned today' };
  if (rule.lifetime?.remaining === 0)
    return { key: 'collected', label: 'Collected' };
  if (!rule.available) return { key: 'unavailable', label: 'Not open today' };
  return { key: 'open', label: 'Open' };
}

// One row of the rewards dialog: a single rule, or a series of repeat rules
// shown once ("Up to 3 a day", "1 of 3 today", the per-item payout).
export type RewardRowStateKey =
  'earned' | 'partial' | 'collected' | 'unavailable' | 'open';
export function getRowState(rules: EarnHubRule[]): {
  key: RewardRowStateKey;
  label: string;
  earned: number;
} {
  const states = rules.map(getRuleState);
  const earned = states.filter((state) => state.key === 'earned').length;
  if (rules.length === 1) return { ...states[0], earned };
  const progress = `${earned} of ${rules.length} today`;
  const open = states.some((state) => state.key === 'open');
  if (earned)
    return { key: open ? 'partial' : 'earned', label: progress, earned };
  if (states.every((state) => state.key === 'collected'))
    return { key: 'collected', label: 'Collected', earned };
  if (!open) return { key: 'unavailable', label: 'Not open today', earned };
  return { key: 'open', label: `Open · ${progress}`, earned };
}

export function getRowConditions(rules: EarnHubRule[]) {
  const conditions = getRuleConditions(rules[0]);
  if (rules.length < 2) return conditions;
  const daily = conditions.indexOf('Once a day');
  if (daily >= 0) conditions[daily] = `Up to ${rules.length} a day`;
  else conditions.unshift(`${rules.length} rewards`);
  return conditions;
}

export function getRowPayout(rules: EarnHubRule[]) {
  const [rule] = rules;
  if (rules.length > 1) return `${getRulePayout(rule)} each`;
  return rule.earnedToday
    ? getRulePayout({ ...rule, ...rule.earnedToday })
    : getRulePayout(rule);
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

// The title and its New badge: the title text is capped at two lines so a
// long title can never push the badge out or stretch the card.
export const appTitleRowClass = css`
  display: flex;
  align-items: center;
  min-width: 0;
`;
export const appTitleTextClass = css`
  min-width: 0;
  overflow-wrap: anywhere;
  ${lineClamp(2)}
`;

export const newBadgeClass = css`
  display: inline-block;
  flex-shrink: 0;
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
