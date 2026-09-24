import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import {
  getAiEnergyDisplay,
  type AiEnergyDisplayPolicy
} from '~/helpers/aiEnergyDisplay';
import { useNotiContext } from '~/contexts';

// The floating Zero/Ciel window's shared parts: dragging it by its picture,
// and the AI Energy battery. The call window and the chat window (the same
// window when there is no call) are built from these.

// Movement that makes a press a drag rather than a tap.
const DRAG_THRESHOLD_PX = 6;

// The click that ends a drag is not a tap on whatever was under the finger.
function swallowNextClick() {
  function swallow(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
  }
  window.addEventListener('click', swallow, { capture: true, once: true });
  window.setTimeout(
    () => window.removeEventListener('click', swallow, { capture: true }),
    400
  );
}

interface AiUsagePolicy extends AiEnergyDisplayPolicy {
  energyPercent?: number;
  energySegments?: number;
}

export function useDraggableWindow(initialPosition: { x: number; y: number }) {
  const [position, setPosition] = useState(initialPosition);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  const stopDragging = useRef<(() => void) | null>(null);

  // Always reachable: at least the picture stays on screen.
  function clamp(next: { x: number; y: number }) {
    const box = windowRef.current?.getBoundingClientRect();
    const width = box?.width || 0;
    const height = box?.height || 0;
    return {
      x: Math.min(Math.max(0, next.x), Math.max(0, window.innerWidth - width)),
      y: Math.min(
        Math.max(0, next.y),
        Math.max(0, window.innerHeight - Math.min(height, 96))
      )
    };
  }

  // The handle (.draggable-area; the chat window's whole top bar) moves the
  // window, the same for a mouse and a finger. A press
  // that moves a few pixels is a drag, and the tap it would end in (like
  // the bar's expand toggle) is swallowed; one that doesn't is an ordinary
  // tap. Buttons marked data-no-drag are never handles.
  function handleStart(e: React.PointerEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.draggable-area')) return;
    if (target.closest('[data-no-drag]')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stopDragging.current?.();
    const rect = windowRef.current?.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - (rect?.left || 0),
      y: e.clientY - (rect?.top || 0)
    };
    const start = { x: e.clientX, y: e.clientY };
    const pointerId = e.pointerId;
    // The window claims this pointer: every move and the release come
    // straight here, whatever is under the finger or mouse. Listening on the
    // page instead lost them over anything that keeps its own events (a
    // modal like Wordle stops pointer moves, an app's iframe takes them), so
    // dragging worked only some of the time.
    const handle = e.currentTarget as HTMLElement;
    try {
      handle.setPointerCapture(pointerId);
    } catch {
      /* The pointer may already be gone; the drag then just doesn't start. */
    }
    let dragging = false;
    function handleMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      if (
        !dragging &&
        Math.hypot(event.clientX - start.x, event.clientY - start.y) <
          DRAG_THRESHOLD_PX
      ) {
        return;
      }
      dragging = true;
      event.preventDefault();
      setPosition(
        clamp({
          x: event.clientX - dragOffset.current.x,
          y: event.clientY - dragOffset.current.y
        })
      );
    }
    function handleEnd(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      if (dragging) swallowNextClick();
      stopDragging.current?.();
    }
    handle.addEventListener('pointermove', handleMove, { passive: false });
    handle.addEventListener('pointerup', handleEnd);
    handle.addEventListener('pointercancel', handleEnd);
    handle.addEventListener('lostpointercapture', handleEnd);
    stopDragging.current = () => {
      handle.removeEventListener('pointermove', handleMove);
      handle.removeEventListener('pointerup', handleEnd);
      handle.removeEventListener('pointercancel', handleEnd);
      handle.removeEventListener('lostpointercapture', handleEnd);
      try {
        if (handle.hasPointerCapture(pointerId)) {
          handle.releasePointerCapture(pointerId);
        }
      } catch {
        /* Already released. */
      }
      stopDragging.current = null;
    };
  }

  useEffect(() => {
    function handleResize() {
      setPosition((current) => clamp(current));
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      stopDragging.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { position, windowRef, handleStart };
}

export function EnergyBattery({
  width = 20,
  margin = '1rem 0.5rem'
}: {
  width?: number;
  margin?: string;
}) {
  const aiUsagePolicy = useNotiContext(
    (v) => v.state.todayStats?.aiUsagePolicy
  ) as AiUsagePolicy | null;
  const energyDisplay = getAiEnergyDisplay(aiUsagePolicy);
  const batteryLevel = energyDisplay.percent ?? 0;
  const energySegments = useMemo(
    () => Math.max(1, aiUsagePolicy?.energySegments || 5),
    [aiUsagePolicy?.energySegments]
  );
  const visualSegmentFill = (batteryLevel / 100) * energySegments;

  return (
    <div
      aria-label={`AI Energy ${energyDisplay.label}`}
      className={css`
        width: ${width}px;
        margin: ${margin};
        background-color: #e0e0e0;
        border-radius: 10px;
        padding: 3px;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        gap: 3px;
        flex-shrink: 0;
      `}
    >
      {Array.from({ length: energySegments }).map((_, index) => {
        const fillRatio = Math.max(
          0,
          Math.min(1, visualSegmentFill - (energySegments - index - 1))
        );
        return (
          <span
            key={index}
            className={css`
              position: relative;
              width: 100%;
              flex: 1;
              overflow: hidden;
              border-radius: 6px;
              background-color: rgba(255, 255, 255, 0.65);
            `}
          >
            {fillRatio > 0 && (
              <span
                className={css`
                  position: absolute;
                  right: 0;
                  bottom: 0;
                  left: 0;
                  height: ${fillRatio * 100}%;
                  border-radius: inherit;
                  background-color: #4caf50;
                  transition: height 0.3s ease-in-out;
                `}
              />
            )}
          </span>
        );
      })}
      <div
        className={css`
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(90deg);
          white-space: nowrap;
          color: ${batteryLevel < 30 ? '#333' : '#fff'};
          font-weight: 600;
          font-size: 1.1rem;
          width: 80px;
          text-align: center;
        `}
      >
        {energyDisplay.label}
      </div>
    </div>
  );
}
