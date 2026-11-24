import type { LuminePose } from './pixelScene';

// What Lumine is up to, from the run's own structured signals (no reading of
// the message text): reasoning events carry `details.thoughtContent`, a queued
// run carries `queue`, and file writes arrive as streamed project files.
export interface LumineRunActivity {
  thinking: boolean;
  queued: boolean;
  // The latest step line the chat shows (already plain language), if any.
  label: string | null;
  terminalState: 'complete' | 'error' | 'stopped' | null;
}

export type LumineWorkMode = 'writing' | 'thinking' | 'working' | 'queued' | 'idle';

interface RunEventLike {
  kind?: string | null;
  message?: string | null;
  details?: Record<string, any> | null;
}

export function resolveLumineRunActivity({
  runEvents,
  queue,
  assistantStatusSteps,
  terminalState
}: {
  runEvents: RunEventLike[];
  queue: unknown;
  assistantStatusSteps: string[];
  terminalState?: 'complete' | 'error' | 'stopped' | null;
}): LumineRunActivity {
  let thinking = false;
  let sawLatest = false;
  let label: string | null = null;
  for (let index = runEvents.length - 1; index >= 0; index -= 1) {
    const event = runEvents[index];
    if (!event || event.kind === 'usage' || event.kind === 'lifecycle') continue;
    const isThought = Boolean(
      event.details &&
        Object.prototype.hasOwnProperty.call(event.details, 'thoughtContent')
    );
    if (!sawLatest) {
      sawLatest = true;
      thinking = isThought && !event.details?.isComplete;
    }
    if (isThought) continue;
    const message = String(event.message || '').trim();
    if (
      message &&
      (event.kind === 'action' || event.kind === 'status' || event.kind === 'phase')
    ) {
      label = message;
      break;
    }
  }
  if (!label && assistantStatusSteps.length > 0) {
    label =
      String(assistantStatusSteps[assistantStatusSteps.length - 1] || '').trim() ||
      null;
  }
  return {
    thinking,
    queued: Boolean(queue),
    label,
    terminalState: terminalState ?? null
  };
}

export function resolveLumineWorkMode({
  running,
  activity,
  writingRecently
}: {
  running: boolean;
  activity: LumineRunActivity | null;
  writingRecently: boolean;
}): LumineWorkMode {
  if (!running) return 'idle';
  if (activity?.queued) return 'queued';
  if (writingRecently) return 'writing';
  if (activity?.thinking) return 'thinking';
  return 'working';
}

// How long each pose plays (in 100 ms ticks) and how likely it is in each
// mode. Typing dominates while files are being written; thinking poses while
// Lumine reasons; a mix otherwise so a long run never loops the same beat.
export const POSE_TICKS: Record<LuminePose, [number, number]> = {
  type: [50, 80],
  burst: [26, 40],
  think: [40, 40],
  sip: [40, 40],
  stretch: [32, 32],
  glance: [30, 36],
  celebrate: [26, 26],
  wave: [30, 30],
  rest: [40, 60],
  slam: [36, 48],
  flow: [42, 60]
};

const WEIGHTS: Record<LumineWorkMode, Partial<Record<LuminePose, number>>> = {
  writing: { type: 4, burst: 3, slam: 2.5, flow: 2.5, glance: 1, sip: 0.5 },
  thinking: { think: 5, glance: 2, sip: 2, type: 1, stretch: 1 },
  working: { type: 2, burst: 2, slam: 1.5, flow: 1.5, think: 2, glance: 2, sip: 1.5, stretch: 1 },
  queued: { sip: 3, stretch: 2, think: 2, rest: 1, glance: 1 },
  idle: { rest: 3, wave: 2, sip: 1, stretch: 1 }
};

// Pick the next pose. `roll` and `lengthRoll` are 0..1 (Math.random in the
// app, fixed in tests). A pose never repeats back to back, and a light-bulb
// moment (think) is followed by a burst of typing while Lumine is working.
export function nextLuminePose({
  mode,
  previous,
  roll,
  lengthRoll
}: {
  mode: LumineWorkMode;
  previous: LuminePose | null;
  roll: number;
  lengthRoll: number;
}): { pose: LuminePose; ticks: number } {
  let pose: LuminePose | null = null;
  if (previous === 'think' && (mode === 'working' || mode === 'writing')) {
    pose = 'burst';
  } else {
    const entries = Object.entries(WEIGHTS[mode]).filter(
      ([candidate]) => candidate !== previous
    ) as Array<[LuminePose, number]>;
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let target = roll * total;
    for (const [candidate, weight] of entries) {
      target -= weight;
      if (target <= 0) {
        pose = candidate;
        break;
      }
    }
    pose = pose || entries[entries.length - 1][0];
  }
  const [low, high] = POSE_TICKS[pose];
  return { pose, ticks: Math.round(low + (high - low) * lengthRoll) };
}

// The words under the scene: short, plain, and only what matters now.
export function describeLumineWork({
  mode,
  lingering,
  label,
  focusFilePath,
  isOwner
}: {
  mode: LumineWorkMode;
  lingering: boolean;
  label: string | null;
  focusFilePath: string | null;
  isOwner: boolean;
}): { title: string; subtitle: string | null } {
  if (lingering) {
    return { title: 'All saved!', subtitle: 'Opening your app...' };
  }
  const fileName = focusFilePath
    ? focusFilePath.split('/').filter(Boolean).pop() || null
    : null;
  switch (mode) {
    case 'writing':
      return {
        title: 'Lumine is writing code',
        subtitle: fileName ? `Working on ${fileName}` : label
      };
    case 'thinking':
      return { title: 'Lumine is thinking', subtitle: label };
    case 'working':
      return { title: 'Lumine is building', subtitle: label };
    case 'queued':
      return {
        title: 'Lumine will start soon',
        subtitle: 'Waiting for a free spot'
      };
    case 'idle':
    default:
      return {
        title: 'Nothing to preview yet',
        subtitle: isOwner
          ? 'Tell Lumine what to build in the chat'
          : 'This build has no code yet'
      };
  }
}
