import { useCallback, useEffect, useRef, useState } from 'react';

const TICK_MS = 80;
// Stop just short of each milestone so the bar only reaches it when the server
// says that step is really done.
const MILESTONE_HOLD = 0.8;

// Eases a progress bar toward server-reported milestones, the same motion the
// daily question loading bar uses: fast at first, slowing as it nears the
// mark, never moving backwards.
export default function useEasedProgress() {
  const [progress, setProgress] = useState(0);
  const currentRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const easeTo = useCallback((target: number, duration: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (target <= currentRef.current) return;

    const startValue = currentRef.current;
    const effectiveTarget = Math.max(
      startValue,
      Math.min(target, 100) - MILESTONE_HOLD
    );
    const startedAt = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const eased = 1 - Math.exp(-4 * (elapsed / duration));
      const nextValue = Math.min(
        effectiveTarget,
        startValue + (effectiveTarget - startValue) * eased
      );
      const displayValue = Math.round(nextValue * 10) / 10;
      if (displayValue > currentRef.current) {
        currentRef.current = displayValue;
        setProgress(displayValue);
      }
      if (elapsed >= duration * 1.5 || effectiveTarget - nextValue <= 0.05) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, TICK_MS);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    currentRef.current = 0;
    setProgress(0);
  }, []);

  return { progress, easeTo, reset };
}
