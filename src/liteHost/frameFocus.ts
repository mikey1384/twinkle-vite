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

  function focusLost() {
    const active = document.activeElement;
    return !active || active === document.body || active === document.documentElement;
  }

  function canTake({ fromGesture = false } = {}) {
    if (disposed || !frame.isConnected) return false;
    if (document.visibilityState === 'hidden') return false;
    if (!fromGesture && isTouchOnly()) return false;
    if (hostOverlayOpen()) return false;
    const active = document.activeElement;
    if (active === frame) return false;
    if (isHostTextEntry(active)) return false;
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
  function schedule(options?: { onlyIfLost?: boolean }) {
    if (scheduled !== null) window.clearTimeout(scheduled);
    scheduled = window.setTimeout(() => {
      scheduled = null;
      if (options?.onlyIfLost && !focusLost()) return;
      focusApp();
    }, 0);
  }

  const onLoad = () => schedule();
  const onVisible = () => {
    if (document.visibilityState === 'visible') schedule();
  };
  const onWindowFocus = () => schedule();
  // A press on the page itself (around the frame, under a closed sheet):
  // the player means the app.
  const onPointerDown = (event: PointerEvent) => {
    const target = event.target;
    if (target !== document.body && target !== document.documentElement && target !== frame) {
      return;
    }
    window.setTimeout(() => focusApp({ fromGesture: true }), 0);
  };
  // A click on our UI that opened nothing (a banner's ✕, the toast) leaves
  // focus on that button or, once it is gone, nowhere: back to the app. A
  // click that opened a sheet or the menu leaves it to them.
  const onClick = (event: MouseEvent) => {
    const target = event.target as Element | null;
    if (!target || isHostTextEntry(target)) return;
    window.setTimeout(() => {
      const active = document.activeElement;
      if (focusLost() || (active && active.tagName === 'BUTTON' && !active.closest('.lh-backdrop, .lh-pop-layer'))) {
        focusApp({ fromGesture: true });
      }
    }, 0);
  };
  // Our overlays come and go as body children (sheets, the menu layer, the
  // banner, the hint) and inside #modal (Twinkle's boxes): when one goes and
  // focus went with it, the app gets it back.
  const observer =
    typeof MutationObserver === 'function'
      ? new MutationObserver((records) => {
          if (!records.some((record) => record.removedNodes.length > 0)) return;
          // Right away (a microtask after the removal), so a key pressed
          // just after the click already reaches the app; again after the
          // browser has settled focus.
          if (focusLost()) focusApp();
          schedule({ onlyIfLost: true });
        })
      : null;
  const observeModalRoot = () => {
    const modal = document.getElementById('modal');
    if (modal) observer?.observe(modal, { childList: true });
  };
  observer?.observe(document.body, { childList: true });
  observeModalRoot();
  // #modal may be added after this runs (main.tsx appends it).
  const bodyWatcher =
    typeof MutationObserver === 'function'
      ? new MutationObserver(() => observeModalRoot())
      : null;
  bodyWatcher?.observe(document.body, { childList: true });

  // Last resort: a key pressed on this page while nothing of ours wants it
  // (focus got here some other way) sends the next ones to the app. This
  // one key is not forwarded: the app can't be handed a trusted key press.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) return;
    const active = document.activeElement;
    if (!focusLost() && !(active && active.tagName === 'BUTTON' && !active.closest('.lh-backdrop, .lh-pop-layer'))) {
      return;
    }
    // Tab, Enter and Space on one of our buttons keep their meaning.
    if (!focusLost() && (event.key === 'Tab' || event.key === 'Enter' || event.key === ' ')) return;
    focusApp({ fromGesture: true });
  };

  frame.addEventListener('load', onLoad);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onWindowFocus);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('click', onClick, true);

  return {
    focusApp: () => focusApp({ fromGesture: true }),
    dispose() {
      disposed = true;
      if (scheduled !== null) window.clearTimeout(scheduled);
      observer?.disconnect();
      bodyWatcher?.disconnect();
      frame.removeEventListener('load', onLoad);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick, true);
    }
  };
}
