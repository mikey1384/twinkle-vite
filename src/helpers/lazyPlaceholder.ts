import { useEffect, useState } from 'react';

// Lazy list items (useLazyLoad) may stand in for their content with an empty
// box only when that box is the item's own measured height. An item with no
// measured height renders its content, so no guessed height is ever painted.
//
// The intersection observer reports only after the first paint. Until it has
// reported, and for a short settle time after that, an item measured on this
// mount keeps its content: items on screen at open do not blink to a blank
// box, and an off-screen item's stand-in is its height after its text has
// settled (RichText's clamp and "show more" measure over a few frames). A
// height measured on an earlier mount (the module-level height caches) may
// stand in from the first frame, as chat messages and profile cards do.

// Same as useLazyLoad's default hide delay for an item that leaves the view.
export const LAZY_STAND_IN_SETTLE_MS = 1000;

export function useLazyStandInReady(
  observerEntry: unknown,
  settleMs = LAZY_STAND_IN_SETTLE_MS
): boolean {
  const observed = Boolean(observerEntry);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!observed || ready) return;
    const timer = setTimeout(() => setReady(true), settleMs);
    return () => clearTimeout(timer);
  }, [observed, ready, settleMs]);
  return ready;
}

export function lazyContentShown({
  inView,
  isVisible,
  measuredHeight,
  standInReady,
  heightCachedAtMount
}: {
  inView: boolean;
  isVisible: boolean;
  measuredHeight?: number | null;
  standInReady: boolean;
  heightCachedAtMount?: number | null;
}): boolean {
  if (inView || isVisible) return true;
  if (!isMeasuredHeight(measuredHeight)) return true;
  return !standInReady && !isMeasuredHeight(heightCachedAtMount);
}

export function isMeasuredHeight(height?: number | null): height is number {
  return typeof height === 'number' && Number.isFinite(height) && height > 0;
}
