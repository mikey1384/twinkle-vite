import type { BuildRunQueue } from '../types';

// The queue card's two lines. Counts only.
export function describeBuildRunQueue(queue: BuildRunQueue) {
  const eta = queue.etaMinutes
    ? `about ${queue.etaMinutes.low}–${queue.etaMinutes.high} min`
    : '';
  if (queue.position <= 1) {
    const finishing =
      queue.ahead <= 1
        ? 'Another build is finishing'
        : 'Other builds are finishing';
    return {
      headline: "You're next in line",
      detail: eta ? `${finishing} · ${eta}` : finishing
    };
  }
  const opens = 'Lumine starts yours when a spot opens';
  return {
    headline: `${queue.ahead} builds ahead of you`,
    detail: eta ? `${opens} · ${eta}` : opens
  };
}
