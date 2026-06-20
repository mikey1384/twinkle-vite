import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Native HTML5 drag-and-drop does not fire on touch devices, so this hook
// reimplements "drag the thumbnail into the textarea" with pointer events:
// it tracks a touch from the thumbnail, renders a floating ghost that follows
// the finger, and on release hit-tests the element under the finger to decide
// whether it landed on a valid drop target (e.g., a textarea). Mouse drags are
// intentionally left to the browser's native DnD (handled elsewhere), so this
// only engages for `pointerType === 'touch'`.
const DRAG_THRESHOLD = 10;

export default function useImageThumbnailTouchDrag({
  enabled,
  previewUrl,
  isValidDropTarget,
  onDragStart,
  onDrop,
  onCancel
}: {
  enabled: boolean;
  previewUrl?: string;
  isValidDropTarget: (el: Element | null) => boolean;
  onDragStart?: () => void;
  onDrop: () => void;
  onCancel?: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const thumbHandlers = enabled
    ? {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerCancel
      }
    : {};

  const ghost =
    isDragging && ghostPos && previewUrl
      ? createPortal(
          <div
            style={{
              position: 'fixed',
              left: ghostPos.x,
              top: ghostPos.y,
              transform: 'translate(-50%, -50%)',
              width: '8rem',
              height: '8rem',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              opacity: 0.9,
              pointerEvents: 'none',
              zIndex: 99999,
              background: '#000'
            }}
          >
            <img
              src={previewUrl}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>,
          document.body
        )
      : null;

  return { thumbHandlers, ghost, isDragging };

  function reset() {
    draggingRef.current = false;
    startRef.current = null;
    pointerIdRef.current = null;
    setIsDragging(false);
    setGhostPos(null);
  }

  function handlePointerDown(event: React.PointerEvent) {
    if (!enabled || event.pointerType !== 'touch') return;
    // Don't start a drag from interactive controls (e.g., the remove button).
    if ((event.target as HTMLElement)?.closest?.('[data-attachment-no-drag]')) {
      return;
    }
    startRef.current = { x: event.clientX, y: event.clientY };
    pointerIdRef.current = event.pointerId;
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!enabled || event.pointerType !== 'touch') return;
    if (pointerIdRef.current !== event.pointerId || !startRef.current) return;
    if (!draggingRef.current) {
      const dx = event.clientX - startRef.current.x;
      const dy = event.clientY - startRef.current.y;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      draggingRef.current = true;
      setIsDragging(true);
      onDragStart?.();
      try {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      } catch {
        // setPointerCapture can throw if the pointer is already released.
      }
    }
    // Prevent the page from scrolling while a drag is in progress.
    event.preventDefault();
    setGhostPos({ x: event.clientX, y: event.clientY });
  }

  function handlePointerUp(event: React.PointerEvent) {
    if (pointerIdRef.current !== event.pointerId) return;
    if (!draggingRef.current) {
      reset();
      return;
    }
    const { clientX, clientY } = event;
    // Hide the ghost before hit-testing so it can't intercept the point.
    setGhostPos(null);
    const target =
      typeof document !== 'undefined'
        ? document.elementFromPoint(clientX, clientY)
        : null;
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(
        event.pointerId
      );
    } catch {
      // ignore
    }
    if (isValidDropTarget(target)) {
      onDrop();
    } else {
      onCancel?.();
    }
    reset();
  }

  function handlePointerCancel(event: React.PointerEvent) {
    if (pointerIdRef.current !== event.pointerId) return;
    if (draggingRef.current) onCancel?.();
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(
        event.pointerId
      );
    } catch {
      // ignore
    }
    reset();
  }
}
