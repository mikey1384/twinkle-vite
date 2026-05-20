import {
  cancelScrollAnchorRestores,
  suppressScrollAnchorRestores,
  suppressScrollAnchorSaves
} from '~/helpers/scrollAnchorRestorationCoordinator';

const defaultScrollResetSaveSuppressionMs = 250;

interface ScrollLockStyleSnapshot {
  overflow: string;
  overflowX: string;
  overflowY: string;
  overscrollBehavior: string;
}

export function resetAppShellScroll({
  cancelPendingAnchorRestores = true,
  suppressAnchorRestoresMs = 0,
  suppressAnchorSavesMs = defaultScrollResetSaveSuppressionMs
}: {
  cancelPendingAnchorRestores?: boolean;
  suppressAnchorRestoresMs?: number;
  suppressAnchorSavesMs?: number;
} = {}) {
  if (typeof document === 'undefined') return;

  if (cancelPendingAnchorRestores) {
    cancelScrollAnchorRestores();
  }
  if (suppressAnchorRestoresMs > 0) {
    suppressScrollAnchorRestores(suppressAnchorRestoresMs);
  }
  if (suppressAnchorSavesMs > 0) {
    suppressScrollAnchorSaves(suppressAnchorSavesMs);
  }

  setScrollSurfaceOrigin(document.getElementById('App'));
  setScrollSurfaceOrigin(document.scrollingElement || document.documentElement);
  window.dispatchEvent(new Event('scroll'));
}

export function lockAppShellScrollSurface() {
  if (typeof document === 'undefined') return () => {};
  const appElement = document.getElementById('App');
  const scrollingElement =
    document.scrollingElement || document.documentElement;
  const root = document.documentElement;
  const body = document.body;
  const previousAppStyle = snapshotScrollLockStyle(appElement);
  const previousRootStyle = snapshotScrollLockStyle(root);
  const previousBodyStyle = snapshotScrollLockStyle(body);
  let resetFrame = 0;
  let resettingScroll = false;

  applyScrollLockStyle(appElement);
  applyScrollLockStyle(root);
  applyScrollLockStyle(body);
  runScrollReset();

  window.addEventListener('scroll', scheduleScrollReset, {
    capture: true,
    passive: true
  });
  appElement?.addEventListener('scroll', scheduleScrollReset, {
    passive: true
  });
  scrollingElement?.addEventListener('scroll', scheduleScrollReset, {
    passive: true
  });

  return () => {
    if (resetFrame) window.cancelAnimationFrame(resetFrame);
    window.removeEventListener('scroll', scheduleScrollReset, {
      capture: true
    });
    appElement?.removeEventListener('scroll', scheduleScrollReset);
    scrollingElement?.removeEventListener('scroll', scheduleScrollReset);
    restoreScrollLockStyle(appElement, previousAppStyle);
    restoreScrollLockStyle(root, previousRootStyle);
    restoreScrollLockStyle(body, previousBodyStyle);
  };

  function scheduleScrollReset() {
    if (resettingScroll) return;
    runScrollReset();
    if (resetFrame) return;
    resetFrame = window.requestAnimationFrame(() => {
      resetFrame = 0;
      runScrollReset();
    });
  }

  function runScrollReset() {
    resettingScroll = true;
    try {
      resetAppShellScroll();
    } finally {
      resettingScroll = false;
    }
  }
}

function snapshotScrollLockStyle(
  element: HTMLElement | null
): ScrollLockStyleSnapshot {
  return {
    overflow: element?.style.overflow || '',
    overflowX: element?.style.overflowX || '',
    overflowY: element?.style.overflowY || '',
    overscrollBehavior: element?.style.overscrollBehavior || ''
  };
}

function applyScrollLockStyle(element: HTMLElement | null) {
  if (!element) return;
  element.style.overflow = 'hidden';
  element.style.overflowX = 'hidden';
  element.style.overflowY = 'hidden';
  element.style.overscrollBehavior = 'none';
}

function restoreScrollLockStyle(
  element: HTMLElement | null,
  snapshot: ScrollLockStyleSnapshot
) {
  if (!element) return;
  element.style.overflow = snapshot.overflow;
  element.style.overflowX = snapshot.overflowX;
  element.style.overflowY = snapshot.overflowY;
  element.style.overscrollBehavior = snapshot.overscrollBehavior;
}

function setScrollSurfaceOrigin(element: Element | null) {
  if (!element) return;
  element.scrollTop = 0;
  element.scrollLeft = 0;
  element.dispatchEvent(new Event('scroll'));
}
