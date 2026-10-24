import type { EarnHubApp, EarnHubRule } from './useEarnHub';

// One line per app card says what this member can earn here today and how far
// along they are (Mikey 10-24: a per-reward range on the picture beside a
// "0 / 10,000 XP" line read as two different stories). Both numbers come from
// the server's daily total: what was earned today plus what is still possible
// within the app's daily limits.

const n = (value: number) => value.toLocaleString('en-US');

function amount(xp: number, coins: number) {
  return [xp > 0 && `${n(xp)} XP`, coins > 0 && `${n(coins)} Coins`]
    .filter(Boolean)
    .join(' + ');
}

// The daily rematch sits outside the server's "possible today" (whether a
// member may answer it depends on their history), so it is checked apart.
const isRematch = (rule: EarnHubRule) => rule.verifier === 'archive-rematch';
const isOpen = (rule: EarnHubRule) => rule.available && !rule.earnedToday;

// Today's whole amount here: earned so far plus what is still open.
export function getAppToday(app: EarnHubApp) {
  const { today } = app;
  const possible = today.possible || fallbackPossible(app);
  return {
    earnedXP: today.xp,
    earnedCoins: today.coins,
    totalXP: today.xp + possible.xp,
    totalCoins: today.coins + possible.coins,
    leftXP: possible.xp,
    leftCoins: possible.coins
  };
}

// Older servers without `possible`: the best open rules the claim count
// allows, clipped to the budgets (a 0 budget pays nothing), like the server.
function fallbackPossible(app: EarnHubApp) {
  const { today, budgets } = app;
  const claimed = app.rules.filter(
    (rule) => rule.earnedToday && !isRematch(rule)
  ).length;
  const open = app.rules
    .filter((rule) => isOpen(rule) && !isRematch(rule))
    .sort((a, b) => b.xp - a.xp || b.coins - a.coins)
    .slice(
      0,
      budgets.userDailyClaims === null
        ? undefined
        : Math.max(0, budgets.userDailyClaims - claimed)
    );
  const room = (key: 'xp' | 'coins', budget: number, earned: number) =>
    Math.max(
      0,
      Math.min(
        open.reduce((sum, rule) => sum + rule[key], 0),
        budget - earned
      )
    );
  return {
    xp: room('xp', budgets.userDailyXP, today.xp),
    coins: room('coins', budgets.userDailyCoins, today.coins)
  };
}

export function getAppStatus(app: EarnHubApp): { line: string; ratio: number } {
  if (app.allRewardsCollected)
    return { line: 'All rewards collected · you can keep playing', ratio: 1 };
  const day = getAppToday(app);
  const paid = amount(day.earnedXP, day.earnedCoins);
  // Any claim today, even one past the paid tries, means the member played.
  const claimed = !!paid || app.rules.some((rule) => rule.earnedToday);
  const left = !app.today.capReached && (day.leftXP > 0 || day.leftCoins > 0);
  // The daily rematch: the server says per member whether a right answer
  // would still pay (today.rematchOpen). Without that answer (older servers)
  // an unearned rematch rule might be open, so the card promises neither
  // "come back tomorrow" nor the rematch.
  const unearnedRematch = app.rules.some(
    (rule) => isRematch(rule) && isOpen(rule)
  );
  const rematch: 'open' | 'closed' | 'unknown' = !unearnedRematch
    ? 'closed'
    : app.today.rematchOpen === undefined
      ? 'unknown'
      : app.today.rematchOpen
        ? 'open'
        : 'closed';
  if (!left) {
    if (rematch === 'open')
      return {
        line: paid
          ? `You earned ${paid} today · the daily rematch is still open`
          : 'The daily rematch is open today',
        ratio: paid ? 1 : 0
      };
    if (paid)
      return {
        line: `You earned ${paid} today${rematch === 'closed' ? ' · come back tomorrow' : ''}`,
        ratio: 1
      };
    if (rematch === 'unknown') return { line: "See today's rewards", ratio: 0 };
    return claimed
      ? { line: 'Done for today · come back tomorrow', ratio: 1 }
      : { line: 'No rewards open today', ratio: 0 };
  }
  // Nothing paid yet (even after a zero-pay solve): still "Earn up to".
  if (paid) {
    const parts = [
      day.totalXP > 0 && `${n(day.earnedXP)} of ${n(day.totalXP)} XP`,
      day.totalCoins > 0 &&
        `${n(day.earnedCoins)} of ${n(day.totalCoins)} Coins`
    ].filter(Boolean);
    const ratio =
      day.totalXP > 0
        ? day.earnedXP / day.totalXP
        : day.earnedCoins / Math.max(1, day.totalCoins);
    return {
      line: `Earned ${parts.join(' · ')} today`,
      ratio: Math.min(1, ratio)
    };
  }
  // A quiz bounty the member already tried keeps that news on the same line.
  const tried = app.rules.some(
    (rule) =>
      rule.verifier !== 'completion' &&
      !isRematch(rule) &&
      rule.attemptsToday > 0 &&
      !rule.earnedToday
  );
  return {
    line: `Earn up to ${amount(day.totalXP, day.totalCoins)} today${
      tried ? ' · not solved yet' : ''
    }`,
    ratio: 0
  };
}
