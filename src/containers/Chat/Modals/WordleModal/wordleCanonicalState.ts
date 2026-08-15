interface CanonicalWordleState {
  dailyTaskStatus: Record<string, any>;
  wordleAttemptState: Record<string, any>;
  wordleGuesses: string[];
  wordleSolution: string;
  wordleWordLevel: number;
  wordleStats: Record<string, any>;
  nextDayTimeStamp: number;
  needsReload: boolean;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeCanonicalWordleState(
  value: unknown
): CanonicalWordleState | null {
  if (!isRecord(value)) return null;
  if (
    !Array.isArray(value.wordleGuesses) ||
    value.wordleGuesses.some((guess: unknown) => typeof guess !== 'string') ||
    typeof value.wordleSolution !== 'string' ||
    !value.wordleSolution ||
    !Number.isInteger(value.wordleWordLevel) ||
    value.wordleWordLevel <= 0 ||
    !isRecord(value.wordleAttemptState) ||
    !isRecord(value.wordleStats) ||
    !isRecord(value.dailyTaskStatus) ||
    !Number.isFinite(value.nextDayTimeStamp) ||
    value.nextDayTimeStamp <= 0
  ) {
    return null;
  }

  return {
    dailyTaskStatus: value.dailyTaskStatus,
    wordleAttemptState: value.wordleAttemptState,
    wordleGuesses: [...value.wordleGuesses],
    wordleSolution: value.wordleSolution,
    wordleWordLevel: value.wordleWordLevel,
    wordleStats: value.wordleStats,
    nextDayTimeStamp: value.nextDayTimeStamp,
    needsReload: value.needsReload === true
  };
}

export async function fetchCanonicalWordleState({
  channelId,
  loadWordle
}: {
  channelId: number;
  loadWordle: (channelId: number) => Promise<unknown>;
}) {
  const canonicalState = normalizeCanonicalWordleState(
    await loadWordle(channelId)
  );
  if (!canonicalState) {
    throw new Error('Wordle returned an invalid canonical state');
  }
  return canonicalState;
}
