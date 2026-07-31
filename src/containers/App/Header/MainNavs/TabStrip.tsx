import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import Nav, { navTargetIsActive } from './Nav';
import Icon from '~/components/Icon';
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
  buildAppId?: string;
  audioMuted?: boolean;
  closable?: boolean;
}

export interface TabMenuItem {
  label: string;
  icon?: string | [string, string];
  disabled?: boolean;
  onClick: () => void;
}

// Pinned tabs are the only manually draggable section. Primary/default tabs
// and extras use the same layout machinery but are ordered automatically.
type DragZone = 'pinned' | 'default' | 'extra';

interface DragState {
  key: string;
  zone: DragZone;
  fromIndex: number;
  toIndex: number;
  dx: number;
  settling: boolean;
}

const DRAG_THRESHOLD_PX = 5;
const SETTLE_MS = 160;
// touch: hold this long (finger still) to open a tab's menu (no right-click)
const LONGPRESS_MENU_MS = 450;
const LONGPRESS_MOVE_CANCEL_PX = 10;
const HINT_DWELL_MS = 1200;
const HINT_AUTO_HIDE_MS = 5000;
const TAB_MAX_WIDTH = '15rem';
// the pinned area shows at most this many tabs at once, then pages via its own
// scroll — it never hides behind the main tabs' scroll
const PINNED_MAX_VISIBLE = 5;
// iPad portrait is narrow: show just 1.5 pinned tabs so they don't crowd the
// bar (the half-tab hints there's more to scroll)
const PINNED_MAX_VISIBLE_PORTRAIT = 1.5;

const menuHintClass = css`
  position: fixed;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  white-space: nowrap;
  background: ${Color.black(0.85)};
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 8px;
  pointer-events: none;
  z-index: 100000000;
`;

const stripClass = css`
  height: ${APP_SHELL_HEADER_OFFSET_FALLBACK};
  display: flex;
  align-items: flex-end;
  min-width: 0;
  flex: 0 1 auto;
  /* the tab area lives in a bounded lane: it sizes to its tabs (centered by
     the header's space-between) but never sprawls across the whole header —
     once the tabs exceed the lane they scroll within it (chevrons) instead of
     jamming edge-to-edge against the coins */
  max-width: 76rem;
  overflow: hidden;
  /* The Tabs button's hairline answers to its left neighbor the same way a
     tab's does (tabItemClass hides a separator against a hovered tab), but the
     button sits outside the tab containers, so that sibling rule can't reach
     it. The neighbor's ACTIVE state is resolved in JS (data-divider); hover is
     matched here so hovering a tab never re-renders the strip. */
  &:has([data-tab-manager-neighbor='true']:hover)
    [data-tab-manager-button='true']::before {
    display: none;
  }
`;

// the pinned scroll area holds its width (never yields to the main tabs) so
// pinned tabs are ALWAYS visible; the main area takes the rest and shrinks
const pinnedAreaClass = css`
  flex-shrink: 0;
`;
const mainAreaClass = css`
  flex: 0 1 auto;
  min-width: 0;
`;

// a self-scrolling row: [chevron] [scroll container] [chevron]
const scrollRowClass = css`
  height: 100%;
  display: flex;
  align-items: flex-end;
`;

// the dock of defaults that have scrolled out of the main view: fixed between
// the pinned area and the main scroll, icon-only, never scrolls
const collapsedDockClass = css`
  height: 100%;
  display: flex;
  align-items: flex-end;
  flex-shrink: 0;
`;

const scrollButtonClass = css`
  flex-shrink: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding-bottom: 0.9rem;
  button {
    width: 2.2rem;
    height: 2.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: ${Color.gray()};
    -webkit-tap-highlight-color: transparent;
    &:hover {
      background: ${Color.wellGray()};
      color: ${Color.darkerGray()};
    }
    &:disabled {
      opacity: 0.25;
      cursor: default;
      background: transparent;
      color: ${Color.gray()};
    }
  }
`;

// The strip-end Tabs button dresses like the default (minimized builtin)
// tabs: transparent tab shape on the tab baseline, icon-only, wellGray hover.
// It joins the row's separator grammar too — a hairline on its left when a
// tab precedes it, hidden whenever that hairline would touch a highlighted
// tab: the neighbor is ACTIVE, hovered, or being dragged, or the button itself
// is hovered (the same rules tabItemClass applies between tabs; the button
// lives outside the tab containers, so TabStrip computes the neighbor and
// passes data-divider instead of relying on the `& + &` sibling rule, and
// stripClass matches the neighbor's hover).
const tabManagerButtonClass = css`
  position: relative;
  height: 100%;
  display: flex;
  align-items: flex-end;
  flex-shrink: 0;
  &[data-divider='true']::before {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0.8rem;
    width: 1px;
    height: 1.8rem;
    background: ${Color.borderGray()};
  }
  &:hover::before {
    display: none;
  }
  button {
    height: 3.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 1rem;
    border: none;
    border-radius: 10px 10px 0 0;
    background: transparent;
    color: ${Color.gray()};
    font: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    &:hover {
      background: ${Color.wellGray()};
      color: ${Color.darkerGray()};
    }
  }
`;

// Each scrollable tab cluster remains reachable when overcrowded. Pinned tabs
// have their own drag zone inside their independently scrolling area.
const scrollContainerClass = css`
  height: 100%;
  display: flex;
  align-items: flex-end;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const dragZoneClass = css`
  height: 100%;
  display: flex;
  align-items: flex-end;
  flex-shrink: 0;
`;

const tabItemClass = css`
  position: relative;
  display: flex;
  align-items: flex-end;
  height: 100%;
  flex-shrink: 0;
  max-width: ${TAB_MAX_WIDTH};
  /* touch: our long-press opens the tab menu, so suppress the iOS callout /
     text-selection that a native long-press would trigger */
  -webkit-touch-callout: none;
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

const actionTabItemClass = css`
  a {
    padding-right: 2.85rem !important;
  }
`;

const audioAndCloseTabItemClass = css`
  a {
    padding-right: 4.9rem !important;
  }
  button[data-tab-audio='true'] {
    right: 2.45rem;
  }
`;

const tabActionButtonClass = css`
  position: absolute;
  right: 0.45rem;
  bottom: 1.18rem;
  z-index: 3;
  width: 1.85rem;
  height: 1.85rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${Color.gray()};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  font-size: 1rem;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: ${Color.wellGray()};
    color: ${Color.darkerGray()};
  }
`;

const audioMuteButtonClass = css`
  &[data-muted='true'] {
    color: ${Color.logoBlue()};
  }
`;

const closeTabButtonClass = css`
  opacity: 0.72;

  &:hover,
  &:focus-visible {
    opacity: 1;
  }
`;

// the tab being dragged must read as a solid lifted tab (not floating
// icon+text): give it the active tab's opaque body + outline so it covers
// whatever it's dragged over. z-index (from getTabStyle) keeps it on top; a
// drop shadow would be clipped by the strip's overflow, so the outline does
// the lifting instead. No bottom border (like the active tab, it merges into
// the header's bottom edge). Also hide the separators flanking it.
const draggingTabClass = css`
  z-index: 2;
  a {
    background: ${Color.white()} !important;
    border-color: var(--ui-border) !important;
  }
  &::before,
  & + &::before {
    display: none;
  }
`;

// A horizontally self-scrolling row of tabs with its own overflow chevrons,
// wheel-to-scroll, and active-tab auto-scroll. Two of these run side by side —
// pinned and main — so each scrolls INDEPENDENTLY (scrolling the main tabs can
// never push the pinned tabs out of view). `signature` changes whenever the
// contained tab set changes, so overflow/cap state recomputes. `maxVisible`
// caps the row to the first N items' width (pinned = 5), paging to reach more.
function ScrollableRow({
  children,
  signature,
  maxVisible,
  itemContainerRef,
  wrapperClassName,
  onScrollChange,
  scrollToEndOnLoad
}: {
  children: React.ReactNode;
  signature: string;
  maxVisible?: number;
  itemContainerRef?: React.RefObject<HTMLDivElement | null>;
  wrapperClassName?: string;
  // fired on every scroll/resize so the parent can react to the scroll offset
  // (used to dock defaults that have scrolled out of view)
  onScrollChange?: () => void;
  // on first load, if the row overflows, jump to the end (most recent tab)
  scrollToEndOnLoad?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState({
    overflowing: false,
    atStart: true,
    atEnd: true
  });
  const scrollStateRef = useRef(scrollState);
  scrollStateRef.current = scrollState;
  const [capWidth, setCapWidth] = useState<number | undefined>(undefined);
  const didInitialEndScrollRef = useRef(false);
  const cancelActiveScrollRef = useRef<() => void>(() => {});
  const pendingControlLayoutCompensationRef = useRef<number | null>(null);
  const { pathname, search } = useLocation();

  // The overflow carets are flex siblings of the scroller. When they mount or
  // unmount, preserve the scroller's confirmed screen position before paint so
  // that changing controls never moves the tabs beneath an active gesture.
  useLayoutEffect(() => {
    const previousLeft = pendingControlLayoutCompensationRef.current;
    pendingControlLayoutCompensationRef.current = null;
    const el = scrollRef.current;
    if (previousLeft === null || !el) return;
    const leftDelta = el.getBoundingClientRect().left - previousLeft;
    if (Math.abs(leftDelta) < 0.5) return;
    el.scrollLeft += leftDelta;
  }, [scrollState.overflowing]);

  // First load only: once the row's tabs are present, if it overflows, jump to
  // the END so the most recently added tab is shown (unless a tab in this row
  // is active, in which case the active-scroll effect below owns the scroll).
  useEffect(() => {
    if (!scrollToEndOnLoad || didInitialEndScrollRef.current) return;
    if (!signature) return; // tabs not loaded yet
    const raf = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      didInitialEndScrollRef.current = true; // one-shot per page load
      if (el.scrollWidth <= el.clientWidth + 1) return; // fits, nothing to do
      if (el.querySelector('a.active')) return; // active tab wins
      el.scrollLeft = el.scrollWidth;
    });
    return () => cancelAnimationFrame(raf);
  }, [scrollToEndOnLoad, signature]);

  // cap the visible width to the first `maxVisible` tabs; beyond that the row
  // pages via its scroll instead of growing
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !maxVisible) {
      setCapWidth(undefined);
      return;
    }
    const itemContainer = itemContainerRef?.current || el;
    const kids = [...itemContainer.children] as HTMLElement[];
    if (kids.length <= maxVisible) {
      setCapWidth(undefined);
      return;
    }
    // maxVisible may be fractional (e.g. 1.5 shows one whole tab plus half of
    // the next, hinting there's more to scroll)
    let width = 0;
    const whole = Math.floor(maxVisible);
    for (let i = 0; i < whole && i < kids.length; i++) {
      width += kids[i].getBoundingClientRect().width;
    }
    const frac = maxVisible - whole;
    if (frac > 0 && kids[whole]) {
      width += kids[whole].getBoundingClientRect().width * frac;
    }
    setCapWidth(width);
  }, [itemContainerRef, maxVisible, signature]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const observer = new ResizeObserver(() => updateScrollState());
    observer.observe(el);
    return () => observer.disconnect();
    // updateScrollState only reads refs/setState/the onScrollChange prop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, capWidth]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function handleWheelNative(event: WheelEvent) {
      if (!el || el.scrollWidth <= el.clientWidth) return;
      // A real wheel gesture owns the strip from this point onward. Without
      // cancelling the delayed active-tab alignment below, those callbacks can
      // pull against the user's movement for the first few hundred ms.
      cancelActiveScrollRef.current();
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      el.scrollLeft += event.deltaY;
      event.preventDefault();
    }
    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, []);

  // Keep the active tab in view — on route change AND on tab-set change (a
  // freshly spawned tab is active but starts off-screen far-right). Deferred
  // two frames so the new tab (and any cap/dock re-layout) has settled, and we
  // scroll ONLY this container's scrollLeft (native scrollIntoView is flaky in
  // horizontal overflow rows and can yank ancestor scrollers).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let cancelled = false;
    const runActiveScroll = () => {
      if (!cancelled) scrollActiveIntoView();
    };
    const raf = requestAnimationFrame(runActiveScroll);
    // A freshly spawned tab settles over several frames (spawn → state →
    // reconcile → layout), so re-run a couple times to land it in view even
    // when it isn't at its final position on the first frame.
    const timers = [
      window.setTimeout(runActiveScroll, 120),
      window.setTimeout(runActiveScroll, 340)
    ];
    function cancelActiveScroll() {
      if (cancelled) return;
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    }
    cancelActiveScrollRef.current = cancelActiveScroll;
    return () => {
      cancelActiveScroll();
      if (cancelActiveScrollRef.current === cancelActiveScroll) {
        cancelActiveScrollRef.current = () => {};
      }
    };
  }, [pathname, search, signature]);

  return (
    <div
      className={`${scrollRowClass} ${wrapperClassName || ''}`}
      onPointerDownCapture={cancelPendingActiveScroll}
    >
      {scrollState.overflowing && (
        <div className={scrollButtonClass}>
          <button
            type="button"
            disabled={scrollState.atStart}
            onClick={() => scrollByPage(-1)}
            aria-label="Scroll tabs left"
          >
            <Icon icon="chevron-left" />
          </button>
        </div>
      )}
      <div
        ref={scrollRef}
        className={scrollContainerClass}
        style={capWidth ? { maxWidth: `${capWidth}px` } : undefined}
        onScroll={updateScrollState}
      >
        {children}
      </div>
      {scrollState.overflowing && (
        <div className={scrollButtonClass}>
          <button
            type="button"
            disabled={scrollState.atEnd}
            onClick={() => scrollByPage(1)}
            aria-label="Scroll tabs right"
          >
            <Icon icon="chevron-right" />
          </button>
        </div>
      )}
    </div>
  );

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth + 1;
    const atStart = el.scrollLeft <= 1;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
    if (scrollStateRef.current.overflowing !== overflowing) {
      pendingControlLayoutCompensationRef.current =
        el.getBoundingClientRect().left;
    }
    setScrollState((prev) =>
      prev.overflowing === overflowing &&
      prev.atStart === atStart &&
      prev.atEnd === atEnd
        ? prev
        : { overflowing, atStart, atEnd }
    );
    onScrollChange?.();
  }

  function scrollActiveIntoView() {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth + 1) return; // nothing to scroll
    const active = el.querySelector('a.active') as HTMLElement | null;
    if (!active) return;
    // measure the whole tab WRAPPER (link + any trailing affordance like the
    // audio-mute button), not just the <a> — otherwise a build-app tab reveals
    // only its link and the mute button on the right stays clipped.
    const wrapper = (active.parentElement?.parentElement ??
      active) as HTMLElement;
    const pad = 12;
    const cRect = el.getBoundingClientRect();
    const aRect = wrapper.getBoundingClientRect();
    let delta = 0;
    // reveal the RIGHT edge first: a freshly focused tab is usually off to the
    // right, and we want its full width (incl. the mute button) shown
    if (aRect.right > cRect.right - pad) {
      delta = aRect.right - (cRect.right - pad);
    } else if (aRect.left < cRect.left + pad) {
      delta = aRect.left - (cRect.left + pad);
    }
    if (delta !== 0) {
      el.scrollBy({ left: delta, behavior: 'smooth' });
    }
  }

  function cancelPendingActiveScroll() {
    cancelActiveScrollRef.current();
  }

  // page by (almost) the visible width so each chevron click advances a full
  // "scroll state" (~5 pinned tabs)
  function scrollByPage(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    cancelPendingActiveScroll();
    el.scrollBy({
      left: direction * Math.max(120, el.clientWidth * 0.9),
      behavior: 'smooth'
    });
  }
}

export default function TabStrip({
  pinnedTabs,
  defaultTabs,
  tabs,
  onMovePinned,
  menuItemsForTab,
  showMenuHint,
  onMenuOpen,
  onCloseTab,
  onToggleAudioMuted,
  onOpenTabManager,
  isTabletPortrait
}: {
  pinnedTabs: NavTabDescriptor[];
  defaultTabs: NavTabDescriptor[];
  tabs: NavTabDescriptor[];
  onMovePinned: (arg: { sourceKey: string; targetKey: string }) => void;
  menuItemsForTab?: (key: string) => TabMenuItem[] | null;
  showMenuHint?: boolean;
  onMenuOpen?: () => void;
  onCloseTab?: (key: string) => void;
  onToggleAudioMuted?: (buildAppId: string) => void;
  onOpenTabManager?: () => void;
  isTabletPortrait?: boolean;
}) {
  const { pathname, search } = useLocation();
  const pinnedZoneRef = useRef<HTMLDivElement | null>(null);
  const defaultZoneRef = useRef<HTMLDivElement | null>(null);
  const dragZoneRef = useRef<HTMLDivElement | null>(null);
  const pendingRef = useRef<{
    key: string;
    zone: DragZone;
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
  // the drag runs off window listeners (see handlePointerDown) so a mid-drag
  // header re-render remounting the tab node can't strand it; those listeners
  // must read live values, so mirror everything they touch into refs
  const dragStateRef = useRef<DragState | null>(dragState);
  dragStateRef.current = dragState;
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const pinnedTabsRef = useRef(pinnedTabs);
  pinnedTabsRef.current = pinnedTabs;
  const defaultTabsRef = useRef(defaultTabs);
  defaultTabsRef.current = defaultTabs;
  const onMovePinnedRef = useRef(onMovePinned);
  onMovePinnedRef.current = onMovePinned;
  const windowDragCleanupRef = useRef<null | (() => void)>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchGestureRef = useRef<{ armed: boolean } | null>(null);
  const didLongPressRef = useRef(false);
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
  const hintAnchorElRef = useRef<HTMLElement | null>(null);
  const [hintAnchor, setHintAnchor] = useState<{
    key: string;
    rect: DOMRect;
  } | null>(null);
  // how many sacred defaults have scrolled out of the main view on each side and
  // are shown as icon chips in a dock instead (the originals stay in the scroll).
  // Two docks, one per edge: the active-tab auto-scroll pins whichever tab is
  // active, so a leading default (e.g. Home) being active pushes the trailing
  // defaults off the RIGHT — those need a dock too, or they vanish entirely.
  const [collapsedLeadingCount, setCollapsedLeadingCount] = useState(0);
  const [collapsedTrailingCount, setCollapsedTrailingCount] = useState(0);
  const collapsedLeadingCountRef = useRef(collapsedLeadingCount);
  collapsedLeadingCountRef.current = collapsedLeadingCount;
  const collapsedTrailingCountRef = useRef(collapsedTrailingCount);
  collapsedTrailingCountRef.current = collapsedTrailingCount;
  const pendingDockLayoutCompensationRef = useRef<{
    scroller: HTMLElement;
    left: number;
  } | null>(null);

  // Docking a default adds or removes fixed-width icon tabs beside the main
  // scroller. Preserve the tabs' confirmed screen position across that layout
  // change so a live wheel gesture never sees the content jump backward.
  useLayoutEffect(() => {
    const pending = pendingDockLayoutCompensationRef.current;
    pendingDockLayoutCompensationRef.current = null;
    if (!pending) return;
    const scroller = defaultZoneRef.current?.parentElement;
    if (!scroller || scroller !== pending.scroller) return;
    const leftDelta = scroller.getBoundingClientRect().left - pending.left;
    if (Math.abs(leftDelta) < 0.5) return;
    scroller.scrollLeft += leftDelta;
  }, [collapsedLeadingCount, collapsedTrailingCount]);

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
      windowDragCleanupRef.current?.();
      endTouchGesture();
    };
  }, []);

  const pinnedSignature = pinnedTabs.map((tab) => tab.key).join(',');
  const mainSignature = `${defaultTabs
    .map((tab) => tab.key)
    .join(',')}|${tabs.map((tab) => tab.key).join(',')}`;

  // the Tabs button's left-hand neighbor in visual order: the trailing dock's
  // last chip when the dock is shown, else the last extra, else the last
  // default. Its divider follows the row's separator rules — shown when a tab
  // precedes it, hidden when that neighbor is the active tab, is being dragged,
  // or is hovered. The zone matters: a docked default is ALSO still rendered in
  // the main scroll (the dock is additive), so only the copy that actually
  // touches the button carries the neighbor marker the hover rule looks for.
  const managerNeighborTab =
    collapsedTrailingCount > 0 || tabs.length === 0
      ? defaultTabs[defaultTabs.length - 1]
      : tabs[tabs.length - 1];
  const managerNeighborZone: DragZone | 'trailingDock' | null =
    !managerNeighborTab
      ? null
      : collapsedTrailingCount > 0
        ? 'trailingDock'
        : tabs.length === 0
          ? 'default'
          : 'extra';
  const managerDividerShown = Boolean(
    managerNeighborTab &&
    dragState?.key !== managerNeighborTab.key &&
    !navTargetIsActive({
      exactActive: managerNeighborTab.exactActive,
      pathname,
      profileUsername: managerNeighborTab.profileUsername,
      search,
      to: managerNeighborTab.to
    })
  );

  return (
    <div data-nav-tab-strip="true" className={`desktop ${stripClass}`}>
      {/* pinned area: its OWN scroll, always visible, up to 5 icon tabs */}
      {pinnedTabs.length > 0 && (
        <ScrollableRow
          key="pinned-tabs"
          signature={pinnedSignature}
          itemContainerRef={pinnedZoneRef}
          maxVisible={
            isTabletPortrait ? PINNED_MAX_VISIBLE_PORTRAIT : PINNED_MAX_VISIBLE
          }
          wrapperClassName={pinnedAreaClass}
          scrollToEndOnLoad
        >
          <div
            ref={pinnedZoneRef}
            data-tab-drag-zone="pinned"
            className={dragZoneClass}
          >
            {pinnedTabs.map((tab, index) => renderTab(tab, index, 'pinned'))}
          </div>
        </ScrollableRow>
      )}
      {/* leading dock: defaults scrolled off the LEFT edge, shown as icon chips
          (the originals stay in the main scroll — this is additive) */}
      {collapsedLeadingCount > 0 && (
        <div data-collapsed-dock="leading" className={collapsedDockClass}>
          {defaultTabs
            .slice(0, Math.min(collapsedLeadingCount, defaultTabs.length))
            .map((tab) => renderDockChip(tab, 'leading'))}
        </div>
      )}
      {/* main area: defaults + extras, its own independent scroll */}
      <ScrollableRow
        key="main-tabs"
        signature={mainSignature}
        wrapperClassName={mainAreaClass}
        onScrollChange={recomputeCollapsedDefaults}
      >
        {/* Primary defaults have a fixed baseline order. Their active tab is
            rotated to the right by MainNavs; this zone is click-only. */}
        <div
          ref={defaultZoneRef}
          data-tab-drag-zone="default"
          className={dragZoneClass}
        >
          {defaultTabs.map((tab, index) => renderTab(tab, index, 'default'))}
        </div>
        {/* Extras (profile/dynamic/Lumine/added) follow automatic MRU order
            and always sit to the right of the defaults. */}
        <div
          ref={dragZoneRef}
          data-tab-drag-zone="extra"
          className={dragZoneClass}
        >
          {tabs.map((tab, index) => renderTab(tab, index, 'extra'))}
        </div>
      </ScrollableRow>
      {/* trailing dock: defaults scrolled off the RIGHT edge (e.g. when a
          leading default like Home is active and pins the scroll), shown as
          icon chips so a sacred default can never disappear entirely */}
      {collapsedTrailingCount > 0 && (
        <div data-collapsed-dock="trailing" className={collapsedDockClass}>
          {defaultTabs
            .slice(Math.max(0, defaultTabs.length - collapsedTrailingCount))
            .map((tab) => renderDockChip(tab, 'trailing'))}
        </div>
      )}
      {/* the strip-end door into tab management: the same switcher the mobile
          Tabs button opens. Right-click/long-press stay the shortcuts; this
          visible button exists for everyone who never discovers them. Chrome
          parks its tab-search affordance in this spot for the same reason. */}
      {onOpenTabManager && (
        <div
          className={tabManagerButtonClass}
          data-tab-manager-button="true"
          data-divider={managerDividerShown ? 'true' : 'false'}
        >
          <button
            type="button"
            aria-label="Your tabs"
            title="Your tabs"
            onClick={onOpenTabManager}
          >
            <Icon icon="clone" />
          </button>
        </div>
      )}
      {hintAnchor &&
        createPortal(
          <div
            className={menuHintClass}
            style={{
              left: hintAnchor.rect.left + hintAnchor.rect.width / 2,
              top: hintAnchor.rect.bottom + 6
            }}
          >
            Right-click for options
          </div>,
          document.body
        )}
      {menu && menuItems && menuItems.length > 0 && (
        <DropdownList
          dropdownContext={{ x: menu.x, y: menu.y, width: 0, height: 0 }}
          onHideMenu={() => setMenu(null)}
        >
          {menuItems.map((item) => (
            <li
              key={item.label}
              style={
                item.disabled
                  ? { opacity: 0.4, cursor: 'default', pointerEvents: 'none' }
                  : undefined
              }
              aria-disabled={item.disabled || undefined}
              onClick={() => {
                if (item.disabled) return;
                setMenu(null);
                item.onClick();
              }}
            >
              {item.icon ? (
                <Icon
                  icon={item.icon}
                  style={{ width: '1.4rem', opacity: 0.75 }}
                />
              ) : null}
              {item.label}
            </li>
          ))}
        </DropdownList>
      )}
    </div>
  );

  function renderTab(tab: NavTabDescriptor, index: number, zone: DragZone) {
    const isClosable = Boolean(zone === 'extra' && tab.closable && onCloseTab);
    const hasTabAction = Boolean(tab.buildAppId || isClosable);
    return (
      <div
        key={tab.key}
        className={`${tabItemClass}${
          hasTabAction ? ` ${actionTabItemClass}` : ''
        }${
          tab.buildAppId && isClosable ? ` ${audioAndCloseTabItemClass}` : ''
        }${dragState?.key === tab.key ? ` ${draggingTabClass}` : ''}`}
        style={getTabStyle(index, tab.key, zone)}
        data-tab-manager-neighbor={
          managerNeighborZone === zone && managerNeighborTab?.key === tab.key
            ? 'true'
            : undefined
        }
        title={typeof tab.label === 'string' ? tab.label : undefined}
        onPointerDown={(event) =>
          handlePointerDown(event, tab.key, index, zone)
        }
        onClickCapture={handleClickCapture}
        onContextMenu={
          zone === 'default'
            ? undefined
            : (event) => handleContextMenu(event, tab.key)
        }
        onMouseEnter={
          zone === 'default'
            ? undefined
            : (event) => handleHintDwellStart(tab.key, event.currentTarget)
        }
        onMouseLeave={zone === 'default' ? undefined : handleHintDismiss}
      >
        <Nav
          variant="tab"
          tabKind={zone === 'pinned' ? 'pinned' : tab.kind}
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
        {renderAudioMuteButton(tab)}
        {isClosable ? renderCloseTabButton(tab) : null}
      </div>
    );
  }

  // an icon-only chip in the dock for a default that has scrolled out of the
  // main view. Click-only (navigates); no drag, no context menu.
  function renderDockChip(
    tab: NavTabDescriptor,
    dockSide: 'leading' | 'trailing'
  ) {
    return (
      <div
        key={tab.key}
        className={tabItemClass}
        data-tab-manager-neighbor={
          dockSide === 'trailing' &&
          managerNeighborZone === 'trailingDock' &&
          managerNeighborTab?.key === tab.key
            ? 'true'
            : undefined
        }
        title={typeof tab.label === 'string' ? tab.label : undefined}
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
        >
          {null}
        </Nav>
      </div>
    );
  }

  // A default is "docked" once it is MOSTLY hidden past an edge of the main
  // viewport — less than half of its width still shows. "Mostly hidden" rather
  // than "fully off-screen" matters because the active-tab auto-scroll parks the
  // active tab a few px in from the edge (pad), so the neighbour just past it is
  // clipped to a thin sliver, not fully gone; a strict fully-off test would
  // leave that sliver tab undockable and effectively invisible. Because the tab
  // and the scroller shift together as a dock grows, these tests are independent
  // of the dock widths — no feedback loop. Leading and trailing counts can never
  // overlap: trailing is clamped to the tabs not already counted as leading.
  function recomputeCollapsedDefaults() {
    const zone = defaultZoneRef.current;
    const scroller = zone?.parentElement;
    if (!zone || !scroller) return;
    const rect = scroller.getBoundingClientRect();
    const mainLeft = rect.left;
    const mainRight = rect.right;
    const children = [...zone.children] as HTMLElement[];
    let leading = 0;
    for (const child of children) {
      const c = child.getBoundingClientRect();
      // width of this tab still visible inside the viewport's left edge
      if (c.right - mainLeft < c.width / 2) {
        leading++;
      } else {
        break;
      }
    }
    let trailing = 0;
    for (let i = children.length - 1; i >= 0; i--) {
      const c = children[i].getBoundingClientRect();
      // width of this tab still visible inside the viewport's right edge
      if (mainRight - c.left < c.width / 2) {
        trailing++;
      } else {
        break;
      }
    }
    trailing = Math.min(trailing, children.length - leading);
    if (
      leading !== collapsedLeadingCountRef.current ||
      trailing !== collapsedTrailingCountRef.current
    ) {
      pendingDockLayoutCompensationRef.current = {
        scroller,
        left: mainLeft
      };
    }
    setCollapsedLeadingCount((prev) => (prev === leading ? prev : leading));
    setCollapsedTrailingCount((prev) => (prev === trailing ? prev : trailing));
  }

  function renderAudioMuteButton(tab: NavTabDescriptor) {
    if (!tab.buildAppId || !onToggleAudioMuted) return null;
    const muted = tab.audioMuted === true;
    return (
      <button
        type="button"
        className={`${tabActionButtonClass} ${audioMuteButtonClass}`}
        data-tab-audio="true"
        data-muted={muted ? 'true' : 'false'}
        aria-label={muted ? 'Unmute app' : 'Mute app'}
        title={muted ? 'Unmute app' : 'Mute app'}
        onPointerDown={handleTabActionPointerDown}
        onClick={(event) => handleAudioMuteClick(event, tab.buildAppId!)}
        onContextMenu={handleTabActionContextMenu}
      >
        <Icon icon={muted ? 'volume-mute' : 'volume'} />
      </button>
    );
  }

  function renderCloseTabButton(tab: NavTabDescriptor) {
    const label = typeof tab.label === 'string' ? tab.label : 'this';
    return (
      <button
        type="button"
        className={`${tabActionButtonClass} ${closeTabButtonClass}`}
        aria-label={`Close ${label} tab`}
        title="Close tab"
        onPointerDown={handleTabActionPointerDown}
        onClick={(event) => handleCloseTabClick(event, tab.key)}
        onContextMenu={handleTabActionContextMenu}
      >
        <Icon icon="times" />
      </button>
    );
  }

  function handleTabActionPointerDown(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    // The wrapper's click-capture guard remembers the previous drag/long
    // press. An affordance click is a fresh gesture, so clear those flags
    // before capture runs or the first close/mute click after a drag is lost.
    didDragRef.current = false;
    didLongPressRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function handleAudioMuteClick(
    event: React.MouseEvent<HTMLButtonElement>,
    buildAppId: string
  ) {
    event.preventDefault();
    event.stopPropagation();
    onToggleAudioMuted?.(buildAppId);
  }

  function handleCloseTabClick(
    event: React.MouseEvent<HTMLButtonElement>,
    key: string
  ) {
    event.preventDefault();
    event.stopPropagation();
    onCloseTab?.(key);
  }

  function handleTabActionContextMenu(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
  }

  function getTabStyle(
    index: number,
    key: string,
    zone: DragZone
  ): React.CSSProperties | undefined {
    // only the zone that owns the active drag animates; the other zone's tabs
    // stay put so the two blocks never visually bleed into each other
    if (!dragState || dragState.zone !== zone) return undefined;
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
    event.preventDefault();
    openTabMenu(event.clientX, event.clientY, key);
  }

  function openTabMenu(x: number, y: number, key: string) {
    const items = menuItemsForTab?.(key);
    if (!items || items.length === 0) return;
    handleHintDismiss();
    setMenu({ x, y, tabKey: key });
    onMenuOpen?.();
  }

  // Capture the geometry a drag needs (tab rects + how far the tab may travel
  // inside its zone) and mark the pending drag. Shared by mouse-down and the
  // touch long-press-then-drag path. Returns false if the zone isn't ready.
  function prepareDrag(
    zone: DragZone,
    index: number,
    key: string,
    startClientX: number
  ) {
    const zoneEl =
      zone === 'pinned'
        ? pinnedZoneRef.current
        : zone === 'default'
          ? defaultZoneRef.current
          : dragZoneRef.current;
    if (dragStateRef.current || !zoneEl) return false;
    const items = [...zoneEl.children] as HTMLElement[];
    rectsRef.current = items.map((el) => {
      const { left, width } = el.getBoundingClientRect();
      return { left, width, center: left + width / 2 };
    });
    const zoneRect = zoneEl.getBoundingClientRect();
    const tabRect = rectsRef.current[index];
    if (!tabRect) return false;
    boundsRef.current = {
      minDX: zoneRect.left - tabRect.left,
      maxDX: zoneRect.right - (tabRect.left + tabRect.width)
    };
    pendingRef.current = { key, zone, index, startX: startClientX };
    return true;
  }

  // Touch has no right-click or mouse-drag. A long-press (finger held still)
  // ARMS the tab; from there a move reorders (draggable tabs only) and a lift
  // opens the menu. A real move BEFORE the arm is a scroll and bails out.
  function startTouchGesture(
    event: React.PointerEvent,
    key: string,
    dragInfo: { index: number; zone: DragZone } | null
  ) {
    if (event.pointerType !== 'touch') return;
    const startX = event.clientX;
    const startY = event.clientY;
    endTouchGesture();
    handleHintDismiss();
    const gesture = { armed: false };
    touchGestureRef.current = gesture;

    function movedFar(e: PointerEvent) {
      return (
        Math.abs(e.clientX - startX) > LONGPRESS_MOVE_CANCEL_PX ||
        Math.abs(e.clientY - startY) > LONGPRESS_MOVE_CANCEL_PX
      );
    }
    function onPointerMove(e: PointerEvent) {
      if (touchGestureRef.current !== gesture) return;
      if (!gesture.armed) {
        if (movedFar(e)) endTouchGesture(); // scroll before arm
        return;
      }
      if (dragInfo) {
        handleDragPointerMove(e); // armed + draggable → reorder
      } else if (movedFar(e)) {
        endTouchGesture(); // armed pinned tab, finger moved → let it scroll
      }
    }
    // non-passive: once armed on a draggable tab we must stop the browser from
    // scrolling the strip so the tab can follow the finger instead
    function onTouchMoveNative(e: TouchEvent) {
      if (touchGestureRef.current === gesture && gesture.armed && dragInfo) {
        e.preventDefault();
      }
    }
    function onPointerUp() {
      if (touchGestureRef.current !== gesture) return;
      const ds = dragStateRef.current;
      if (ds && !ds.settling) {
        touchGestureRef.current = null; // hand cleanup off to the settle
        settleThenCommit(ds);
        return;
      }
      if (gesture.armed) {
        didLongPressRef.current = true; // suppress the tap-nav on lift
        openTabMenu(startX, startY, key);
      }
      endTouchGesture();
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    // reuse windowDragCleanupRef so the shared settle/cleanup path tears these
    // listeners down too (mouse and touch never run a gesture concurrently)
    windowDragCleanupRef.current = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('touchmove', onTouchMoveNative);
      windowDragCleanupRef.current = null;
    };

    longPressTimerRef.current = setTimeout(() => {
      if (touchGestureRef.current !== gesture) return;
      gesture.armed = true;
      if (dragInfo) {
        prepareDrag(dragInfo.zone, dragInfo.index, key, startX);
      }
    }, LONGPRESS_MENU_MS);
  }

  function endTouchGesture() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchGestureRef.current = null;
    windowDragCleanupRef.current?.();
  }

  function handleHintDwellStart(key: string, target: HTMLElement) {
    if (!showMenuHint || hintShownThisSessionRef.current) return;
    if (dragState || menu) return;
    hintAnchorElRef.current = target;
    if (hintDwellTimerRef.current) {
      clearTimeout(hintDwellTimerRef.current);
    }
    hintDwellTimerRef.current = setTimeout(() => {
      // only teach once per page load; the flag prop retires it for good
      hintShownThisSessionRef.current = true;
      const el = hintAnchorElRef.current;
      if (!el) return;
      setHintAnchor({ key, rect: el.getBoundingClientRect() });
      hintHideTimerRef.current = setTimeout(
        () => setHintAnchor(null),
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
    setHintAnchor(null);
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    key: string,
    index: number,
    zone: DragZone
  ) {
    if (event.button > 0) return;
    // A fresh press starts a fresh gesture. In particular, an outside tap can
    // dismiss a long-press menu before WebKit delivers the suppressed click;
    // the next primary-tab press must not inherit that stale suppression.
    didDragRef.current = false;
    didLongPressRef.current = false;
    if (zone === 'default') return;
    if (event.pointerType === 'touch') {
      // All configurable tabs retain their long-press menu, but only pinned
      // tabs arm a drag after the hold.
      startTouchGesture(event, key, zone === 'pinned' ? { index, zone } : null);
      return;
    }
    if (zone !== 'pinned') return;
    if (event.pointerType !== 'mouse') return;
    if (!prepareDrag(zone, index, key, event.clientX)) return;
    handleHintDismiss();
    // Drive the whole drag from window, NOT the tab node: the header
    // re-renders constantly (chat/noti/todayStats), and pointer capture on the
    // tab would be lost the instant React reconciles the node during a drag,
    // stranding dragState and freezing the strip. window listeners settle the
    // drag regardless of what happens to the element.
    addWindowDragListeners();
  }

  function addWindowDragListeners() {
    windowDragCleanupRef.current?.();
    const onMovePointer = (e: PointerEvent) => handleDragPointerMove(e);
    const onUpPointer = () => handleDragPointerUp();
    const onCancelPointer = () => handleDragPointerCancel();
    window.addEventListener('pointermove', onMovePointer);
    window.addEventListener('pointerup', onUpPointer);
    window.addEventListener('pointercancel', onCancelPointer);
    windowDragCleanupRef.current = () => {
      window.removeEventListener('pointermove', onMovePointer);
      window.removeEventListener('pointerup', onUpPointer);
      window.removeEventListener('pointercancel', onCancelPointer);
      windowDragCleanupRef.current = null;
    };
  }

  function handleDragPointerMove(event: PointerEvent) {
    const pending = pendingRef.current;
    if (!pending || dragStateRef.current?.settling) return;
    if (!(event.buttons & 1)) {
      // The mouse button was released without our window pointerup handler
      // seeing it. If a drag already started, settle it; otherwise abandon the
      // pending gesture and clear the click-suppression flag.
      const ds = dragStateRef.current;
      if (ds) {
        settleThenCommit(ds);
        return;
      }
      pendingRef.current = null;
      didDragRef.current = false;
      windowDragCleanupRef.current?.();
      return;
    }
    const rawDX = event.clientX - pending.startX;
    if (!dragStateRef.current && Math.abs(rawDX) < DRAG_THRESHOLD_PX) return;
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
    setLiveDragState({
      key: pending.key,
      zone: pending.zone,
      fromIndex: pending.index,
      toIndex,
      dx,
      settling: false
    });
  }

  function handleDragPointerUp() {
    const pending = pendingRef.current;
    const ds = dragStateRef.current;
    if (!pending || !ds || ds.settling) {
      pendingRef.current = null;
      if (!ds) {
        didDragRef.current = false;
      }
      windowDragCleanupRef.current?.();
      return;
    }
    settleThenCommit(ds);
  }

  function handleDragPointerCancel() {
    const ds = dragStateRef.current;
    if (ds && !ds.settling) {
      settleThenCommit({ ...ds, toIndex: ds.fromIndex });
      return;
    }
    pendingRef.current = null;
    didDragRef.current = false;
    windowDragCleanupRef.current?.();
  }

  function settleThenCommit(state: DragState) {
    const { fromIndex, toIndex } = state;
    const zoneTabs =
      state.zone === 'pinned'
        ? pinnedTabsRef.current
        : state.zone === 'default'
          ? defaultTabsRef.current
          : tabsRef.current;
    const targetTab = zoneTabs[toIndex];
    setLiveDragState({
      ...state,
      dx: computeSettleDX(fromIndex, toIndex),
      settling: true
    });
    settleTimerRef.current = setTimeout(() => {
      if (state.zone === 'pinned' && toIndex !== fromIndex && targetTab) {
        onMovePinnedRef.current({
          sourceKey: state.key,
          targetKey: targetTab.key
        });
      }
      pendingRef.current = null;
      didDragRef.current = false;
      windowDragCleanupRef.current?.();
      setLiveDragState(null);
    }, SETTLE_MS + 20);
  }

  function setLiveDragState(nextDragState: DragState | null) {
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
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
    // suppress the navigation click that follows a real drag OR a long-press
    // that opened the menu. Consume the flags so suppression is one-shot even
    // if a browser produces an unusual follow-up click sequence.
    if (!didDragRef.current && !didLongPressRef.current) return;
    didDragRef.current = false;
    didLongPressRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }
}
