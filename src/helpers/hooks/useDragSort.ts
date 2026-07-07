import React, { useEffect, useRef, useState } from 'react';

const SWAP_THROTTLE_MS = 80;
const TOUCH_DRAG_THRESHOLD_PX = 10;

// one drag can be active at a time app-wide; `group` scopes which items
// may swap with each other (e.g. choices of question 2 vs question 3)
let currentDrag: { group: string; id: number | string } | null = null;
let lastSwapTime = 0;
const groupRegistry = new Map<string, Map<number | string, HTMLElement>>();

function registerItem(group: string, id: number | string, el: HTMLElement) {
  if (!groupRegistry.has(group)) {
    groupRegistry.set(group, new Map());
  }
  groupRegistry.get(group)?.set(id, el);
}

function unregisterItem(group: string, id: number | string) {
  const items = groupRegistry.get(group);
  if (!items) return;
  items.delete(id);
  if (items.size === 0) {
    groupRegistry.delete(group);
  }
}

export default function useDragSort({
  group,
  id,
  onMove
}: {
  group: string;
  id: number | string;
  onMove: (arg: {
    sourceId: number | string;
    targetId: number | string;
  }) => void;
}) {
  const elementRef = useRef<HTMLElement | null>(null);
  const touchRef = useRef<{ x: number; y: number; active: boolean } | null>(
    null
  );
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const [isDragging, setIsDragging] = useState(false);

  // native listener because React attaches touchmove as passive,
  // which makes preventDefault (needed to stop scrolling) a no-op
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    function onTouchMove(event: TouchEvent) {
      const touchState = touchRef.current;
      if (
        !touchState ||
        !currentDrag ||
        currentDrag.group !== group ||
        currentDrag.id !== id
      ) {
        return;
      }
      const touch = event.touches[0];
      if (!touchState.active) {
        const moved = Math.hypot(
          touch.clientX - touchState.x,
          touch.clientY - touchState.y
        );
        if (moved < TOUCH_DRAG_THRESHOLD_PX) return;
        touchState.active = true;
        setIsDragging(true);
      }
      event.preventDefault();
      const items = groupRegistry.get(group);
      if (!items) return;
      for (const [otherId, otherEl] of items.entries()) {
        if (otherId === id) continue;
        const rect = otherEl.getBoundingClientRect();
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          swap(otherId);
          break;
        }
      }
    }

    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, id]);

  return {
    isDragging,
    dragProps: {
      ref: handleRef,
      draggable: true,
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd
    }
  };

  function handleRef(el: HTMLElement | null) {
    elementRef.current = el;
    if (el) {
      registerItem(group, id, el);
    } else {
      unregisterItem(group, id);
    }
  }

  function handleDragStart(event: React.DragEvent) {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    // Firefox will not start a drag unless data is set
    event.dataTransfer.setData('text/plain', String(id));
    currentDrag = { group, id };
    setIsDragging(true);
  }

  function handleDragOver(event: React.DragEvent) {
    if (!currentDrag || currentDrag.group !== group) return;
    event.preventDefault();
    event.stopPropagation();
    if (currentDrag.id !== id) {
      swap(id, currentDrag.id);
    }
  }

  function handleDragEnd() {
    currentDrag = null;
    setIsDragging(false);
  }

  function handleTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY, active: false };
    currentDrag = { group, id };
  }

  function handleTouchEnd() {
    if (currentDrag?.group === group && currentDrag.id === id) {
      currentDrag = null;
    }
    touchRef.current = null;
    setIsDragging(false);
  }

  function swap(targetId: number | string, sourceId?: number | string) {
    const now = Date.now();
    if (now - lastSwapTime < SWAP_THROTTLE_MS) return;
    lastSwapTime = now;
    onMoveRef.current({ sourceId: sourceId ?? id, targetId });
  }
}
