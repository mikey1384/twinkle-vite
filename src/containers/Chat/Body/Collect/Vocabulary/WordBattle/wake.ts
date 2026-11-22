// The gate's wake-up lines (index.tsx): what each stage says, how long it
// holds, and what comes next.
export type WakeStage = 'sleep' | 'stir' | 'peek' | 'yawn' | 'wake' | 'awake';
export const STAGE_ORDER: WakeStage[] = ['sleep', 'stir', 'peek', 'yawn', 'wake', 'awake'];
// The jolt of the eyes opening, before the awake idle pose.
export const WAKE_JOLT_MS = 480;

// About 200 ms a word on top of a base, never under 1.6 s or over 2 s.
export function readingMs(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(2000, Math.max(1600, 900 + 200 * words));
}

export function wakeLine(stage: WakeStage, word: string) {
  switch (stage) {
    case 'sleep':
      return 'Shh... a wild word is dozing.';
    case 'stir':
      return 'Something stirs...';
    case 'peek':
      return 'One eye cracks open...';
    case 'yawn':
      return '*Yaaawn*';
    default:
      return `A wild ${word.toUpperCase()} appears!`;
  }
}

// The stage after this one; null when there is none yet. Before the battle
// is ready, a cracked eye goes back to stirring instead of yawning.
export function nextWakeStage(stage: WakeStage, ready: boolean): WakeStage | null {
  if (stage === 'awake') return null;
  if (!ready && stage === 'peek') return 'stir';
  return STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1];
}
