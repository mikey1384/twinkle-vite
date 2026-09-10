import { useRef, type FocusEvent } from 'react';

// Safari on macOS and iOS never moves focus to a button when it is clicked or
// tapped. When a popover has focused one of its own elements (the reaction
// picker focuses its heading after a page change, the action menu focuses an
// option on keyboard open), pressing another control inside the popover blurs
// that element with relatedTarget = null, which is indistinguishable from focus
// leaving the popover. Chrome and Firefox focus the pressed button, so the same
// blur carries an inside relatedTarget. Remember a press that started inside so
// blur-to-dismiss ignores it; the outside-click hook still closes on real
// outside presses, and keyboard focus loss still dismisses.
export default function usePointerBlurGuard() {
  const pressedInsideRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function release() {
    pressedInsideRef.current = false;
    clearTimeout(timerRef.current);
  }
  function press() {
    pressedInsideRef.current = true;
    clearTimeout(timerRef.current);
    // A press that never produces a click (touch scroll, drag out, cancelled
    // gesture) must not pin the popover open against a later real focus loss.
    timerRef.current = setTimeout(release, 1500);
  }
  return {
    isPressedInside: () => pressedInsideRef.current,
    guardProps: {
      onPointerDownCapture: press,
      onTouchStartCapture: press,
      onPointerCancelCapture: release,
      onClickCapture: release
    }
  };
}

export function focusLeft(
  event: FocusEvent<HTMLElement>,
  isPressedInside: () => boolean
) {
  if (event.currentTarget.contains(event.relatedTarget as Node | null)) return false;
  return !isPressedInside();
}
