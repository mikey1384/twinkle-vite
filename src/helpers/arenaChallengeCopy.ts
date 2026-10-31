interface ChallengeScore {
  kind?: 'battle' | 'today';
  // Zero or Ciel helped with the shared run
  assisted?: boolean;
  // who helped, as the API names it: "with Zero", "with Ciel", "with Zero
  // and Ciel" or "with a companion" (Mikey 10-31)
  assistLabel?: string | null;
  raw?: number;
  max?: number;
  markingPending?: boolean;
}

export function isPerfectArenaScore(score?: ChallengeScore | null) {
  return Number.isFinite(score?.raw) && Number.isFinite(score?.max)
    && Number(score?.max) > 0 && score?.raw === score?.max
    && !score?.markingPending;
}

// A helped run names its companion instead of saying "assisted" (Mikey
// 10-31). An older API sends only the flag: "with a companion".
export function arenaAssistLabel(
  run?: { assisted?: boolean; assistLabel?: string | null } | null
) {
  if (run?.assistLabel) return run.assistLabel;
  return run?.assisted ? 'with a companion' : null;
}

// The member's own note on a helped win, e.g. "You had Zero's help on this
// one, so it shares as “with Zero” and stays off Boss Records."
export function arenaAssistNote(label: string) {
  const who = label.replace(/^with /, '');
  const help = who === 'a companion' ? 'help' : `${who}’s help`;
  return `You had ${help} on this one, so it shares as “${label}” and stays off Boss Records.`;
}

export function arenaChallengeHeadline(score?: ChallengeScore | null) {
  // the same words for every daily clear: nothing tells a first-try miss
  if (score?.kind === 'today') return 'cleared Today’s Challenge';
  const helped = arenaAssistLabel(score);
  if (helped) {
    return isPerfectArenaScore(score)
      ? `got a perfect score ${helped}. Can you match it?`
      : `took on a boss ${helped} and won. Can you do better?`;
  }
  return isPerfectArenaScore(score)
    ? 'got a perfect score! Can you match it?'
    : 'took on a boss and won. Can you do better?';
}
