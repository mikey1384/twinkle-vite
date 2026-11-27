const EXAM_WAIT_MESSAGES: Record<string, string> = {
  ARENA_NEXT_PAPER_PENDING: 'A new paper is being prepared. You can review your previous results while you wait.',
  ARENA_MASTERY_MARKING_PENDING: 'Your previous Full Hard paper is still being marked. Its result is needed before the next mastery paper can start.',
  ARENA_PREREQUISITE_REQUIRED: 'Clear the prerequisite exam shown on this boss’s card first.'
};

export function arenaExamLimitMessage(error: any): string | null {
  const fallback = EXAM_WAIT_MESSAGES[error?.code];
  return fallback ? (typeof error?.message === 'string' && error.message ? error.message : fallback) : null;
}
