import React, { useRef, useState, useEffect, useCallback } from 'react';
import Icon from '~/components/Icon';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function SortableListGroup<T extends number | string = number>({
  listItemObj,
  listItemLabel = 'label',
  onMove,
  itemIds,
  numbered,
  style
}: {
  listItemObj: any;
  listItemLabel?: string;
  onMove: (arg0: { sourceId: T; targetId: T }) => void;
  itemIds: T[];
  listItemType?: string;
  numbered?: boolean;
  style?: React.CSSProperties;
}) {
  const [draggedId, setDraggedId] = useState<T | null>(null);
  const draggedIdRef = useRef<T | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<T, HTMLElement>>(new Map());
  const touchStartY = useRef<number>(0);
  const isDragging = useRef(false);
  const lastSwapTime = useRef<number>(0);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const handleSwap = useCallback((sourceId: T, targetId: T) => {
    if (sourceId === targetId) return;

    // Throttle swaps to prevent jitter (min 80ms between swaps)
    const now = Date.now();
    if (now - lastSwapTime.current < 80) return;
    lastSwapTime.current = now;

    onMoveRef.current({ sourceId, targetId });
  }, []);

  function handleDragStart(e: React.DragEvent, id: T) {
    setDraggedId(id);
    draggedIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));
  }

  function handleDragOver(e: React.DragEvent, id: T) {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      handleSwap(draggedId, id);
    }
  }

  function handleDragEnd() {
    setDraggedId(null);
    draggedIdRef.current = null;
  }

  function handleTouchStart(e: React.TouchEvent, id: T) {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
    setDraggedId(id);
    draggedIdRef.current = id;
  }

  function handleTouchEnd() {
    setDraggedId(null);
    draggedIdRef.current = null;
    isDragging.current = false;
  }

  // Use native event listener with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onTouchMove(e: TouchEvent) {
      const currentDraggedId = draggedIdRef.current;
      if (!currentDraggedId) return;

      const touch = e.touches[0];
      const deltaY = Math.abs(touch.clientY - touchStartY.current);

      if (deltaY > 10) {
        isDragging.current = true;
      }

      if (!isDragging.current) return;

      e.preventDefault();

      // Find which item we're over
      for (const [id, element] of itemRefs.current.entries()) {
        if (id === currentDraggedId) continue;
        const rect = element.getBoundingClientRect();
        if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          handleSwap(currentDraggedId, id);
          break;
        }
      }
    }

    container.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      container.removeEventListener('touchmove', onTouchMove);
    };
  }, [handleSwap]);

  return (
    <div
      ref={containerRef}
      style={style}
      className={css`
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        padding: 0.2rem 0.1rem;
        @media (max-width: ${mobileMaxWidth}) {
          gap: 0.7rem;
        }
      `}
    >
      {itemIds.map((id, index) => {
        const label =
          listItemObj[id]?.[listItemLabel] ?? listItemObj[id]?.label ?? id;
        const isBeingDragged = draggedId === id;

        return (
          <div
            key={id}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(id, el);
              } else {
                itemRefs.current.delete(id);
              }
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, id)}
            onDragOver={(e) => handleDragOver(e, id)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, id)}
            onTouchEnd={handleTouchEnd}
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1.5rem;
              padding: 1.2rem 1.5rem;
              border-radius: ${borderRadius};
              border: 1px solid
                ${isBeingDragged ? Color.logoBlue(0.5) : 'var(--ui-border)'};
              background: ${isBeingDragged
                ? Color.whiteBlueGray(0.95)
                : '#fff'};
              opacity: ${isBeingDragged ? 0.8 : 1};
              transform: ${isBeingDragged ? 'scale(1.02)' : 'scale(1)'};
              transition: all 150ms ease;
              cursor: grab;
              touch-action: none;
              user-select: none;
              box-shadow: ${isBeingDragged
                ? '0 8px 20px -4px rgba(15, 23, 42, 0.25)'
                : '0 2px 8px -4px rgba(15, 23, 42, 0.15)'};
              @media (max-width: ${mobileMaxWidth}) {
                padding: 1.1rem 1.3rem;
              }
              &:active {
                cursor: grabbing;
              }
            `}
          >
            <section
              className={css`
                display: flex;
                align-items: center;
                gap: 0.9rem;
                color: ${Color.darkerGray()};
                font-weight: 600;
                font-size: 1.6rem;
                line-height: 1.4;
                word-break: break-word;
              `}
            >
              {numbered && (
                <span
                  className={css`
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 2.2rem;
                    height: 2.2rem;
                    border-radius: 999px;
                    background: ${Color.highlightGray()};
                    color: ${Color.darkGray()};
                    font-size: 1.1rem;
                    font-weight: 700;
                  `}
                >
                  {index + 1}
                </span>
              )}
              <span>{label}</span>
            </section>
            <div
              className={css`
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem 0.6rem;
                border-radius: 999px;
                background: ${Color.highlightGray()};
                border: 1px solid ${Color.borderGray(0.7)};
                color: ${Color.darkGray()};
              `}
            >
              <Icon icon="grip-lines" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
