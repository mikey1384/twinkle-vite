const RESULT_FIELDS = [
  'arenaResultObservedAt',
  'raw',
  'max',
  'hunterRank',
  'xpEarned',
  'coinsEarned',
  'scoreBonusXpEarned',
  'scoreBonusCoinsEarned',
  'rewardPending',
  'rewardStatus',
  'markingPending',
  'takers',
  'bestTaker',
  'assisted',
  'assistLabel'
] as const;

// Both inputs came from the server. A fresh feed can arrive while the
// hydrated content cache still holds the score from before essay settlement.
// Use the newer writer snapshot; never estimate a reward or take the larger
// amount (a later correction can also lower it).
export function latestArenaResult(loaded: any, preview: any) {
  if ((loaded?.contentType || preview?.contentType) !== 'arenaChallenge') {
    return {};
  }
  const source =
    Number(preview?.arenaResultObservedAt || 0) >
    Number(loaded?.arenaResultObservedAt || 0)
      ? preview
      : loaded;
  return Object.fromEntries(
    RESULT_FIELDS.filter((field) => source?.[field] !== undefined
      || ((field.startsWith('scoreBonus') || field === 'rewardStatus') && loaded?.[field] !== undefined)).map(
      (field) => [field, source?.[field]]
    )
  );
}
