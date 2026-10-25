interface ChallengeScore {
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
  return isPerfectArenaScore(score)
    ? 'got a perfect score! Can you match it?'
    : 'took on a boss and won. Can you do better?';
}
