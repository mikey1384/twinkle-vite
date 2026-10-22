const MIN_BOUNTY_RUN_TO_STACK = 2;

function getBountyStackKey(feed: { [key: string]: any } = {}) {
  // Recommendations promote the individual story, even beside another
  // bounty from the same person. Use the canonical feed recommendation count.
  if (Number(feed?.totalRecommendations) > 0) return '';
  const uploaderId = Number(feed?.uploaderId || 0);
  return feed?.contentType === 'bounty' && feed?.contentId && uploaderId > 0
    ? `bounty-${uploaderId}`
    : '';
}

/* Consecutive automatic bounty cards from one person collapse into a stack.
   Feed state, paging and anchors stay intact; recommended stories stand alone. */
export function getBountyStacks(feeds: any[] = []) {
  const stacks = new Map<number, { size: number; headKey: string }>();
  const hidden = new Map<number, string>();
  let runStart = 0;
  while (runStart < feeds.length) {
    const key = getBountyStackKey(feeds[runStart]);
    let runEnd = runStart + 1;
    if (key) {
      while (
        runEnd < feeds.length &&
        getBountyStackKey(feeds[runEnd]) === key
      ) {
        runEnd++;
      }
      const size = runEnd - runStart;
      if (size >= MIN_BOUNTY_RUN_TO_STACK) {
        const headKey = `${key}-${feeds[runStart].feedId || feeds[runStart].contentId}`;
        stacks.set(runStart, { size, headKey });
        for (let i = runStart + 1; i < runEnd; i++) hidden.set(i, headKey);
      }
    }
    runStart = runEnd;
  }
  return { stacks, hidden };
}
