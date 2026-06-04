const POPUP_DISMISS_NAVIGATION_SUPPRESSION_MS = 1200;
const POPUP_DISMISS_NAVIGATION_FEED_CARD_TARGET_SELECTOR =
  '[data-popup-dismiss-navigation-target="feed-card"]';

export const popupDismissNavigationFeedCardTargetProps = {
  'data-popup-dismiss-navigation-target': 'feed-card'
} as const;

let suppressedAt = 0;
let suppressedPointerId: number | null = null;
let suppressionSequence = 0;
let removeSuppressionEndListeners: (() => void) | null = null;

type PointerLikeEvent = Event | { pointerId?: number };

function getPointerId(event: PointerLikeEvent | null | undefined) {
  const pointerId = (event as { pointerId?: number } | undefined)?.pointerId;
  return typeof pointerId === 'number' ? pointerId : null;
}

export function markPopupDismissNavigationSuppressed(event: Event) {
  removeSuppressionEndListeners?.();
  removeSuppressionEndListeners = null;
  suppressedAt = Date.now();
  suppressedPointerId = getPointerId(event);
  suppressionSequence += 1;
  addSuppressionEndListeners(event, suppressionSequence);
}

export function eventTargetsPopupDismissNavigationFeedCard(event: Event) {
  if (typeof Element === 'undefined' || typeof Node === 'undefined') {
    return false;
  }
  const target = event.target;
  if (!(target instanceof Node)) return false;
  const targetElement =
    target instanceof Element ? target : target.parentElement;
  return Boolean(
    targetElement?.closest(POPUP_DISMISS_NAVIGATION_FEED_CARD_TARGET_SELECTOR)
  );
}

export function consumePopupDismissNavigationSuppression(
  event: PointerLikeEvent | null | undefined
) {
  if (!suppressedAt) return false;

  const pointerId = getPointerId(event);
  if (
    suppressedPointerId !== null &&
    pointerId !== null &&
    suppressedPointerId !== pointerId
  ) {
    return false;
  }

  if (
    Date.now() - suppressedAt > POPUP_DISMISS_NAVIGATION_SUPPRESSION_MS &&
    !suppressionHasActiveEndListeners()
  ) {
    clearPopupDismissNavigationSuppression();
    return false;
  }

  clearPopupDismissNavigationSuppression();
  return true;
}

function clearPopupDismissNavigationSuppression() {
  removeSuppressionEndListeners?.();
  removeSuppressionEndListeners = null;
  suppressedAt = 0;
  suppressedPointerId = null;
}

function suppressionHasActiveEndListeners() {
  return removeSuppressionEndListeners !== null;
}

function addSuppressionEndListeners(sourceEvent: Event, sequence: number) {
  if (typeof window === 'undefined') return;
  const eventNames = getSuppressionEndEventNames(sourceEvent);
  if (!eventNames.length) return;

  function handleSuppressionEnd(event: Event) {
    const pointerId = getPointerId(event);
    if (
      suppressedPointerId !== null &&
      pointerId !== null &&
      suppressedPointerId !== pointerId
    ) {
      return;
    }
    queueSuppressionClear(sequence);
  }

  for (const eventName of eventNames) {
    window.addEventListener(eventName, handleSuppressionEnd, true);
  }
  removeSuppressionEndListeners = () => {
    for (const eventName of eventNames) {
      window.removeEventListener(eventName, handleSuppressionEnd, true);
    }
  };
}

function getSuppressionEndEventNames(sourceEvent: Event) {
  if (sourceEvent.type === 'mousedown') return ['mouseup'];
  if (sourceEvent.type === 'touchstart') return ['touchend', 'touchcancel'];
  if (sourceEvent.type === 'pointerdown') return ['pointerup', 'pointercancel'];
  return [];
}

function queueSuppressionClear(sequence: number) {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => {
    if (suppressionSequence !== sequence) return;
    clearPopupDismissNavigationSuppression();
  }, 0);
}
