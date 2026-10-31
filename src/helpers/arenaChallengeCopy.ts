interface ChallengeScore {
  kind?: 'battle' | 'today';
  // Zero or Ciel helped with the shared run
  assisted?: boolean;
  raw?: number;
  max?: number;
  markingPending?: boolean;
}

export function isPerfectArenaScore(score?: ChallengeScore | null) {
  return Number.isFinite(score?.raw) && Number.isFinite(score?.max)
    && Number(score?.max) > 0 && score?.raw === score?.max
    && !score?.markingPending;
}

export function arenaChallengeHeadline(score?: ChallengeScore | null) {
  // the same words for every daily clear: nothing tells a first-try miss
  if (score?.kind === 'today') return 'cleared Today’s Challenge';
  if (score?.assisted) {
    return isPerfectArenaScore(score)
      ? 'got a perfect score with help (assisted). Can you match it?'
      : 'took on a boss with help and won (assisted). Can you do better?';
  }
  return isPerfectArenaScore(score)
    ? 'got a perfect score! Can you match it?'
    : 'took on a boss and won. Can you do better?';
}
