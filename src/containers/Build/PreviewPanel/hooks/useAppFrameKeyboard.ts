import { useEffect, useRef, type RefObject } from 'react';
import type { PreviewFrameMeta } from '../types';
import { getBuildPreviewMessageTargetOrigin } from '~/helpers/buildPreviewOriginHelpers';
import {
  APP_FRAME_KEYBOARD_RESTORE_DELAYS_MS,
  CLOSED_APP_FRAME_KEYBOARD,
  appFrameKeyboardStatesEqual,
  calculateAppFrameKeyboard,
  getDriftedScrollPositions,
  type AppFrameKeyboardState,
  type SavedScrollPosition
} from '../helpers/appFrameKeyboard';

type PreviewFrameKey = 'primary' | 'secondary';
type ScrollTarget = Window | Element;

interface KeyboardSession {
  frame: PreviewFrameKey;
  frameWindow: Window;
  // This window, then each same-origin parent up to the outermost Twinkle
  // window (an app embedded in a feed runs inside the /app page's frame);
  // the outermost one is where the phone keyboard pans and shifts the page.
  hostWindows: Window[];
  saved: SavedScrollPosition<ScrollTarget>[];
  keyboardOpen: boolean;
  keyboardSeen: boolean;
  userScrolled: boolean;
  detach: () => void;
}

/**
 * The phone keyboard for text fields inside a Build app frame.
 *
 * The app's SDK reports when one of its text fields has focus
 * (keyboard:focus); the host cannot see into the sandboxed frame. While it
 * does, the host measures how much of the frame the keyboard covers and sends
 * it to the app (keyboard:update → Twinkle.preview layout.keyboard), so a game
 * can lift its compose bar. When the keyboard goes away, iOS can leave the
 * host page scrolled or its visual viewport panned, and taps then land offset
 * from what is drawn until the keyboard is opened again; the host puts back
 * the scroll positions the browser moved while the keyboard was up. It never
 * fights the member: any host scroll gesture during the session (or a pinch
 * zoom) leaves the page where it is.
 */
export default function useAppFrameKeyboard({
  activePreviewFrame,
  previewFrameMetaRef,
  previewFrameSources,
  primaryIframeRef,
  secondaryIframeRef
}: {
  activePreviewFrame: PreviewFrameKey;
  previewFrameMetaRef: RefObject<{
    primary: PreviewFrameMeta;
    secondary: PreviewFrameMeta;
  }>;
  previewFrameSources: {
    primary: string | null;
    secondary: string | null;
  };
  primaryIframeRef: RefObject<HTMLIFrameElement | null>;
  secondaryIframeRef: RefObject<HTMLIFrameElement | null>;
}) {
  const sessionRef = useRef<KeyboardSession | null>(null);
  const editingRef = useRef(false);
  const sentRef = useRef<{
    frameWindow: Window;
    state: AppFrameKeyboardState;
  } | null>(null);
  const measureFrameRef = useRef<number | null>(null);
  const restoreTimersRef = useRef<number[]>([]);
  const handlerRef = useRef(handleAppTextEntry);
  handlerRef.current = handleAppTextEntry;
  const stableHandlerRef = useRef((editing: boolean, sourceWindow: Window) =>
    handlerRef.current(editing, sourceWindow)
  );

  useEffect(() => {
    // The frame that had the keyboard was replaced or put away: its keyboard
    // is gone with it, so close and restore as if the field lost focus.
    const session = sessionRef.current;
    if (!session) return;
    const activeIframe =
      activePreviewFrame === 'primary'
        ? primaryIframeRef.current
        : secondaryIframeRef.current;
    if (activeIframe?.contentWindow !== session.frameWindow) {
      handlerRef.current(false, session.frameWindow);
    }
  }, [
    activePreviewFrame,
    previewFrameSources.primary,
    previewFrameSources.secondary,
    primaryIframeRef,
    secondaryIframeRef
  ]);

  useEffect(() => {
    return () => {
      endSession();
    };
    // Unmount only; endSession reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return stableHandlerRef.current;

  function handleAppTextEntry(editing: boolean, sourceWindow: Window) {
    const frame = getFrameKeyForWindow(sourceWindow);
    const session = sessionRef.current;
    if (editing) {
      if (!frame) return;
      if (!session || session.frameWindow !== sourceWindow) {
        if (session) endSession();
        startSession(frame, sourceWindow);
      }
      editingRef.current = true;
      clearRestoreTimers();
      scheduleMeasure();
      return;
    }
    if (!session || session.frameWindow !== sourceWindow) return;
    editingRef.current = false;
    scheduleMeasure();
    scheduleRestore();
  }

  function startSession(frame: PreviewFrameKey, frameWindow: Window) {
    const hostWindows = getHostWindows();
    const iframe = getIframe(frame);
    const session: KeyboardSession = {
      frame,
      frameWindow,
      hostWindows,
      saved: iframe ? snapshotScrollPositions(iframe, hostWindows) : [],
      keyboardOpen: false,
      keyboardSeen: false,
      userScrolled: false,
      detach: () => {}
    };
    const outermost = hostWindows[hostWindows.length - 1];
    const visualViewport = outermost.visualViewport;
    const noteUserScroll = () => {
      session.userScrolled = true;
    };
    visualViewport?.addEventListener('resize', scheduleMeasure);
    visualViewport?.addEventListener('scroll', scheduleMeasure);
    for (const hostWindow of hostWindows) {
      hostWindow.addEventListener('resize', scheduleMeasure);
      // Capture: a scrolling feed or container moves the frame too.
      hostWindow.addEventListener('scroll', scheduleMeasure, true);
      // Touches inside the app never reach these windows, so a drag or wheel
      // here is the member scrolling the page itself.
      hostWindow.addEventListener('touchmove', noteUserScroll, {
        capture: true,
        passive: true
      });
      hostWindow.addEventListener('wheel', noteUserScroll, {
        capture: true,
        passive: true
      });
    }
    session.detach = () => {
      visualViewport?.removeEventListener('resize', scheduleMeasure);
      visualViewport?.removeEventListener('scroll', scheduleMeasure);
      for (const hostWindow of hostWindows) {
        hostWindow.removeEventListener('resize', scheduleMeasure);
        hostWindow.removeEventListener('scroll', scheduleMeasure, true);
        hostWindow.removeEventListener('touchmove', noteUserScroll, true);
        hostWindow.removeEventListener('wheel', noteUserScroll, true);
      }
    };
    sessionRef.current = session;
  }

  function endSession() {
    clearRestoreTimers();
    if (measureFrameRef.current !== null) {
      window.cancelAnimationFrame(measureFrameRef.current);
      measureFrameRef.current = null;
    }
    sessionRef.current?.detach();
    sessionRef.current = null;
    editingRef.current = false;
  }

  function scheduleMeasure() {
    if (measureFrameRef.current !== null) return;
    measureFrameRef.current = window.requestAnimationFrame(() => {
      measureFrameRef.current = null;
      measureAndSend();
    });
  }

  function measureAndSend() {
    const session = sessionRef.current;
    if (!session) return;
    const state = measureKeyboard(session);
    const wasOpen = session.keyboardOpen;
    session.keyboardOpen = state.open;
    if (state.open) {
      session.keyboardSeen = true;
    } else if (wasOpen && editingRef.current) {
      // The keyboard went away while the field kept focus (iPad hide-keyboard
      // key, Android back): restore now, not when focus leaves.
      scheduleRestore();
    }
    sendKeyboardState(session, state);
  }

  function measureKeyboard(session: KeyboardSession): AppFrameKeyboardState {
    try {
      const iframe = getIframe(session.frame);
      if (!iframe || iframe.contentWindow !== session.frameWindow) {
        return CLOSED_APP_FRAME_KEYBOARD;
      }
      const outermost = session.hostWindows[session.hostWindows.length - 1];
      const visualViewport = outermost.visualViewport;
      if (!visualViewport) return CLOSED_APP_FRAME_KEYBOARD;
      const rect = getFrameRectInOutermostWindow(iframe, session.hostWindows);
      return calculateAppFrameKeyboard({
        editing: editingRef.current,
        layoutHeight: outermost.document.documentElement.clientHeight,
        visualViewportHeight: visualViewport.height,
        visualViewportOffsetTop: visualViewport.offsetTop,
        visualViewportScale: visualViewport.scale,
        frameTop: rect.top,
        frameBottom: rect.bottom,
        frameCssHeight: iframe.clientHeight
      });
    } catch {
      return CLOSED_APP_FRAME_KEYBOARD;
    }
  }

  function sendKeyboardState(
    session: KeyboardSession,
    state: AppFrameKeyboardState
  ) {
    const sent = sentRef.current;
    if (
      sent &&
      sent.frameWindow === session.frameWindow &&
      appFrameKeyboardStatesEqual(sent.state, state)
    ) {
      return;
    }
    const iframe = getIframe(session.frame);
    const frameMeta = previewFrameMetaRef.current?.[session.frame];
    if (
      !iframe ||
      iframe.contentWindow !== session.frameWindow ||
      !frameMeta?.bridgeConfirmed ||
      !frameMeta.messageNonce
    ) {
      return;
    }
    session.frameWindow.postMessage(
      {
        source: 'twinkle-parent',
        type: 'keyboard:update',
        previewNonce: frameMeta.messageNonce,
        payload: { open: state.open, height: state.height }
      },
      getBuildPreviewMessageTargetOrigin(
        iframe.getAttribute('src') || iframe.src
      )
    );
    sentRef.current = { frameWindow: session.frameWindow, state };
  }

  function scheduleRestore() {
    clearRestoreTimers();
    const lastIndex = APP_FRAME_KEYBOARD_RESTORE_DELAYS_MS.length - 1;
    restoreTimersRef.current = APP_FRAME_KEYBOARD_RESTORE_DELAYS_MS.map(
      (delay, index) =>
        window.setTimeout(() => attemptRestore(index === lastIndex), delay)
    );
  }

  function clearRestoreTimers() {
    for (const timer of restoreTimersRef.current) window.clearTimeout(timer);
    restoreTimersRef.current = [];
  }

  function attemptRestore(isLast: boolean) {
    const session = sessionRef.current;
    if (!session) return;
    const editing = editingRef.current;
    // The keyboard came back up (focus moved to another field): it is not
    // closed, so nothing to restore yet.
    if (editing && measureKeyboard(session).open) return;
    if (!session.userScrolled && session.keyboardSeen) {
      restoreScrollPositions(session);
    }
    if (!isLast) return;
    if (!editing) {
      endSession();
      return;
    }
    // Field still focused with the keyboard down: the next keyboard opening
    // starts from where the page is now.
    const iframe = getIframe(session.frame);
    session.saved = iframe
      ? snapshotScrollPositions(iframe, session.hostWindows)
      : [];
    session.keyboardSeen = false;
    session.userScrolled = false;
  }

  function restoreScrollPositions(session: KeyboardSession) {
    try {
      const outermost = session.hostWindows[session.hostWindows.length - 1];
      const visualViewport = outermost.visualViewport;
      // Never fight a pinch zoom.
      if (
        visualViewport &&
        Math.abs((visualViewport.scale || 1) - 1) > 0.01
      ) {
        return;
      }
      const drifted = getDriftedScrollPositions(
        session.saved,
        readScrollPosition
      );
      for (const position of drifted) {
        writeScrollPosition(position);
      }
      // iOS can leave the visual viewport panned with no scroll offset to
      // show for it; scrolling the outermost window to its own position
      // brings the viewport back with it.
      if (
        visualViewport &&
        visualViewport.offsetTop > 1 &&
        !drifted.some((position) => position.target === outermost)
      ) {
        const saved = session.saved.find(
          (position) => position.target === outermost
        );
        if (saved) outermost.scrollTo(saved.left, saved.top);
      }
    } catch {
      // A parent frame that stopped being reachable keeps its position.
    }
  }

  function getIframe(frame: PreviewFrameKey) {
    return frame === 'primary'
      ? primaryIframeRef.current
      : secondaryIframeRef.current;
  }

  function getFrameKeyForWindow(sourceWindow: Window): PreviewFrameKey | null {
    if (primaryIframeRef.current?.contentWindow === sourceWindow) {
      return 'primary';
    }
    if (secondaryIframeRef.current?.contentWindow === sourceWindow) {
      return 'secondary';
    }
    return null;
  }
}

function getHostWindows() {
  const hostWindows: Window[] = [window];
  let current: Window = window;
  while (current.parent && current.parent !== current) {
    try {
      // A cross-origin parent throws here (and has no frameElement for us).
      if (!current.frameElement || !current.parent.document) break;
    } catch {
      break;
    }
    current = current.parent;
    hostWindows.push(current);
  }
  return hostWindows;
}

function getFrameRectInOutermostWindow(
  iframe: HTMLIFrameElement,
  hostWindows: Window[]
) {
  const rect = iframe.getBoundingClientRect();
  let top = rect.top;
  let bottom = rect.bottom;
  for (let index = 0; index < hostWindows.length - 1; index += 1) {
    const frameElement = hostWindows[index].frameElement as HTMLElement | null;
    if (!frameElement) break;
    const offset =
      frameElement.getBoundingClientRect().top + (frameElement.clientTop || 0);
    top += offset;
    bottom += offset;
  }
  return { top, bottom };
}

// Every window up the chain, and every element around the app frame (and
// around each Twinkle frame above it): the keyboard's reveal scroll can move
// any of them, even an overflow:hidden container.
function snapshotScrollPositions(
  iframe: HTMLIFrameElement,
  hostWindows: Window[]
) {
  const saved: SavedScrollPosition<ScrollTarget>[] = [];
  let element: Element | null = iframe;
  for (let index = 0; index < hostWindows.length; index += 1) {
    const hostWindow = hostWindows[index];
    const root = hostWindow.document.documentElement;
    const body = hostWindow.document.body;
    for (
      let cursor = element?.parentElement || null;
      cursor && cursor !== root && cursor !== body;
      cursor = cursor.parentElement
    ) {
      saved.push({
        target: cursor,
        left: cursor.scrollLeft,
        top: cursor.scrollTop
      });
    }
    saved.push({
      target: hostWindow,
      left: hostWindow.scrollX,
      top: hostWindow.scrollY
    });
    element = hostWindow.frameElement;
  }
  return saved;
}

function isWindowTarget(target: ScrollTarget): target is Window {
  // Windows from other same-origin frames fail instanceof Window here.
  return (target as Window).window === target;
}

function readScrollPosition(target: ScrollTarget) {
  if (isWindowTarget(target)) {
    return { left: target.scrollX, top: target.scrollY };
  }
  if (!target.isConnected) return null;
  return { left: target.scrollLeft, top: target.scrollTop };
}

function writeScrollPosition(position: SavedScrollPosition<ScrollTarget>) {
  const { target, left, top } = position;
  if (isWindowTarget(target)) {
    target.scrollTo(left, top);
    return;
  }
  target.scrollLeft = left;
  target.scrollTop = top;
}
