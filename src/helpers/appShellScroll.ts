import {
  cancelScrollAnchorRestores,
  suppressScrollAnchorSaves
} from '~/helpers/scrollAnchorRestorationCoordinator';

const defaultScrollResetSaveSuppressionMs = 250;

export function resetAppShellScroll({
  cancelPendingAnchorRestores = true,
  suppressAnchorSavesMs = defaultScrollResetSaveSuppressionMs
}: {
  cancelPendingAnchorRestores?: boolean;
  suppressAnchorSavesMs?: number;
} = {}) {
  if (typeof document === 'undefined') return;

  if (cancelPendingAnchorRestores) {
    cancelScrollAnchorRestores();
  }
  if (suppressAnchorSavesMs > 0) {
    suppressScrollAnchorSaves(suppressAnchorSavesMs);
  }

  setScrollSurfaceTop(document.getElementById('App'));
  setScrollSurfaceTop(document.scrollingElement || document.documentElement);
  window.dispatchEvent(new Event('scroll'));
}

export function lockAppShellScrollSurface() {
  if (typeof document === 'undefined') return () => {};
  const appElement = document.getElementById('App');
  if (!appElement) return () => {};
  const previousOverflowY = appElement.style.overflowY;
  appElement.style.overflowY = 'hidden';
  return () => {
    appElement.style.overflowY = previousOverflowY;
  };
}

function setScrollSurfaceTop(element: Element | null) {
  if (!element) return;
  element.scrollTop = 0;
  element.dispatchEvent(new Event('scroll'));
}
