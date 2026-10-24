import assert from 'node:assert/strict';
import test from 'node:test';

import { getAppStatus } from '../src/containers/Home/Earn/Bounties/appToday';
import type {
  EarnHubApp,
  EarnHubRule
} from '../src/containers/Home/Earn/Bounties/useEarnHub';

function rule(
  id: string,
  xp: number,
  coins: number,
  extra: Partial<EarnHubRule> = {}
): EarnHubRule {
  return {
    id,
    title: id,
    xp,
    coins,
    verifier: 'completion',
    available: true,
    earnedToday: null,
    attemptsToday: 0,
    ...extra
  };
}
function app(
  extra: Partial<EarnHubApp> & { today?: Partial<EarnHubApp['today']> } = {}
): EarnHubApp {
  const { today, ...rest } = extra;
  return {
    buildId: 1,
    title: 'A',
    ownerId: 1,
    ownerUsername: 'a',
    thumbnailUrl: null,
    kind: 'completion',
    maxXP: 3000,
    maxCoins: 300,
    minXP: 800,
    budgets: {
      userDailyXP: 10000,
      userDailyCoins: 1000,
      userDailyClaims: null
    },
    rules: [rule('r1', 3000, 300), rule('r2', 800, 80)],
    ...rest,
    today: {
      xp: 0,
      coins: 0,
      claims: 0,
      earnedRules: 0,
      openRules: 2,
      capReached: false,
      possible: { xp: 10000, coins: 1000 },
      ...today
    }
  };
}

test('one line: the whole day the server says is possible', () => {
  assert.deepEqual(getAppStatus(app()), {
    line: 'Earn up to 10,000 XP + 1,000 Coins today',
    ratio: 0
  });
});

test('progress counts against the same total', () => {
  const s = getAppStatus(
    app({
      today: {
        xp: 2500,
        coins: 250,
        earnedRules: 1,
        possible: { xp: 7500, coins: 750 }
      }
    })
  );
  assert.equal(s.line, 'Earned 2,500 of 10,000 XP · 250 of 1,000 Coins today');
  assert.equal(s.ratio, 0.25);
});

test('done for the day says so plainly', () => {
  const s = getAppStatus(
    app({
      today: {
        xp: 10000,
        coins: 1000,
        earnedRules: 4,
        capReached: true,
        possible: { xp: 0, coins: 0 }
      }
    })
  );
  assert.equal(
    s.line,
    'You earned 10,000 XP + 1,000 Coins today · come back tomorrow'
  );
  assert.equal(s.ratio, 1);
});

test('nothing open and nothing earned', () => {
  assert.equal(
    getAppStatus(app({ today: { possible: { xp: 0, coins: 0 } } })).line,
    'No rewards open today'
  );
});

test('a tried quiz bounty keeps that news on the line', () => {
  const s = getAppStatus(
    app({
      kind: 'quiz',
      rules: [
        rule('b', 70000, 5000, { verifier: 'numeric-quiz', attemptsToday: 1 })
      ],
      today: { possible: { xp: 70000, coins: 5000 } }
    })
  );
  assert.equal(
    s.line,
    'Earn up to 70,000 XP + 5,000 Coins today · not solved yet'
  );
});

test('older servers without possible: open rules clipped to the daily limit', () => {
  const s = getAppStatus(
    app({
      rules: [rule('r1', 8000, 800), rule('r2', 5000, 500)],
      today: { possible: undefined }
    })
  );
  assert.equal(s.line, 'Earn up to 10,000 XP + 1,000 Coins today');
});

test('coins-only app', () => {
  const s = getAppStatus(
    app({
      budgets: { userDailyXP: 0, userDailyCoins: 500, userDailyClaims: null },
      today: { coins: 100, earnedRules: 1, possible: { xp: 0, coins: 400 } }
    })
  );
  assert.equal(s.line, 'Earned 100 of 500 Coins today');
});

const rematch = (extra: Partial<EarnHubRule> = {}) =>
  rule('rematch-daily', 20000, 0, { verifier: 'archive-rematch', ...extra });

test('an unearned daily rematch: promise neither "come back tomorrow" nor the rematch', () => {
  const solved = app({
    kind: 'quiz',
    rules: [
      rule('e1', 70000, 5000, {
        verifier: 'numeric-quiz',
        earnedToday: { xp: 70000, coins: 5000, attempt: 1 }
      }),
      rematch()
    ],
    today: {
      xp: 70000,
      coins: 5000,
      claims: 1,
      earnedRules: 1,
      capReached: true,
      possible: { xp: 0, coins: 0 }
    }
  });
  assert.equal(
    getAppStatus(solved).line,
    'You earned 70,000 XP + 5,000 Coins today'
  );
  const onlyRematch = app({
    kind: 'quiz',
    rules: [rematch()],
    today: { possible: { xp: 0, coins: 0 } }
  });
  assert.equal(getAppStatus(onlyRematch).line, "See today's rewards");
  const both = app({
    ...solved,
    rules: [
      solved.rules[0],
      rematch({ earnedToday: { xp: 20000, coins: 0, attempt: 1 } })
    ],
    today: { ...solved.today, xp: 90000, claims: 2 }
  });
  assert.equal(
    getAppStatus(both).line,
    'You earned 90,000 XP + 5,000 Coins today · come back tomorrow'
  );
});

test('a zero-pay rematch solve does not turn "Earn up to" into "Earned 0 of"', () => {
  const s = getAppStatus(
    app({
      rules: [
        rule('a', 8000, 800),
        rematch({ earnedToday: { xp: 0, coins: 0, attempt: 4 } })
      ],
      today: { claims: 1, earnedRules: 1, possible: { xp: 8000, coins: 800 } }
    })
  );
  assert.equal(s.line, 'Earn up to 8,000 XP + 800 Coins today');
});

test('a used-up rematch try is not "not solved yet"', () => {
  const s = getAppStatus(
    app({
      kind: 'quiz',
      rules: [
        rule('q', 70000, 5000, { verifier: 'numeric-quiz' }),
        rematch({ attemptsToday: 3 })
      ],
      today: { possible: { xp: 70000, coins: 5000 } }
    })
  );
  assert.equal(s.line, 'Earn up to 70,000 XP + 5,000 Coins today');
});

test('a zero-pay solve past the paid tries still reads as done', () => {
  const s = getAppStatus(
    app({
      rules: [
        rule('r1', 3000, 300, { earnedToday: { xp: 0, coins: 0, attempt: 4 } })
      ],
      today: {
        claims: 1,
        earnedRules: 1,
        capReached: true,
        possible: { xp: 0, coins: 0 }
      }
    })
  );
  assert.equal(s.line, 'Done for today · come back tomorrow');
});

test('an unfinished completion attempt in a mixed app is not "not solved yet"', () => {
  const s = getAppStatus(
    app({
      kind: 'mixed',
      rules: [
        rule('c', 1000, 100, { attemptsToday: 1 }),
        rule('q', 2000, 0, { verifier: 'numeric-quiz' })
      ]
    })
  );
  assert.equal(s.line, 'Earn up to 10,000 XP + 1,000 Coins today');
});

test('fallback: a 0 budget pays nothing, the claim count and rematch are respected', () => {
  const s = getAppStatus(
    app({
      budgets: { userDailyXP: 50000, userDailyCoins: 0, userDailyClaims: 1 },
      rules: [rule('a', 8000, 800), rule('b', 5000, 500), rematch()],
      today: { possible: undefined }
    })
  );
  assert.equal(s.line, 'Earn up to 8,000 XP today');
});

test('nothing paid with a rematch maybe open: no "done" claim', () => {
  const s = getAppStatus(
    app({
      rules: [
        rule('r1', 3000, 300, { earnedToday: { xp: 0, coins: 0, attempt: 4 } }),
        rematch()
      ],
      today: {
        claims: 1,
        earnedRules: 1,
        capReached: true,
        possible: { xp: 0, coins: 0 }
      }
    })
  );
  assert.equal(s.line, "See today's rewards");
});

test('server says the rematch would pay: the card says so', () => {
  const capped = {
    xp: 70000,
    coins: 5000,
    claims: 1,
    earnedRules: 1,
    capReached: true,
    possible: { xp: 0, coins: 0 }
  };
  const bounty = rule('e1', 70000, 5000, {
    verifier: 'numeric-quiz',
    earnedToday: { xp: 70000, coins: 5000, attempt: 1 }
  });
  assert.equal(
    getAppStatus(
      app({
        kind: 'quiz',
        rules: [bounty, rematch()],
        today: { ...capped, rematchOpen: true }
      })
    ).line,
    'You earned 70,000 XP + 5,000 Coins today · the daily rematch is still open'
  );
  assert.equal(
    getAppStatus(
      app({
        kind: 'quiz',
        rules: [rematch()],
        today: { possible: { xp: 0, coins: 0 }, rematchOpen: true }
      })
    ).line,
    'The daily rematch is open today'
  );
  assert.equal(
    getAppStatus(
      app({
        kind: 'quiz',
        rules: [bounty, rematch({ attemptsToday: 3 })],
        today: { ...capped, rematchOpen: false }
      })
    ).line,
    'You earned 70,000 XP + 5,000 Coins today · come back tomorrow'
  );
});

test('a zero-pay rematch as the only claim, rematch closed: done for today', () => {
  const s = getAppStatus(
    app({
      kind: 'quiz',
      rules: [
        rule('e1', 70000, 5000, { verifier: 'numeric-quiz', available: false }),
        rematch({ earnedToday: { xp: 0, coins: 0, attempt: 3 } })
      ],
      today: { claims: 1, possible: { xp: 0, coins: 0 } }
    })
  );
  assert.equal(s.line, 'Done for today · come back tomorrow');
});

test('a zero-pay solve with rewards still open keeps "Earn up to"', () => {
  const s = getAppStatus(
    app({
      rules: [
        rule('a', 3000, 300, { earnedToday: { xp: 0, coins: 0, attempt: 4 } }),
        rule('b', 8000, 800)
      ],
      today: { claims: 1, earnedRules: 1, possible: { xp: 8000, coins: 800 } }
    })
  );
  assert.equal(s.line, 'Earn up to 8,000 XP + 800 Coins today');
});
