import { useLayoutEffect, useRef, type RefObject } from 'react';
import {
  addScrollAnchorRestoreCancelListener,
  addScrollAnchorTopResetListener,
  suppressScrollAnchorSaves,
  scrollAnchorRestoresAreSuppressed,
  scrollAnchorSavesAreSuppressed
} from '~/helpers/scrollAnchorRestorationCoordinator';

interface SavedScrollAnchor {
  anchorKey: string;
  primaryId?: string;
  secondaryId?: string;
  contentKey?: string;
  offset: number;
  scrollTop: number;
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
const restoreSaveSuppressionDurationMs = 250;
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
const scrollableOverflowValues = new Set(['auto', 'overlay', 'scroll']);

export function useScrollAnchorRestoration({
  anchorKey,
  containerRef,
  ignoreSavedAnchor = false,
  initialScroll,
  itemsReady
}: {
  anchorKey: string;
  containerRef: RefObject<HTMLElement | null>;
  ignoreSavedAnchor?: boolean;
  initialScroll: InitialScrollPolicy;
  itemsReady: boolean;
}) {
  const initialScrollType = initialScroll.type;
  const initialScrollTargetRef =
    initialScroll.type === 'element' ? initialScroll.targetRef : null;
  const initialScrollTopOffset =
    initialScroll.type === 'element' ? initialScroll.topOffset : undefined;
  const initialScrollAttemptedRef = useRef('');
  const activeIgnoredSavedAnchorKeyRef = useRef('');
  const ignoredSavedAnchorSignaturesRef = useRef<Record<string, string>>({});
  const activeAnchorKeyRef = useRef('');
  const restoreAttemptedRef = useRef('');
  const restoreSettledSignatureRef = useRef('');
  const userCancelledRestoreRef = useRef('');

  if (activeAnchorKeyRef.current !== anchorKey) {
    activeAnchorKeyRef.current = anchorKey;
    restoreAttemptedRef.current = '';
    restoreSettledSignatureRef.current = '';
    userCancelledRestoreRef.current = '';
  }

  if (ignoreSavedAnchor) {
    activeIgnoredSavedAnchorKeyRef.current = anchorKey;
    const ignoredRestoreSignature = getSavedAnchorRestoreSignature(anchorKey);
    if (ignoredRestoreSignature) {
      ignoredSavedAnchorSignaturesRef.current[anchorKey] =
        ignoredRestoreSignature;
    }
  } else if (
    !ignoreSavedAnchor &&
    activeIgnoredSavedAnchorKeyRef.current === anchorKey
  ) {
    activeIgnoredSavedAnchorKeyRef.current = '';
  }

  useLayoutEffect(() => {
    function markUserScrollInput() {
      userCancelledRestoreRef.current = anchorKey;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!restoreCancelKeys.has(event.key)) return;
      markUserScrollInput();
    }

    function handleTopReset() {
      savedScrollAnchors[anchorKey] = {
        anchorKey,
        offset: 0,
        scrollTop: 0
      };
      restoreSettledSignatureRef.current =
        getSavedAnchorRestoreSignature(anchorKey);
      userCancelledRestoreRef.current = '';
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
    const removeRestoreCancelListener =
      addScrollAnchorRestoreCancelListener(markUserScrollInput);
    const removeTopResetListener =
      addScrollAnchorTopResetListener(handleTopReset);

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
      removeRestoreCancelListener();
      removeTopResetListener();
    };
  }, [anchorKey]);

  useLayoutEffect(() => {
    if (!itemsReady || !containerRef.current) return;
    const scroller = getAppScroller();
    const container = containerRef.current;
    let frame = 0;

    function handleScroll() {
      if (scrollAnchorSavesAreSuppressed()) return;
      if (saveShouldWaitForPendingRestore()) return;
      saveAnchorAndMarkSettled();
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (scrollAnchorSavesAreSuppressed()) return;
        if (saveShouldWaitForPendingRestore()) return;
        saveAnchorAndMarkSettled();
      });
    }

    function saveAnchorAndMarkSettled() {
      saveCurrentAnchor(anchorKey, container, getActiveScroller());
      restoreSettledSignatureRef.current =
        getSavedAnchorRestoreSignature(anchorKey);
    }

    function saveShouldWaitForPendingRestore() {
      const restoreSignature = getSavedAnchorRestoreSignature(anchorKey);
      if (
        activeIgnoredSavedAnchorKeyRef.current === anchorKey ||
        (!!restoreSignature &&
          ignoredSavedAnchorSignaturesRef.current[anchorKey] ===
            restoreSignature)
      ) {
        return false;
      }
      return (
        !!restoreSignature &&
        restoreSettledSignatureRef.current !== restoreSignature
      );
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    scroller?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (
        !scrollAnchorSavesAreSuppressed() &&
        !saveShouldWaitForPendingRestore()
      ) {
        saveAnchorAndMarkSettled();
      }
      window.removeEventListener('scroll', handleScroll);
      scroller?.removeEventListener('scroll', handleScroll);
    };
  }, [anchorKey, containerRef, itemsReady]);

  useLayoutEffect(() => {
    if (!itemsReady || !containerRef.current) return;
    const savedAnchorRestoreSignature =
      getSavedAnchorRestoreSignature(anchorKey);
    if (
      activeIgnoredSavedAnchorKeyRef.current === anchorKey &&
      savedAnchorRestoreSignature
    ) {
      ignoredSavedAnchorSignaturesRef.current[anchorKey] =
        savedAnchorRestoreSignature;
    }
    const savedAnchorIsIgnored =
      activeIgnoredSavedAnchorKeyRef.current === anchorKey ||
      (!!savedAnchorRestoreSignature &&
        ignoredSavedAnchorSignaturesRef.current[anchorKey] ===
          savedAnchorRestoreSignature);
    const savedAnchor =
      savedAnchorIsIgnored ? undefined : savedScrollAnchors[anchorKey];
    const restoreSignature = savedAnchor ? savedAnchorRestoreSignature : '';
    if (scrollAnchorRestoresAreSuppressed()) {
      markSavedAnchorRestoreSettled();
      return;
    }
    if (userCancelledRestoreRef.current === anchorKey) {
      markSavedAnchorRestoreSettled();
      return;
    }
    if (!savedAnchor) {
      const initialScrollKey = `${anchorKey}:initial`;
      if (initialScrollAttemptedRef.current === initialScrollKey) return;
      initialScrollAttemptedRef.current = initialScrollKey;
      applyInitialScroll({
        scroller: getActiveScroller(),
        targetRef: initialScrollTargetRef,
        topOffset: initialScrollTopOffset,
        type: initialScrollType
      });
      return;
    }

    const anchorToRestore = savedAnchor;
    const restoreKey = `${anchorKey}:${anchorToRestore.primaryId || ''}:${
      anchorToRestore.secondaryId || ''
    }:${anchorToRestore.contentKey || ''}`;
    if (restoreAttemptedRef.current === restoreKey) {
      markSavedAnchorRestoreSettled();
      return;
    }
    restoreAttemptedRef.current = restoreKey;

    let attempts = 0;
    let restoreFrame = 0;
    let settleFrame = 0;
    let settleAttempts = 0;
    let observerTimer = 0;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let restoreCancelled = false;
    let cancelListenersAttached = false;
    let removeRestoreCancelSignalListener: (() => void) | null = null;

    function restore() {
      if (restoreCancelled) return;
      if (scrollAnchorRestoresAreSuppressed()) {
        cancelPendingRestore();
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const scroller = getActiveScroller();
      const anchorElement = findAnchorElement(container, anchorToRestore);
      if (!anchorElement) {
        restoreToSavedScrollTop(anchorToRestore, scroller);
        markRestoreSettledIfNoAnchorIdentity();
        attempts += 1;
        if (attempts < 12) {
          restoreFrame = window.requestAnimationFrame(restore);
        } else if (!resizeObserver && !mutationObserver) {
          markRestoreSettled();
        }
        return;
      }
      restoreToAnchor(anchorElement, anchorToRestore.offset, scroller);
      markRestoreSettled();
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
        markRestoreSettled();
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
      removeRestoreCancelSignalListener =
        addScrollAnchorRestoreCancelListener(cancelPendingRestore);
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
      removeRestoreCancelSignalListener?.();
      removeRestoreCancelSignalListener = null;
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
      markRestoreSettled();
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
        if (scrollAnchorRestoresAreSuppressed()) {
          cancelPendingRestore();
          return;
        }
        settleFrame = 0;
        const container = containerRef.current;
        if (!container) return;
        const scroller = getActiveScroller();
        const anchorElement = findAnchorElement(container, anchorToRestore);
        if (!anchorElement) {
          restoreToSavedScrollTop(anchorToRestore, scroller);
          markRestoreSettledIfNoAnchorIdentity();
          return;
        }

        restoreToAnchor(anchorElement, anchorToRestore.offset, scroller);
        markRestoreSettled();
        settleAttempts += 1;
        if (settleAttempts < 12 && !restoreCancelled) {
          settleFrame = window.requestAnimationFrame(settle);
        }
      });
    }

    function markRestoreSettled() {
      restoreSettledSignatureRef.current = restoreSignature;
    }

    function markRestoreSettledIfNoAnchorIdentity() {
      if (!savedAnchorHasElementIdentity(anchorToRestore)) {
        markRestoreSettled();
      }
    }

    function markSavedAnchorRestoreSettled() {
      if (restoreSignature) {
        restoreSettledSignatureRef.current = restoreSignature;
      }
    }
  }, [
    anchorKey,
    containerRef,
    initialScrollTargetRef,
    initialScrollTopOffset,
    initialScrollType,
    itemsReady,
    ignoreSavedAnchor
  ]);
}

function savedAnchorHasElementIdentity(savedAnchor: SavedScrollAnchor) {
  return Boolean(
    savedAnchor.primaryId || savedAnchor.secondaryId || savedAnchor.contentKey
  );
}

function getSavedAnchorRestoreSignature(anchorKey: string) {
  const savedAnchor = savedScrollAnchors[anchorKey];
  if (!savedAnchor) return '';
  return `${anchorKey}:${savedAnchor.primaryId || ''}:${
    savedAnchor.secondaryId || ''
  }:${savedAnchor.contentKey || ''}:${savedAnchor.offset}:${savedAnchor.scrollTop}`;
}

export function saveScrollAnchorForElement(
  sourceElement: HTMLElement | null,
  anchorKey?: string
) {
  if (!sourceElement) return;
  const anchorElement = sourceElement.closest<HTMLElement>(
    '[data-scroll-anchor-id], [data-scroll-anchor-content-key]'
  );
  if (anchorKey && anchorElement) {
    saveAnchorElement(anchorKey, anchorElement, getActiveScroller());
    suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
    return;
  }

  if (!anchorKey && anchorElement) {
    const groupKey = anchorElement.closest<HTMLElement>(
      '[data-scroll-anchor-group-key]'
    )?.dataset.scrollAnchorGroupKey;
    if (groupKey) {
      saveAnchorElement(groupKey, anchorElement, getActiveScroller());
      suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
      return;
    }
  }

  const contentPagePanel = sourceElement.closest<HTMLElement>(
    '[data-content-page="true"]'
  );
  const contentAnchorContainer = contentPagePanel?.closest<HTMLElement>(
    '[data-scroll-anchor-id^="content:"]'
  );
  const contentAnchorKey = contentAnchorContainer?.dataset.scrollAnchorId;
  if (!contentAnchorKey || !contentAnchorContainer) return;

  if (
    anchorElement &&
    anchorElement !== contentAnchorContainer &&
    contentAnchorContainer.contains(anchorElement)
  ) {
    saveAnchorElement(contentAnchorKey, anchorElement, getActiveScroller());
    suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
    return;
  }

  saveCurrentAnchor(
    contentAnchorKey,
    contentAnchorContainer,
    getActiveScroller()
  );
  suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
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
    suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
    setScrollTop(scroller, 0);
    return;
  }

  const targetElement = targetRef?.current;
  if (!targetElement) return;
  suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
  scrollElementToTop(targetElement, topOffset || 0, scroller);
}

function saveAnchorElement(
  anchorKey: string,
  anchorElement: HTMLElement,
  scroller: HTMLElement | null
) {
  const viewportTop = getViewportTop(scroller);
  const rect = anchorElement.getBoundingClientRect();
  savedScrollAnchors[anchorKey] = {
    anchorKey,
    primaryId: anchorElement.dataset.scrollAnchorId,
    secondaryId: anchorElement.dataset.scrollAnchorSecondaryId,
    contentKey: anchorElement.dataset.scrollAnchorContentKey,
    offset: viewportTop - rect.top,
    scrollTop: getScrollTop(scroller)
  };
}

function saveCurrentAnchor(
  anchorKey: string,
  container: HTMLElement | null,
  scroller: HTMLElement | null
) {
  if (!container) return;
  const scrollTop = getScrollTop(scroller);
  if (!container.isConnected) {
    if (savedScrollAnchors[anchorKey]) return;
    savedScrollAnchors[anchorKey] = {
      anchorKey,
      offset: 0,
      scrollTop
    };
    return;
  }

  const items = getScrollAnchorItems(container);
  if (items.length === 0) {
    savedScrollAnchors[anchorKey] = {
      anchorKey,
      offset: 0,
      scrollTop
    };
    return;
  }

  const viewportTop = getViewportTop(scroller);
  const viewportBottom = getViewportBottom(scroller);
  const anchorElement = findCurrentAnchorElement({
    items,
    viewportBottom,
    viewportTop
  });
  if (!anchorElement) {
    savedScrollAnchors[anchorKey] = {
      anchorKey,
      offset: 0,
      scrollTop
    };
    return;
  }

  const rect = anchorElement.getBoundingClientRect();
  savedScrollAnchors[anchorKey] = {
    anchorKey,
    primaryId: anchorElement.dataset.scrollAnchorId,
    secondaryId: anchorElement.dataset.scrollAnchorSecondaryId,
    contentKey: anchorElement.dataset.scrollAnchorContentKey,
    offset: viewportTop - rect.top,
    scrollTop
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
  suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
  setScrollTop(scroller, Math.max(0, nextScrollTop));
}

function restoreToSavedScrollTop(
  savedAnchor: SavedScrollAnchor,
  scroller: HTMLElement | null
) {
  if (!Number.isFinite(savedAnchor.scrollTop)) return;
  suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
  setScrollTop(scroller, Math.max(0, savedAnchor.scrollTop));
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

function getAppScroller() {
  return document.getElementById('App');
}

function getActiveScroller() {
  const scroller = getAppScroller();
  return scroller && elementUsesOwnScroll(scroller) ? scroller : null;
}

function elementUsesOwnScroll(element: HTMLElement) {
  const { overflowY } = window.getComputedStyle(element);
  return scrollableOverflowValues.has(overflowY);
}

function getViewportTop(scroller: HTMLElement | null) {
  return scroller ? scroller.getBoundingClientRect().top : 0;
}

function getViewportBottom(scroller: HTMLElement | null) {
  return scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
}

function getScrollTop(scroller: HTMLElement | null) {
  const bodyRef = document.scrollingElement || document.documentElement;
  return scroller ? scroller.scrollTop : bodyRef?.scrollTop || 0;
}

function setScrollTop(scroller: HTMLElement | null, scrollTop: number) {
  const bodyRef = document.scrollingElement || document.documentElement;
  if (scroller) {
    scroller.scrollTop = scrollTop;
    scroller.dispatchEvent(new Event('scroll'));
  } else if (bodyRef) {
    bodyRef.scrollTop = scrollTop;
    bodyRef.dispatchEvent(new Event('scroll'));
  }
  window.dispatchEvent(new Event('scroll'));
}
