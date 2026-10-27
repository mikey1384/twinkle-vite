export function arenaExamLimitMessage(error: any): string | null {
  if (error?.code === 'ARENA_EXAM_COOLDOWN') {
    return typeof error.message === 'string' ? error.message
      : 'You cleared this exam. Its lengths and difficulties unlock seven site days after your clear. Your result and review are still available.';
  }
  if (error?.code !== 'ARENA_DAILY_EXAM_LIMIT') return null;
  return 'You have already started today’s exam. You can resume it or review your results. Your next exam is available at 9:00 AM Korea time (00:00 UTC).';
}
