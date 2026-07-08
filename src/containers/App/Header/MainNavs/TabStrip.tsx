import React, { useEffect, useRef, useState } from 'react';
import Nav from './Nav';
import DropdownList from '~/components/DropdownList';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { APP_SHELL_HEADER_OFFSET_FALLBACK } from '~/constants/appShell';

export interface NavTabDescriptor {
  key: string;
  to: string;
  imgLabel: string;
  label: React.ReactNode;
  kind?: 'pinned' | 'dynamic';
  exactActive?: boolean;
  minimized?: boolean;
  alert?: boolean;
  isHome?: boolean;
  isUsingChat?: boolean;
  profileUsername?: string;
}

export interface TabMenuItem {
  label: string;
  onClick: () => void;
}

interface DragState {
  key: string;
  fromIndex: number;
  toIndex: number;
  dx: number;
  settling: boolean;
}

const DRAG_THRESHOLD_PX = 5;
const SETTLE_MS = 160;
const HINT_DWELL_MS = 1200;
const HINT_AUTO_HIDE_MS = 5000;

const menuHintClass = css`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.6rem;
  padding: 0.5rem 1rem;
  white-space: nowrap;
  background: ${Color.black(0.85)};
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 8px;
  pointer-events: none;
  z-index: 3;
`;

const stripClass = css`
  height: ${APP_SHELL_HEADER_OFFSET_FALLBACK};
  display: flex;
  align-items: flex-end;
`;

const dragZoneClass = css`
  height: 100%;
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
  /* Chrome hides the separators touching the active or hovered tab */
  &:hover::before,
  &:hover + &::before,
  &:has(a.active)::before,
  &:has(a.active) + &::before {
    display: none;
  }
`;

export default function TabStrip({
  pinnedTabs,
  tabs,
  onMove,
  menuItemsForTab,
  showMenuHint,
  onMenuOpen
}: {
  pinnedTabs: NavTabDescriptor[];
  tabs: NavTabDescriptor[];
  onMove: (arg: { sourceKey: string; targetKey: string }) => void;
  menuItemsForTab?: (key: string) => TabMenuItem[] | null;
  showMenuHint?: boolean;
  onMenuOpen?: () => void;
}) {
  const dragZoneRef = useRef<HTMLDivElement | null>(null);
  const pendingRef = useRef<{
    key: string;
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
  // only the anchor + tab key are stored; the items are derived LIVE at
  // render time so callbacks never close over pre-adoption state (server
  // nav state can arrive while the menu is open)
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    tabKey: string;
  } | null>(null);
  const menuItems = menu ? menuItemsForTab?.(menu.tabKey) || null : null;

  // the menu's tab can vanish mid-open (e.g. adoption removes a stale
  // cached pin); close instead of hanging an empty invisible menu
  const menuIsOrphaned = !!menu && (!menuItems || menuItems.length === 0);
  useEffect(() => {
    if (menuIsOrphaned) {
      setMenu(null);
    }
  }, [menuIsOrphaned]);
  const hintDwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintShownThisSessionRef = useRef(false);
  const [hintTabKey, setHintTabKey] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
      if (hintDwellTimerRef.current) {
        clearTimeout(hintDwellTimerRef.current);
      }
      if (hintHideTimerRef.current) {
        clearTimeout(hintHideTimerRef.current);
      }
    };
  }, []);

  return (
    <div data-nav-tab-strip="true" className={`desktop ${stripClass}`}>
      {pinnedTabs.map((tab) => (
        <div
          key={tab.key}
          className={tabItemClass}
          title={
            tab.minimized && typeof tab.label === 'string'
              ? tab.label
              : undefined
          }
          onContextMenu={(event) => handleContextMenu(event, tab.key)}
          onMouseEnter={() => handleHintDwellStart(tab.key)}
          onMouseLeave={handleHintDismiss}
        >
          <Nav
            variant="tab"
            tabKind="pinned"
            className="desktop"
            to={tab.to}
            imgLabel={tab.imgLabel}
            exactActive={tab.exactActive}
          >
            {tab.minimized ? null : tab.label}
          </Nav>
          {hintTabKey === tab.key && (
            <div className={menuHintClass}>Right-click for options</div>
          )}
        </div>
      ))}
      <div ref={dragZoneRef} className={dragZoneClass}>
        {tabs.map((tab, index) => (
          <div
            key={tab.key}
            className={tabItemClass}
            style={getTabStyle(index, tab.key)}
            title={
              tab.minimized && typeof tab.label === 'string'
                ? tab.label
                : undefined
            }
            onPointerDown={(event) => handlePointerDown(event, tab.key, index)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onClickCapture={handleClickCapture}
            onContextMenu={(event) => handleContextMenu(event, tab.key)}
            onMouseEnter={() => handleHintDwellStart(tab.key)}
            onMouseLeave={handleHintDismiss}
          >
            <Nav
              variant="tab"
              tabKind={tab.kind}
              className="desktop"
              to={tab.to}
              imgLabel={tab.imgLabel}
              exactActive={tab.exactActive}
              alert={tab.alert}
              isHome={tab.isHome}
              isUsingChat={tab.isUsingChat}
              profileUsername={tab.profileUsername}
            >
              {tab.minimized ? null : tab.label}
            </Nav>
            {hintTabKey === tab.key && (
              <div className={menuHintClass}>Right-click for options</div>
            )}
          </div>
        ))}
      </div>
      {menu && menuItems && menuItems.length > 0 && (
        <DropdownList
          dropdownContext={{ x: menu.x, y: menu.y, width: 0, height: 0 }}
          onHideMenu={() => setMenu(null)}
        >
          {menuItems.map((item) => (
            <li
              key={item.label}
              onClick={() => {
                setMenu(null);
                item.onClick();
              }}
            >
              {item.label}
            </li>
          ))}
        </DropdownList>
      )}
    </div>
  );

  function getTabStyle(index: number, key: string): React.CSSProperties | undefined {
    if (!dragState) return undefined;
    const { key: draggedKey, fromIndex, toIndex, dx, settling } = dragState;
    if (key === draggedKey) {
      return {
        transform: `translateX(${dx}px)`,
        transition: settling ? `transform ${SETTLE_MS}ms ease` : 'none',
        zIndex: 2
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

  function handleContextMenu(event: React.MouseEvent, key: string) {
    const items = menuItemsForTab?.(key);
    if (!items || items.length === 0) return;
    event.preventDefault();
    handleHintDismiss();
    setMenu({ x: event.clientX, y: event.clientY, tabKey: key });
    onMenuOpen?.();
  }

  function handleHintDwellStart(key: string) {
    if (!showMenuHint || hintShownThisSessionRef.current) return;
    if (dragState || menu) return;
    if (hintDwellTimerRef.current) {
      clearTimeout(hintDwellTimerRef.current);
    }
    hintDwellTimerRef.current = setTimeout(() => {
      // only teach once per page load; the flag prop retires it for good
      hintShownThisSessionRef.current = true;
      setHintTabKey(key);
      hintHideTimerRef.current = setTimeout(
        () => setHintTabKey(null),
        HINT_AUTO_HIDE_MS
      );
    }, HINT_DWELL_MS);
  }

  function handleHintDismiss() {
    if (hintDwellTimerRef.current) {
      clearTimeout(hintDwellTimerRef.current);
      hintDwellTimerRef.current = null;
    }
    if (hintHideTimerRef.current) {
      clearTimeout(hintHideTimerRef.current);
      hintHideTimerRef.current = null;
    }
    setHintTabKey(null);
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    key: string,
    index: number
  ) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (dragState || !dragZoneRef.current) return;
    const items = [...dragZoneRef.current.children] as HTMLElement[];
    rectsRef.current = items.map((el) => {
      const { left, width } = el.getBoundingClientRect();
      return { left, width, center: left + width / 2 };
    });
    const zoneRect = dragZoneRef.current.getBoundingClientRect();
    const tabRect = rectsRef.current[index];
    boundsRef.current = {
      minDX: zoneRect.left - tabRect.left,
      maxDX: zoneRect.right - (tabRect.left + tabRect.width)
    };
    pendingRef.current = { key, index, startX: event.clientX };
    handleHintDismiss();
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
