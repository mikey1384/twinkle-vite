import { scrollElementToCenter } from '~/helpers';
import { suppressScrollAnchorSaves } from '~/helpers/scrollAnchorRestorationCoordinator';

export type HomeFeedActionIntentAction = 'comment' | 'reward' | 'recommend';

export interface HomeFeedNavigationState {
  action?: HomeFeedActionIntentAction;
  contentId: number;
  contentType: string;
  nonce: string;
  source: 'homeFeed';
}

export interface HomeFeedActionIntent {
  action: HomeFeedActionIntentAction;
  contentId: number;
  contentType: string;
  nonce: string;
  source: 'homeFeed';
}

export const homeFeedActionIntentStateKey = 'homeFeedActionIntent';
export const homeFeedNavigationStateKey = 'homeFeedNavigation';

const homeFeedActionIntentRetryDelays = [0, 80, 240, 520];
const homeFeedNavigationScrollKeys = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
  ' '
]);

export function createHomeFeedNavigationState({
  action,
  contentId,
  contentType
}: {
  action?: HomeFeedActionIntentAction;
  contentId: number;
  contentType: string;
}): HomeFeedNavigationState {
  return {
    ...(action ? { action } : {}),
    contentId,
    contentType,
    nonce: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    source: 'homeFeed'
  };
}

export function createHomeFeedActionIntent({
  action,
  contentId,
  contentType
}: {
  action: HomeFeedActionIntentAction;
  contentId: number;
  contentType: string;
}): HomeFeedActionIntent {
  return {
    action,
    contentId,
    contentType,
    nonce: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    source: 'homeFeed'
  };
}

export function getMatchingHomeFeedNavigationState({
  contentId,
  contentType,
  state
}: {
  contentId: number;
  contentType: string;
  state: unknown;
}): HomeFeedNavigationState | null {
  const navigationState =
    state && typeof state === 'object'
      ? (state as Record<string, unknown>)[homeFeedNavigationStateKey]
      : null;

  if (!isHomeFeedNavigationState(navigationState)) return null;
  if (Number(navigationState.contentId) !== Number(contentId)) return null;
  if (navigationState.contentType !== contentType) return null;
  return navigationState;
}

export function getMatchingHomeFeedActionIntent({
  contentId,
  contentType,
  state
}: {
  contentId: number;
  contentType: string;
  state: unknown;
}): HomeFeedActionIntent | null {
  const intent =
    state && typeof state === 'object'
      ? (state as Record<string, unknown>)[homeFeedActionIntentStateKey]
      : null;

  if (!isHomeFeedActionIntent(intent)) return null;
  if (Number(intent.contentId) !== Number(contentId)) return null;
  if (intent.contentType !== contentType) return null;
  return intent;
}

export function clearHomeFeedActionIntentState(state: unknown) {
  if (!state || typeof state !== 'object') return null;

  const nextState = { ...(state as Record<string, unknown>) };
  delete nextState[homeFeedActionIntentStateKey];
  const navigationState = nextState[homeFeedNavigationStateKey];
  if (isHomeFeedNavigationState(navigationState) && navigationState.action) {
    delete nextState[homeFeedNavigationStateKey];
  }

  return Object.keys(nextState).length ? nextState : null;
}

export function clearHomeFeedNavigationState(state: unknown) {
  if (!state || typeof state !== 'object') return null;

  const nextState = { ...(state as Record<string, unknown>) };
  delete nextState[homeFeedNavigationStateKey];

  return Object.keys(nextState).length ? nextState : null;
}

export function homeFeedNavigationKeyShouldClear(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return false;
  if (eventTargetAcceptsTextInput(event.target)) return false;
  return homeFeedNavigationScrollKeys.has(event.key);
}

export function focusHomeFeedCommentIntentTarget(
  targetRef: { current: HTMLElement | null } | HTMLElement | null,
  {
    documentScroll = true,
    highlightDuration = 2400,
    scrollAdjustment = -90
  }: {
    documentScroll?: boolean;
    highlightDuration?: number;
    scrollAdjustment?: number;
  } = {}
) {
  if (typeof window === 'undefined') return;

  homeFeedActionIntentRetryDelays.forEach((delay) => {
    window.setTimeout(() => {
      const element = resolveFocusTarget(targetRef);
      if (!element) return;
      if (!elementHasMeasurableLayout(element)) return;

      element.classList.add('home-feed-comment-intent-target');
      suppressScrollAnchorSaves();

      try {
        element.focus({ preventScroll: true });
      } catch {
        element.focus();
      }

      scrollHomeFeedActionIntentTargetOnceIfNeeded(element, {
        documentScroll,
        scrollAdjustment
      });
    }, delay);
  });

  window.setTimeout(() => {
    resolveFocusTarget(targetRef)?.classList.remove(
      'home-feed-comment-intent-target'
    );
  }, highlightDuration);
}

export function scrollHomeFeedActionIntentTargetIfNeeded(
  targetRef: { current: HTMLElement | null } | HTMLElement | null,
  {
    documentScroll = true,
    scrollAdjustment = -120
  }: {
    documentScroll?: boolean;
    scrollAdjustment?: number;
  } = {}
) {
  if (typeof window === 'undefined') return;

  homeFeedActionIntentRetryDelays.forEach((delay) => {
    window.setTimeout(() => {
      scrollHomeFeedActionIntentTargetOnceIfNeeded(targetRef, {
        documentScroll,
        scrollAdjustment
      });
    }, delay);
  });
}

export function centerHomeFeedActionIntentTarget(
  targetRef: { current: HTMLElement | null } | HTMLElement | null,
  options?: {
    documentScroll?: boolean;
    scrollAdjustment?: number;
  }
) {
  scrollHomeFeedActionIntentTargetIfNeeded(targetRef, options);
}

function homeFeedActionIntentTargetIsAlreadyVisible(
  element: HTMLElement,
  documentScroll: boolean
) {
  if (!documentScroll) {
    return elementIsVisibleInNearestScrollableContainer(element);
  }

  return (
    !documentHasMeaningfulScrollRoom() ||
    elementIsComfortablyVisibleInViewport(element)
  );
}

function elementHasMeasurableLayout(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isHomeFeedNavigationState(
  navigationState: unknown
): navigationState is HomeFeedNavigationState {
  if (!navigationState || typeof navigationState !== 'object') return false;
  const value = navigationState as Record<string, unknown>;
  return (
    value.source === 'homeFeed' &&
    typeof value.contentId === 'number' &&
    typeof value.contentType === 'string' &&
    typeof value.nonce === 'string' &&
    (value.action === undefined ||
      value.action === 'comment' ||
      value.action === 'reward' ||
      value.action === 'recommend')
  );
}

function isHomeFeedActionIntent(
  intent: unknown
): intent is HomeFeedActionIntent {
  if (!intent || typeof intent !== 'object') return false;
  const value = intent as Record<string, unknown>;
  return (
    value.source === 'homeFeed' &&
    typeof value.contentId === 'number' &&
    typeof value.contentType === 'string' &&
    typeof value.nonce === 'string' &&
    (value.action === 'comment' ||
      value.action === 'reward' ||
      value.action === 'recommend')
  );
}

function resolveFocusTarget(
  targetRef: { current: HTMLElement | null } | HTMLElement | null
) {
  if (!targetRef) return null;
  if (targetRef instanceof HTMLElement) return targetRef;
  return targetRef.current;
}

function eventTargetAcceptsTextInput(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'select' || tagName === 'textarea';
}

function scrollHomeFeedActionIntentTargetOnceIfNeeded(
  targetRef: { current: HTMLElement | null } | HTMLElement | null,
  {
    documentScroll,
    scrollAdjustment
  }: {
    documentScroll: boolean;
    scrollAdjustment: number;
  }
) {
  const element = resolveFocusTarget(targetRef);
  if (!element) return;
  if (!elementHasMeasurableLayout(element)) return;
  if (homeFeedActionIntentTargetIsAlreadyVisible(element, documentScroll)) {
    return;
  }

  suppressScrollAnchorSaves();

  if (!documentScroll) {
    scrollNearestContainerToCenter(element);
    return;
  }

  scrollElementToCenter(element, scrollAdjustment);
}

function scrollNearestContainerToCenter(element: HTMLElement) {
  const container = findNearestScrollableContainer(element);
  if (!container) return;

  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  container.scrollTop +=
    elementRect.top -
    containerRect.top -
    (container.clientHeight - element.clientHeight) / 2;
}

function elementIsComfortablyVisibleInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const viewport = getViewportBounds();
  const topPadding = 88;
  const bottomPadding = 24;

  return (
    rect.top >= viewport.top + topPadding &&
    rect.bottom <= viewport.bottom - bottomPadding
  );
}

function elementIsVisibleInNearestScrollableContainer(element: HTMLElement) {
  const container = findNearestScrollableContainer(element);
  if (!container) return true;

  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return (
    elementRect.top >= containerRect.top &&
    elementRect.bottom <= containerRect.bottom
  );
}

function documentHasMeaningfulScrollRoom() {
  return getDocumentScrollSurfaces().some(
    (surface) => surface.scrollHeight > surface.clientHeight + 32
  );
}

function getDocumentScrollSurfaces() {
  return [
    document.scrollingElement || document.documentElement,
    document.getElementById('App')
  ].filter((surface): surface is Element => Boolean(surface));
}

function getViewportBounds() {
  const visualViewport = window.visualViewport;
  if (!visualViewport) {
    return {
      top: 0,
      bottom: window.innerHeight
    };
  }

  return {
    top: visualViewport.offsetTop,
    bottom: visualViewport.offsetTop + visualViewport.height
  };
}

function findNearestScrollableContainer(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent) {
    const styles = window.getComputedStyle(parent);
    const overflowY = styles.overflowY;
    const canScroll =
      (overflowY === 'auto' || overflowY === 'scroll') &&
      parent.scrollHeight > parent.clientHeight;
    if (canScroll) return parent;
    parent = parent.parentElement;
  }
  return null;
}
