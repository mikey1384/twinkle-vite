import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

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
  heightCachedAtMount,
  held = false
}: {
  inView: boolean;
  isVisible: boolean;
  measuredHeight?: number | null;
  standInReady: boolean;
  heightCachedAtMount?: number | null;
  // A window opened from the item is up (useLazyContentHold).
  held?: boolean;
}): boolean {
  if (held || inView || isVisible) return true;
  if (!isMeasuredHeight(measuredHeight)) return true;
  return !standInReady && !isMeasuredHeight(heightCachedAtMount);
}

export function isMeasuredHeight(height?: number | null): height is number {
  return typeof height === 'number' && Number.isFinite(height) && height > 0;
}

// A lazy list item never trades its content for a stand-in while a window
// opened from inside it is up. Modals are portaled out of the item, but they
// still belong to it: when the item's content unmounts, they close with it.
// On 11-24 a word battle opened from a Word Master card closed by itself when
// a new member's card arrived and pushed that card off screen (Mikey: "i was
// doing word battle and suddenly this appeared and the modal turned off").
// The item provides the hold; every Modal inside it holds it while open.
export interface LazyContentHold {
  acquire: () => () => void;
}

export const LazyContentHoldContext = createContext<LazyContentHold | null>(
  null
);

export function createLazyContentHold(onChange: (held: boolean) => void) {
  let count = 0;
  return {
    acquire() {
      count += 1;
      if (count === 1) onChange(true);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        count -= 1;
        if (count === 0) onChange(false);
      };
    }
  };
}

// For the lazy item: whether something inside holds it, and the value for
// LazyContentHoldContext.Provider around its content.
export function useLazyContentHold(): [boolean, LazyContentHold] {
  const [held, setHeld] = useState(false);
  const handleChange = useCallback((next: boolean) => setHeld(next), []);
  const hold = useMemo(
    () => createLazyContentHold(handleChange),
    [handleChange]
  );
  return [held, hold];
}

// For a window (Modal): holds the nearest lazy item while `active`.
export function useHoldLazyContent(active: boolean) {
  const hold = useContext(LazyContentHoldContext);
  useEffect(() => {
    if (!active || !hold) return;
    return hold.acquire();
  }, [active, hold]);
}
