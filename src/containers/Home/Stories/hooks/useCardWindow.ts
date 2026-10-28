import { useCallback, useRef, useState } from 'react';
import { observe } from 'react-intersection-observer';

type Size = { height: number; width: number };
const sizes = new Map<string, Size>();
const CACHE_LIMIT = 600;
const LEAVE_DELAY_MS = 1000;
const RENDER_MARGIN = '400px 0px';
const sizeListeners = new Map<Element, (entry: ResizeObserverEntry) => void>();
let sizeObserver: ResizeObserver | null = null;

// Both ordinary stories and natural-height digests use the same bounded window.
// One visibility state controls mounting; leaving the window does not itself
// rerender the card. Resize observation follows DOM refs, not visibility state.
export function useCardWindow({
  cacheKey,
  alwaysShow = false,
  measureBeforeHide = false
}: {
  cacheKey: string;
  alwaysShow?: boolean;
  // Digests have no fixed text/height budget. Measure once before hiding so
  // adding them to virtualization never replaces their height with a guess.
  measureBeforeHide?: boolean;
}) {
  const [mounted, setMounted] = useState(measureBeforeHide);
  const mountedRef = useRef(measureBeforeHide);
  const [measurement, setMeasurement] = useState<{ key: string; size?: Size }>(
    () => ({ key: cacheKey, size: sizes.get(cacheKey) })
  );
  const size =
    measurement.key === cacheKey ? measurement.size : sizes.get(cacheKey);
  const latestSizeRef = useRef(size);
  latestSizeRef.current = size;
  const nearViewportRef = useRef(false);
  const panelElementRef = useRef<HTMLDivElement | null>(null);
  const contentShown =
    alwaysShow ||
    mounted ||
    (measureBeforeHide && !size) ||
    typeof ResizeObserver !== 'function';

  const visibilityRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const element = node;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let observedWidth = -1;
    let visibilityRoot = getVisibilityRoot(element);

    function clearLeaveTimer() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    }

    function hideAfterGrace() {
      clearLeaveTimer();
      if (alwaysShow || nearViewportRef.current || !mountedRef.current) return;
      timer = setTimeout(() => {
        timer = null;
        // Keyboard focus and an active embedded control must not be removed
        // from under the member just because the card scrolled off-screen.
        if (
          !disposed &&
          !nearViewportRef.current &&
          !element.contains(document.activeElement)
        ) {
          mountedRef.current = false;
          setMounted(false);
        }
      }, LEAVE_DELAY_MS);
    }

    function handleVisibility(near: boolean) {
      if (disposed) return;
      nearViewportRef.current = near;
      if (near) {
        clearLeaveTimer();
        mountedRef.current = true;
        setMounted(true);
      } else {
        hideAfterGrace();
      }
    }

    let stopVisibility = observe(
      element,
      handleVisibility,
      { root: visibilityRoot, rootMargin: RENDER_MARGIN },
      true
    );
    const stopWidth = observeSize(element, (entry) => {
      if (disposed) return;
      const previous = latestSizeRef.current;
      const width = entry.contentRect.width;
      if (width > 0 && width !== observedWidth) {
        observedWidth = width;
        // iOS switches between document and #App scrolling at the mobile
        // breakpoint. Keep the pre-render margin on the actual scrollport.
        const nextRoot = getVisibilityRoot(element);
        if (nextRoot !== visibilityRoot) {
          stopVisibility();
          visibilityRoot = nextRoot;
          stopVisibility = observe(
            element,
            handleVisibility,
            { root: visibilityRoot, rootMargin: RENDER_MARGIN },
            true
          );
        }
      }
      // A hidden page reports zero; retain its last usable measurement.
      if (width <= 0 || !previous || Math.abs(previous.width - width) <= 1) return;
      sizes.delete(cacheKey);
      latestSizeRef.current = undefined;
      setMeasurement({ key: cacheKey });
    });
    element.addEventListener('focusout', hideAfterGrace);

    return () => {
      disposed = true;
      nearViewportRef.current = false;
      clearLeaveTimer();
      stopVisibility();
      stopWidth();
      element.removeEventListener('focusout', hideAfterGrace);
    };
  }, [alwaysShow, cacheKey]);

  const panelRef = useCallback((node: HTMLDivElement | null) => {
    panelElementRef.current = node;
    if (!node) return;
    const stop = observeSize(node, (entry) => {
      // This wrapper has no border or padding. ResizeObserver supplies its
      // laid-out size, so no clientHeight read or extra forced layout is needed.
      const next = {
        height: Math.ceil(entry.contentRect.height),
        width: entry.contentRect.width
      };
      if (next.height <= 0 || next.width <= 0) return;
      const previous = latestSizeRef.current;
      if (previous?.height === next.height && previous.width === next.width) return;
      latestSizeRef.current = next;
      sizes.delete(cacheKey);
      sizes.set(cacheKey, next);
      if (sizes.size > CACHE_LIMIT) sizes.delete(sizes.keys().next().value!);
      setMeasurement({ key: cacheKey, size: next });
    });
    return () => {
      stop();
      if (panelElementRef.current === node) panelElementRef.current = null;
    };
  }, [cacheKey]);

  return {
    contentShown,
    nearViewportRef,
    panelElementRef,
    panelRef,
    placeholderHeight: size?.height || 0,
    visibilityRef
  };
}

function getVisibilityRoot(node: HTMLElement) {
  const app = document.getElementById('App');
  if (!app?.contains(node)) return null;
  const overflow = window.getComputedStyle(app).overflowY;
  return ['auto', 'scroll', 'overlay'].includes(overflow) ? app : null;
}

function observeSize(node: Element, listener: (entry: ResizeObserverEntry) => void) {
  if (typeof ResizeObserver !== 'function') return () => {};
  if (!sizeObserver) {
    const observer = new ResizeObserver((entries) => {
      if (sizeObserver !== observer) return;
      for (const entry of entries) sizeListeners.get(entry.target)?.(entry);
    });
    sizeObserver = observer;
  }
  sizeListeners.set(node, listener);
  sizeObserver.observe(node);
  return () => {
    sizeListeners.delete(node);
    sizeObserver?.unobserve(node);
    if (!sizeListeners.size) {
      sizeObserver?.disconnect();
      sizeObserver = null;
    }
  };
}
