import React, { useEffect, useRef, useState } from 'react';
import Nav from './Nav';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { APP_SHELL_HEADER_OFFSET_FALLBACK } from '~/constants/appShell';
import type { NavTabKey } from '~/helpers/navTabOrder';

export interface NavTabDescriptor {
  key: NavTabKey;
  to: string;
  imgLabel: string;
  label: React.ReactNode;
  alert?: boolean;
  isHome?: boolean;
  isUsingChat?: boolean;
  profileUsername?: string;
}

interface DragState {
  key: NavTabKey;
  fromIndex: number;
  toIndex: number;
  dx: number;
  settling: boolean;
}

const DRAG_THRESHOLD_PX = 5;
const SETTLE_MS = 160;

const stripClass = css`
  height: ${APP_SHELL_HEADER_OFFSET_FALLBACK};
  display: flex;
  align-items: flex-end;
`;

const tabItemClass = css`
  position: relative;
  display: flex;
  align-items: flex-end;
  height: 100%;
  & + &::before {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0.8rem;
    width: 1px;
    height: 1.8rem;
    background: ${Color.borderGray()};
  }
`;

export default function TabStrip({
  tabs,
  onMove
}: {
  tabs: NavTabDescriptor[];
  onMove: (arg: { sourceKey: NavTabKey; targetKey: NavTabKey }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingRef = useRef<{
    key: NavTabKey;
    index: number;
    startX: number;
  } | null>(null);
  const rectsRef = useRef<{ left: number; width: number; center: number }[]>(
    []
  );
  const boundsRef = useRef<{ minDX: number; maxDX: number }>({
    minDX: 0,
    maxDX: 0
  });
  const didDragRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-nav-tab-strip="true"
      className={`desktop ${stripClass}`}
    >
      {tabs.map((tab, index) => (
        <div
          key={tab.key}
          className={tabItemClass}
          style={getTabStyle(index, tab.key)}
          onPointerDown={(event) => handlePointerDown(event, tab.key, index)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClickCapture={handleClickCapture}
        >
          <Nav
            variant="tab"
            className="desktop"
            to={tab.to}
            imgLabel={tab.imgLabel}
            alert={tab.alert}
            isHome={tab.isHome}
            isUsingChat={tab.isUsingChat}
            profileUsername={tab.profileUsername}
          >
            {tab.label}
          </Nav>
        </div>
      ))}
    </div>
  );

  function getTabStyle(
    index: number,
    key: NavTabKey
  ): React.CSSProperties | undefined {
    if (!dragState) return undefined;
    const { key: draggedKey, fromIndex, toIndex, dx, settling } = dragState;
    if (key === draggedKey) {
      return {
        transform: `translateX(${dx}px)`,
        transition: settling ? `transform ${SETTLE_MS}ms ease` : 'none',
        zIndex: 2,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
      };
    }
    const draggedWidth = rectsRef.current[fromIndex]?.width || 0;
    let shift = 0;
    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
      shift = -draggedWidth;
    } else if (toIndex < fromIndex && index >= toIndex && index < fromIndex) {
      shift = draggedWidth;
    }
    return {
      transform: `translateX(${shift}px)`,
      transition: `transform ${SETTLE_MS}ms ease`,
      pointerEvents: 'none'
    };
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    key: NavTabKey,
    index: number
  ) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (dragState || !containerRef.current) return;
    const items = [...containerRef.current.children] as HTMLElement[];
    rectsRef.current = items.map((el) => {
      const { left, width } = el.getBoundingClientRect();
      return { left, width, center: left + width / 2 };
    });
    const containerRect = containerRef.current.getBoundingClientRect();
    const tabRect = rectsRef.current[index];
    boundsRef.current = {
      minDX: containerRect.left - tabRect.left,
      maxDX: containerRect.right - (tabRect.left + tabRect.width)
    };
    pendingRef.current = { key, index, startX: event.clientX };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const pending = pendingRef.current;
    if (!pending || dragState?.settling) return;
    if (!(event.buttons & 1)) {
      // the press was released outside the strip before a drag started
      pendingRef.current = null;
      return;
    }
    const rawDX = event.clientX - pending.startX;
    if (!dragState) {
      if (Math.abs(rawDX) < DRAG_THRESHOLD_PX) return;
      // capture only once a real drag starts; capturing on pointerdown
      // would retarget the eventual click away from the Link and break
      // plain tab clicks
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    didDragRef.current = true;
    const { minDX, maxDX } = boundsRef.current;
    const dx = Math.min(maxDX, Math.max(minDX, rawDX));
    // pinned against a strip edge = unambiguous intent; without this, a tab
    // wider than the edge tab can never move its center past the edge tab's
    // center, making the first/last slot unreachable
    let toIndex = 0;
    if (dx >= maxDX) {
      toIndex = rectsRef.current.length - 1;
    } else if (dx > minDX) {
      const draggedCenter = rectsRef.current[pending.index].center + dx;
      for (let i = 0; i < rectsRef.current.length; i++) {
        if (i === pending.index) continue;
        if (rectsRef.current[i].center < draggedCenter) toIndex++;
      }
    }
    setDragState({
      key: pending.key,
      fromIndex: pending.index,
      toIndex,
      dx,
      settling: false
    });
  }

  function handlePointerUp() {
    const pending = pendingRef.current;
    if (!pending) return;
    if (!dragState || dragState.settling) {
      pendingRef.current = null;
      return;
    }
    settleThenCommit(dragState);
  }

  function handlePointerCancel() {
    if (dragState && !dragState.settling) {
      settleThenCommit({
        ...dragState,
        toIndex: dragState.fromIndex
      });
      return;
    }
    pendingRef.current = null;
  }

  function settleThenCommit(state: DragState) {
    const { fromIndex, toIndex } = state;
    const targetTab = tabs[toIndex];
    setDragState({
      ...state,
      dx: computeSettleDX(fromIndex, toIndex),
      settling: true
    });
    settleTimerRef.current = setTimeout(() => {
      if (toIndex !== fromIndex && targetTab) {
        onMove({ sourceKey: state.key, targetKey: targetTab.key });
      }
      pendingRef.current = null;
      didDragRef.current = false;
      setDragState(null);
    }, SETTLE_MS + 20);
  }

  function computeSettleDX(fromIndex: number, toIndex: number) {
    const rects = rectsRef.current;
    let dx = 0;
    if (toIndex > fromIndex) {
      for (let i = fromIndex + 1; i <= toIndex; i++) {
        dx += rects[i].width;
      }
    } else if (toIndex < fromIndex) {
      for (let i = toIndex; i < fromIndex; i++) {
        dx -= rects[i].width;
      }
    }
    return dx;
  }

  function handleClickCapture(event: React.MouseEvent) {
    if (!didDragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }
}
