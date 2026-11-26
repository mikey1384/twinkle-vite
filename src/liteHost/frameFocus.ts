// Keys belong to the app. On the lite host the app is a cross-origin frame
// filling the page, and the browser sends key presses to whichever document
// has focus: once focus sits on this top page (the AI banner's ✕ removed
// under the pointer, the ✦ menu handing focus back to its button, a sheet
// closing, the page coming back from another tab), the app hears nothing
// until the player clicks inside it (Mikey 11-26: Red Square's keys dead
// after its pause card). So focus goes back into the frame whenever nothing
// of ours needs it:
// - when the frame loads, the tab comes back or the window regains focus;
// - when a sheet, menu, banner or Twinkle box closes (or the element that
//   had focus is gone);
// - on a press on the page itself outside our UI.
// Never while one of our overlays is open or the player types in one of our
// text fields. On a touch-only device there is no keyboard to route, and a
// focus call could bring up the on-screen keyboard for a field inside the
// app, so only a tap on the page itself refocuses there.

const TEXT_INPUT_TYPES = new Set([
  '',
  'text',
  'search',
  'email',
  'password',
  'tel',
  'url',
  'number',
  'date',
  'datetime-local',
  'month',
  'week',
  'time'
]);

const IGNORED_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'AltGraph',
  'Meta',
  'OS',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'Insert',
  'Tab',
  'Escape',
  'Home',
  'End',
  'PageUp',
  'PageDown'
]);

function isIgnoredKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  if (IGNORED_KEYS.has(event.key)) return true;
  return /^F\d{1,2}$/.test(event.key);
}

/** A field of ours the player types into (keys stay with it). */
export function isHostTextEntry(node: Element | null | undefined) {
  if (!node) return false;
  const element = node as HTMLElement;
  if (element.isContentEditable) return true;
  const tag = element.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;
  return TEXT_INPUT_TYPES.has(
    String((element as HTMLInputElement).type || '').toLowerCase()
  );
}

/** One of our overlays owns keys and focus right now. */
export function hostOverlayOpen(doc: Document = document) {
  if (doc.querySelector('.lh-backdrop, .lh-pop-layer:not([inert])')) return true;
  const modal = doc.getElementById('modal');
  return Boolean(modal && modal.childElementCount > 0);
}

function touchOnly() {
  try {
    return window.matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? false;
  } catch {
    return false;
  }
}

export interface FrameFocusKeeper {
  /** Give the keys back to the app, unless something of ours needs them. */
  focusApp: () => void;
  dispose: () => void;
}

export function installFrameFocusKeeper(
  frame: HTMLIFrameElement,
  { isTouchOnly = touchOnly }: { isTouchOnly?: () => boolean } = {}
): FrameFocusKeeper {
  let disposed = false;
  let scheduled: number | null = null;
  let scheduledFromGesture = false;

  function focusLost() {
    const active = document.activeElement;
    if (!active || active === document.body || active === document.documentElement) {
      return true;
    }
    if (active.isConnected === false) return true;
    if (typeof active.closest === 'function' && active.closest('[inert]')) return true;
    return false;
  }

  // Re-focusing the iframe when it is already activeElement is harmless and
  // required to hand focus into a newly loaded (or unfocused) inner document.
  function focusEligibleForFrame() {
    return document.activeElement === frame || focusLost();
  }

  function canTake({ fromGesture = false } = {}) {
    if (disposed || !frame.isConnected) return false;
    if (document.visibilityState === 'hidden') return false;
    if (!fromGesture && isTouchOnly()) return false;
    if (hostOverlayOpen()) return false;
    const active = document.activeElement;
    if (isHostTextEntry(active)) return false;
    if (!fromGesture && !focusEligibleForFrame()) return false;
    return true;
  }

  function focusFrame() {
    try {
      frame.focus({ preventScroll: true });
    } catch {
      frame.focus();
    }
  }

  function focusApp({ fromGesture = false } = {}) {
    if (canTake({ fromGesture })) focusFrame();
  }

  // After the browser has settled focus (a removed element, a closed sheet,
  // a window that just came back), on the next task.
  function schedule({ fromGesture = false } = {}) {
    const nextFromGesture = fromGesture || (scheduled !== null && scheduledFromGesture);
    if (scheduled !== null) window.clearTimeout(scheduled);
    scheduledFromGesture = nextFromGesture;
    scheduled = window.setTimeout(() => {
      const gesture = scheduledFromGesture;
      scheduled = null;
      scheduledFromGesture = false;
      focusApp({ fromGesture: gesture });
    }, 0);
  }

  const onLoad = () => schedule();
  const onVisible = () => {
    if (document.visibilityState === 'visible') schedule();
  };
  const onWindowFocus = () => schedule();
  // A press on the page itself (around the frame, under a closed sheet):
  // the player means the app. On touch-only devices this is the only gesture
  // that focuses the frame.
  const onPointerDown = (event: PointerEvent) => {
    if (event.isTrusted === false) return;
    const target = event.target;
    if (target !== document.body && target !== document.documentElement && target !== frame) {
      return;
    }
    schedule({ fromGesture: true });
  };
  // A click on our UI that removed the element (a banner's ✕) or landed on
  // non-focusable chrome (a toast) leaves focus on body: back to the app on
  // desktop, never stealing focus from a host control or firing on touch-only.
  const onClick = (event: MouseEvent) => {
    if (event.isTrusted === false) return;
    const target = event.target as Element | null;
    if (!target || isHostTextEntry(target)) return;
    schedule();
  };
  // Our overlays come and go as body children (sheets, the menu layer, the
  // banner, the hint), inside #modal (Twinkle's boxes) and inside
  // #lumine-host-root (AppAccountSheet): when one goes and focus went with
  // it, the app gets it back.
  const observer =
    typeof MutationObserver === 'function'
      ? new MutationObserver((records) => {
          if (!records.some((record) => record.removedNodes.length > 0)) return;
          // Right away (a microtask after the removal), so a key pressed
          // just after the click already reaches the app; again after the
          // browser has settled focus.
          if (focusEligibleForFrame()) focusApp();
          schedule();
        })
      : null;
  const observedRoots = new WeakSet<Element>();
  const observeRoot = (id: string, subtree: boolean) => {
    const root = document.getElementById(id);
    if (root && !observedRoots.has(root)) {
      observedRoots.add(root);
      observer?.observe(root, subtree ? { childList: true, subtree: true } : { childList: true });
    }
  };
  const observeHostRoots = () => {
    observeRoot('modal', false);
    observeRoot('lumine-host-root', true);
  };
  observer?.observe(document.body, { childList: true });
  observeHostRoots();
  // #modal and #lumine-host-root may be added after this runs (main.tsx appends them).
  const bodyWatcher =
    typeof MutationObserver === 'function'
      ? new MutationObserver(() => observeHostRoots())
      : null;
  bodyWatcher?.observe(document.body, { childList: true });

  // Last resort: a key pressed on this page while focus is lost on
  // body/document (not on any host control) or on the iframe element without
  // inner-document focus sends the next ones to the app. Modifier, shortcut,
  // and navigation keys are never intercepted.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isTrusted === false || event.isComposing) return;
    if (!focusEligibleForFrame()) return;
    if (isIgnoredKey(event)) return;
    focusApp();
  };

  frame.addEventListener('load', onLoad);
  window.addEventListener('load', onLoad);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onWindowFocus);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('click', onClick, true);

  return {
    focusApp: () => focusApp(),
    dispose() {
      disposed = true;
      if (scheduled !== null) {
        window.clearTimeout(scheduled);
        scheduled = null;
        scheduledFromGesture = false;
      }
      observer?.disconnect();
      bodyWatcher?.disconnect();
      frame.removeEventListener('load', onLoad);
      window.removeEventListener('load', onLoad);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick, true);
    }
  };
}
