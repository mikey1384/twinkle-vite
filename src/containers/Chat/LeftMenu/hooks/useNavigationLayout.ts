import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { getStoredItem, setStoredItem } from '~/helpers/userDataHelpers';
import { SPLIT_NAVIGATION_MEDIA_QUERY } from '../../constants/layout';
import {
  DEFAULT_WIDTHS,
  MIN_WIDTHS,
  MIN_CONVERSATION_WIDTH,
  fitNavigationWidths,
  getPanelMaximum,
  readNavigationWidths,
  type NavigationPanel,
  type NavigationWidths
} from '../helpers/navigationSizing';

const STORAGE_KEY = 'twinkle:chat-navigation-widths';

export default function useNavigationLayout(hasContext: boolean) {
  const navigationRef = useRef<HTMLDivElement>(null);
  const dragCleanupRef = useRef<((restore: boolean) => void) | null>(null);
  const [preferredWidths, setPreferredWidths] = useState(() =>
    readNavigationWidths(getStoredItem(STORAGE_KEY))
  );
  const [geometry, setGeometry] = useState({
    availableWidth: 720,
    resizable: false,
    split: false
  });
  const [resizingPanel, setResizingPanel] = useState<NavigationPanel | null>(null);
  const widths = fitNavigationWidths(
    preferredWidths,
    geometry.availableWidth,
    geometry.split
  );
  const interactionWidths = geometry.split
    ? widths
    : { ...preferredWidths, channels: widths.channels };

  useEffect(() => {
    const navigation = navigationRef.current;
    const workspace = navigation?.closest<HTMLElement>('[data-chat-workspace]');
    if (!workspace) return;
    const details = workspace.querySelector<HTMLElement>('[data-chat-panel="details"]');

    function measure() {
      if (!workspace) return;
      const style = getComputedStyle(workspace);
      const detailsWidth = details?.getBoundingClientRect().width || 0;
      const gaps = (parseFloat(style.columnGap) || 0) * (details ? 2 : 1);
      const availableWidth = Math.floor(
        workspace.clientWidth -
        (parseFloat(style.paddingLeft) || 0) -
        (parseFloat(style.paddingRight) || 0) -
        detailsWidth - gaps - MIN_CONVERSATION_WIDTH - 2
      );
      const resizable = window.matchMedia('(min-width: 768px)').matches;
      const split = hasContext && window.matchMedia(SPLIT_NAVIGATION_MEDIA_QUERY).matches;
      setGeometry((previous) => {
        if (previous.availableWidth === availableWidth &&
            previous.resizable === resizable && previous.split === split) {
          return previous;
        }
        return { availableWidth, resizable, split };
      });
    }

    function handleViewportChange() {
      dragCleanupRef.current?.(true);
      measure();
    }

    const observer = new ResizeObserver(measure);
    observer.observe(workspace);
    if (details) observer.observe(details);
    window.addEventListener('resize', handleViewportChange);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleViewportChange);
      dragCleanupRef.current?.(true);
    };
  }, [hasContext]);

  const style = {
    '--chat-channel-width': `${widths.channels}px`,
    '--chat-context-width': `${widths.context}px`
  } as CSSProperties;

  return {
    navigationRef,
    style,
    widths,
    resizingPanel,
    resizable: geometry.resizable,
    split: geometry.split,
    getMaximum: (panel: NavigationPanel) => getPanelMaximum(
      panel, widths, geometry.availableWidth, geometry.split
    ),
    onPointerDown: handlePointerDown,
    onKeyDown: handleKeyDown,
    onReset: handleReset
  };

  function commitWidths(next: NavigationWidths) {
    setPreferredWidths(next);
    setStoredItem(STORAGE_KEY, JSON.stringify(next));
  }

  function getWidth(panel: NavigationPanel, requested: number) {
    return Math.round(Math.max(MIN_WIDTHS[panel], Math.min(
      getPanelMaximum(panel, widths, geometry.availableWidth, geometry.split),
      requested
    )));
  }

  function handleReset(panel: NavigationPanel) {
    commitWidths({ ...interactionWidths, [panel]: getWidth(panel, DEFAULT_WIDTHS[panel]) });
  }

  function handleKeyDown(panel: NavigationPanel, event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!geometry.resizable) return;
    const step = event.shiftKey ? 48 : 16;
    let requested: number;
    switch (event.key) {
      case 'ArrowLeft': requested = widths[panel] - step; break;
      case 'ArrowRight': requested = widths[panel] + step; break;
      case 'Home': requested = MIN_WIDTHS[panel]; break;
      case 'End': requested = Infinity; break;
      case 'Enter': handleReset(panel); event.preventDefault(); return;
      default: return;
    }
    event.preventDefault();
    commitWidths({ ...interactionWidths, [panel]: getWidth(panel, requested) });
  }

  function handlePointerDown(panel: NavigationPanel, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!geometry.resizable || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    dragCleanupRef.current?.(true);
    const handle = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startWidth = widths[panel];
    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    let latest = preferredWidths;
    let moved = false;
    handle.focus({ preventScroll: true });
    try {
      handle.setPointerCapture(pointerId);
    } catch {
      // Window listeners also cover browsers without pointer capture.
    }
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    setResizingPanel(panel);

    function cleanup() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancelPointer);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('keydown', escape);
      handle.removeEventListener('lostpointercapture', cancelPointer);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
      dragCleanupRef.current = null;
      try {
        handle.releasePointerCapture(pointerId);
      } catch {
        // Capture may already have been released by the browser.
      }
    }

    function move(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      moved = true;
      latest = { ...interactionWidths, [panel]: getWidth(panel, startWidth + moveEvent.clientX - startX) };
      setPreferredWidths(latest);
    }

    function finish(upEvent: PointerEvent) {
      if (upEvent.pointerId !== pointerId) return;
      cleanup();
      setResizingPanel(null);
      if (moved) commitWidths(latest);
    }

    function cancel() {
      cleanup();
      setResizingPanel(null);
      setPreferredWidths(preferredWidths);
    }

    function cancelPointer(cancelEvent: PointerEvent) {
      if (cancelEvent.pointerId === pointerId) cancel();
    }

    function escape(keyEvent: KeyboardEvent) {
      if (keyEvent.key !== 'Escape') return;
      keyEvent.preventDefault();
      cancel();
    }

    dragCleanupRef.current = (restore) => {
      if (restore) cancel();
      else cleanup();
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancelPointer);
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', escape);
    handle.addEventListener('lostpointercapture', cancelPointer);
  }
}
