import React, { useRef } from 'react';

const LONGPRESS_MS = 450;
const MOVE_CANCEL_PX = 10;

// Wraps a mobile bottom-nav item so a touch long-press (finger held still)
// fires onLongPress with the item's rect, while a tap still navigates and a
// horizontal swipe still scrolls the strip. Same disambiguation the desktop
// tab strip uses.
export default function MobileLongPressNav({
  onLongPress,
  children
}: {
  onLongPress: (rect: DOMRect) => void;
  children: React.ReactNode;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<null | (() => void)>(null);
  const didLongPressRef = useRef(false);

  function clear() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    cleanupRef.current?.();
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch') return;
    didLongPressRef.current = false;
    clear();
    const startX = event.clientX;
    const startY = event.clientY;
    const el = event.currentTarget;
    function onMove(e: PointerEvent) {
      if (
        Math.abs(e.clientX - startX) > MOVE_CANCEL_PX ||
        Math.abs(e.clientY - startY) > MOVE_CANCEL_PX
      ) {
        clear(); // a real move = scroll/tap, not a long-press
      }
    }
    function onEnd() {
      clear();
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    cleanupRef.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      cleanupRef.current = null;
    };
    timerRef.current = setTimeout(() => {
      didLongPressRef.current = true; // suppress the tap-nav on lift
      onLongPress(el.getBoundingClientRect());
      clear();
    }, LONGPRESS_MS);
  }

  function handleClickCapture(event: React.MouseEvent) {
    if (!didLongPressRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onClickCapture={handleClickCapture}
      style={{
        display: 'flex',
        alignItems: 'center',
        WebkitTouchCallout: 'none'
      }}
    >
      {children}
    </div>
  );
}
