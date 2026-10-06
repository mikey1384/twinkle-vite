// A touch tap opens a feed card on pointerup, but the browser still sends the
// tap's compatibility mouse events (mousedown, mouseup, click) a moment later
// at the same spot. By then the content page has replaced the feed, so that
// leftover tap lands on whatever is under the finger there: a Reply or comment
// button opens and focuses the reply box, and the phone scrolls it into view
// (Mikey, 2026-10-06: posts sometimes opened scrolled down to the target
// comment). Swallow that one leftover tap, and nothing else.

export const GHOST_TAP_WINDOW_MS = 700;
export const GHOST_TAP_RADIUS_PX = 40;
const GHOST_TAP_EVENTS = ['mousedown', 'mouseup', 'click'] as const;
// an options object, not a bare `true`: some EventTarget implementations
// (Node's) only match the removal that way
const CAPTURE = { capture: true };

export function suppressGhostTapAfterNavigation({
  x,
  y,
  target = typeof document === 'undefined' ? null : document,
  now = () => Date.now()
}: {
  x: number;
  y: number;
  target?: EventTarget | null;
  now?: () => number;
}) {
  if (!target) return () => {};
  const startedAt = now();
  let removed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function swallow(event: Event) {
    if (now() - startedAt > GHOST_TAP_WINDOW_MS) {
      remove();
      return;
    }
    const { clientX, clientY } = event as MouseEvent;
    if (
      typeof clientX === 'number' &&
      typeof clientY === 'number' &&
      (clientX - x) ** 2 + (clientY - y) ** 2 >
        GHOST_TAP_RADIUS_PX * GHOST_TAP_RADIUS_PX
    ) {
      return;
    }
    // preventDefault on mousedown also stops the tap from focusing a field
    event.preventDefault();
    event.stopPropagation();
    (event as any).stopImmediatePropagation?.();
    // the click is the last event of the leftover tap
    if (event.type === 'click') remove();
  }

  function remove() {
    if (removed) return;
    removed = true;
    if (timer) clearTimeout(timer);
    for (const type of GHOST_TAP_EVENTS) {
      target!.removeEventListener(type, swallow, CAPTURE);
    }
  }

  for (const type of GHOST_TAP_EVENTS) {
    target.addEventListener(type, swallow, CAPTURE);
  }
  timer = setTimeout(remove, GHOST_TAP_WINDOW_MS);
  return remove;
}
