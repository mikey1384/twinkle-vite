import { useLayoutEffect, useRef, type RefObject } from 'react';

interface SavedScrollAnchor {
  anchorKey: string;
  primaryId?: string;
  secondaryId?: string;
  contentKey?: string;
  offset: number;
}

type InitialScrollPolicy =
  | { type: 'preserve' }
  | { type: 'top' }
  | {
      type: 'element';
      targetRef: RefObject<HTMLElement | null>;
      topOffset?: number;
    };

const savedScrollAnchors: Record<string, SavedScrollAnchor> = {};
const restoreCancelKeys = new Set([
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

export function useScrollAnchorRestoration({
  anchorKey,
  containerRef,
  initialScroll,
  itemsReady
}: {
  anchorKey: string;
  containerRef: RefObject<HTMLElement | null>;
  initialScroll: InitialScrollPolicy;
  itemsReady: boolean;
}) {
  const initialScrollType = initialScroll.type;
  const initialScrollTargetRef =
    initialScroll.type === 'element' ? initialScroll.targetRef : null;
  const initialScrollTopOffset =
    initialScroll.type === 'element' ? initialScroll.topOffset : undefined;
  const initialScrollAttemptedRef = useRef('');
  const restoreAttemptedRef = useRef('');
  const userCancelledRestoreRef = useRef('');

  useLayoutEffect(() => {
    function markUserScrollInput() {
      userCancelledRestoreRef.current = anchorKey;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!restoreCancelKeys.has(event.key)) return;
      markUserScrollInput();
    }

    window.addEventListener('wheel', markUserScrollInput, {
      capture: true,
      passive: true
    });
    window.addEventListener('touchmove', markUserScrollInput, {
      capture: true,
      passive: true
    });
    window.addEventListener('keydown', handleKeyDown, {
      capture: true
    });

    return () => {
      window.removeEventListener('wheel', markUserScrollInput, {
        capture: true
      });
      window.removeEventListener('touchmove', markUserScrollInput, {
        capture: true
      });
      window.removeEventListener('keydown', handleKeyDown, {
        capture: true
      });
    };
  }, [anchorKey]);

  useLayoutEffect(() => {
    if (!itemsReady || !containerRef.current) return;
    const scroller = getScroller();
    const container = containerRef.current;
    let frame = 0;

    function handleScroll() {
      saveCurrentAnchor(anchorKey, container, scroller);
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        saveCurrentAnchor(anchorKey, container, scroller);
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    scroller?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      scroller?.removeEventListener('scroll', handleScroll);
    };
  }, [anchorKey, containerRef, itemsReady]);

  useLayoutEffect(() => {
    if (!itemsReady || !containerRef.current) return;
    if (userCancelledRestoreRef.current === anchorKey) return;
    const savedAnchor = savedScrollAnchors[anchorKey];
    if (!savedAnchor) {
      const initialScrollKey = `${anchorKey}:initial`;
      if (initialScrollAttemptedRef.current === initialScrollKey) return;
      initialScrollAttemptedRef.current = initialScrollKey;
      applyInitialScroll({
        scroller: getScroller(),
        targetRef: initialScrollTargetRef,
        topOffset: initialScrollTopOffset,
        type: initialScrollType
      });
      return;
    }

    const restoreKey = `${anchorKey}:${savedAnchor.primaryId || ''}:${
      savedAnchor.secondaryId || ''
    }:${savedAnchor.contentKey || ''}`;
    if (restoreAttemptedRef.current === restoreKey) return;
    restoreAttemptedRef.current = restoreKey;

    const scroller = getScroller();
    let attempts = 0;
    let restoreFrame = 0;
    let settleFrame = 0;
    let settleAttempts = 0;
    let observerTimer = 0;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let restoreCancelled = false;
    let cancelListenersAttached = false;

    function restore() {
      if (restoreCancelled) return;
      const container = containerRef.current;
      if (!container) return;
      const anchorElement = findAnchorElement(container, savedAnchor);
      if (!anchorElement) {
        attempts += 1;
        if (attempts < 12) {
          restoreFrame = window.requestAnimationFrame(restore);
        }
        return;
      }
      restoreToAnchor(anchorElement, savedAnchor.offset, scroller);
      settleAnchor();
    }

    addRestoreCancelListeners();
    restore();

    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(() => {
        restore();
      });
      resizeObserver.observe(containerRef.current);
    }
    if (typeof MutationObserver === 'function') {
      mutationObserver = new MutationObserver(() => {
        restore();
      });
      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true
      });
    }
    if (resizeObserver || mutationObserver) {
      observerTimer = window.setTimeout(() => {
        resizeObserver?.disconnect();
        mutationObserver?.disconnect();
        removeRestoreCancelListeners();
      }, 3000);
    }

    return () => {
      cancelPendingRestore();
    };

    function addRestoreCancelListeners() {
      if (cancelListenersAttached) return;
      cancelListenersAttached = true;
      window.addEventListener('wheel', handleUserScrollInput, {
        capture: true,
        passive: true
      });
      window.addEventListener('touchmove', handleUserScrollInput, {
        capture: true,
        passive: true
      });
      window.addEventListener('keydown', handleRestoreKeyDown, {
        capture: true
      });
    }

    function removeRestoreCancelListeners() {
      if (!cancelListenersAttached) return;
      cancelListenersAttached = false;
      window.removeEventListener('wheel', handleUserScrollInput, {
        capture: true
      });
      window.removeEventListener('touchmove', handleUserScrollInput, {
        capture: true
      });
      window.removeEventListener('keydown', handleRestoreKeyDown, {
        capture: true
      });
    }

    function handleUserScrollInput() {
      cancelPendingRestore();
    }

    function handleRestoreKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!restoreCancelKeys.has(event.key)) return;
      cancelPendingRestore();
    }

    function cancelPendingRestore() {
      restoreCancelled = true;
      if (restoreFrame) window.cancelAnimationFrame(restoreFrame);
      if (settleFrame) window.cancelAnimationFrame(settleFrame);
      if (observerTimer) window.clearTimeout(observerTimer);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      removeRestoreCancelListeners();
    }

    function settleAnchor() {
      if (restoreCancelled) return;
      if (settleFrame) return;

      settleFrame = window.requestAnimationFrame(function settle() {
        if (restoreCancelled) return;
        settleFrame = 0;
        const container = containerRef.current;
        if (!container) return;
        const anchorElement = findAnchorElement(container, savedAnchor);
        if (!anchorElement) return;

        restoreToAnchor(anchorElement, savedAnchor.offset, scroller);
        settleAttempts += 1;
        if (settleAttempts < 12 && !restoreCancelled) {
          settleFrame = window.requestAnimationFrame(settle);
        }
      });
    }
  }, [
    anchorKey,
    containerRef,
    initialScrollTargetRef,
    initialScrollTopOffset,
    initialScrollType,
    itemsReady
  ]);
}

function applyInitialScroll({
  scroller,
  targetRef,
  topOffset,
  type
}: {
  scroller: HTMLElement | null;
  targetRef: RefObject<HTMLElement | null> | null;
  topOffset?: number;
  type: InitialScrollPolicy['type'];
}) {
  if (type === 'preserve') return;
  if (type === 'top') {
    setScrollTop(scroller, 0);
    return;
  }

  const targetElement = targetRef?.current;
  if (!targetElement) return;
  scrollElementToTop(targetElement, topOffset || 0, scroller);
}

function saveCurrentAnchor(
  anchorKey: string,
  container: HTMLElement | null,
  scroller: HTMLElement | null
) {
  if (!container?.isConnected) return;
  const items = getScrollAnchorItems(container);
  if (items.length === 0) return;

  const viewportTop = getViewportTop(scroller);
  const viewportBottom = getViewportBottom(scroller);
  const anchorElement = findCurrentAnchorElement({
    items,
    viewportBottom,
    viewportTop
  });
  if (!anchorElement) return;

  const rect = anchorElement.getBoundingClientRect();
  savedScrollAnchors[anchorKey] = {
    anchorKey,
    primaryId: anchorElement.dataset.scrollAnchorId,
    secondaryId: anchorElement.dataset.scrollAnchorSecondaryId,
    contentKey: anchorElement.dataset.scrollAnchorContentKey,
    offset: viewportTop - rect.top
  };
}

function findCurrentAnchorElement({
  items,
  viewportBottom,
  viewportTop
}: {
  items: HTMLElement[];
  viewportBottom: number;
  viewportTop: number;
}) {
  const viewportHeight = Math.max(0, viewportBottom - viewportTop);
  const anchorLine =
    viewportTop + Math.min(Math.max(viewportHeight * 0.1, 72), 140);
  let containingAnchor: { item: HTMLElement; height: number } | null = null;
  let firstLowerAnchor: HTMLElement | null = null;
  let nearestAnchor: { item: HTMLElement; distance: number } | null = null;

  for (const item of items) {
    const rect = item.getBoundingClientRect();
    const distanceFromAnchorLine =
      rect.top > anchorLine
        ? rect.top - anchorLine
        : Math.max(0, anchorLine - rect.bottom);
    if (!nearestAnchor || distanceFromAnchorLine < nearestAnchor.distance) {
      nearestAnchor = {
        item,
        distance: distanceFromAnchorLine
      };
    }

    const visibleHeight =
      Math.min(rect.bottom, viewportBottom) - Math.max(rect.top, viewportTop);
    if (visibleHeight <= 1) continue;
    if (rect.top <= anchorLine && rect.bottom >= anchorLine) {
      const height = Math.max(rect.height, 1);
      if (!containingAnchor || height < containingAnchor.height) {
        containingAnchor = { item, height };
      }
      continue;
    }
    if (rect.bottom >= anchorLine && !firstLowerAnchor) {
      firstLowerAnchor = item;
    }
  }

  return containingAnchor?.item || firstLowerAnchor || nearestAnchor?.item;
}

function findAnchorElement(
  container: HTMLElement,
  savedAnchor: SavedScrollAnchor
) {
  const items = getScrollAnchorItems(container);
  if (savedAnchor.primaryId) {
    const primaryMatch = items.find(
      (item) => item.dataset.scrollAnchorId === savedAnchor.primaryId
    );
    if (primaryMatch) return primaryMatch;
  }

  if (savedAnchor.secondaryId) {
    const secondaryMatch = items.find(
      (item) =>
        item.dataset.scrollAnchorSecondaryId === savedAnchor.secondaryId
    );
    if (secondaryMatch) return secondaryMatch;
  }

  if (savedAnchor.contentKey) {
    return items.find(
      (item) => item.dataset.scrollAnchorContentKey === savedAnchor.contentKey
    );
  }

  return undefined;
}

function getScrollAnchorItems(container: HTMLElement) {
  const items = Array.from(
    container.querySelectorAll<HTMLElement>(
      '[data-scroll-anchor-id], [data-scroll-anchor-content-key]'
    )
  );
  if (
    container.dataset.scrollAnchorId !== undefined ||
    container.dataset.scrollAnchorContentKey !== undefined
  ) {
    items.unshift(container);
  }
  return items.filter(
    (item) =>
      item.dataset.scrollAnchorId !== undefined ||
      item.dataset.scrollAnchorContentKey !== undefined
  );
}

function restoreToAnchor(
  anchorElement: HTMLElement,
  offset: number,
  scroller: HTMLElement | null
) {
  const viewportTop = getViewportTop(scroller);
  const rect = anchorElement.getBoundingClientRect();
  const currentScrollTop = getScrollTop(scroller);
  const nextScrollTop = currentScrollTop + rect.top - viewportTop + offset;
  setScrollTop(scroller, Math.max(0, nextScrollTop));
}

function scrollElementToTop(
  element: HTMLElement,
  topOffset: number,
  scroller: HTMLElement | null
) {
  const viewportTop = getViewportTop(scroller);
  const rect = element.getBoundingClientRect();
  const currentScrollTop = getScrollTop(scroller);
  const nextScrollTop = currentScrollTop + rect.top - viewportTop - topOffset;
  setScrollTop(scroller, Math.max(0, nextScrollTop));
}

function getScroller() {
  return document.getElementById('App');
}

function getViewportTop(scroller: HTMLElement | null) {
  return scroller ? scroller.getBoundingClientRect().top : 0;
}

function getViewportBottom(scroller: HTMLElement | null) {
  return scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
}

function getScrollTop(scroller: HTMLElement | null) {
  const bodyRef = document.scrollingElement || document.documentElement;
  return Math.max(scroller?.scrollTop || 0, bodyRef?.scrollTop || 0);
}

function setScrollTop(scroller: HTMLElement | null, scrollTop: number) {
  const bodyRef = document.scrollingElement || document.documentElement;
  if (scroller) {
    scroller.scrollTop = scrollTop;
    scroller.dispatchEvent(new Event('scroll'));
  }
  if (bodyRef) {
    bodyRef.scrollTop = scrollTop;
    bodyRef.dispatchEvent(new Event('scroll'));
  }
  window.dispatchEvent(new Event('scroll'));
}
