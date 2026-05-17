import { useLayoutEffect } from 'react';
import {
  APP_SHELL_HEADER_SELECTOR,
  APP_SHELL_TOP_OFFSET_VAR
} from '~/constants/appShell';
import { desktopMinWidth } from '~/constants/css';

export default function useAppShellHeaderOffset({
  headerVisible,
  routeKey
}: {
  headerVisible: boolean;
  routeKey: string;
}) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;
    let measureFrame: number | null = null;
    let repairFrame: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    function getHeaderElement() {
      return document.querySelector<HTMLElement>(APP_SHELL_HEADER_SELECTOR);
    }

    function shouldOffsetDesktopHeader() {
      return (
        headerVisible &&
        window.matchMedia(`(min-width: ${desktopMinWidth})`).matches
      );
    }

    function readHeaderOffset() {
      if (!shouldOffsetDesktopHeader()) return 0;
      const headerElement = getHeaderElement();
      if (!headerElement) return 0;
      const { height } = headerElement.getBoundingClientRect();
      return Math.max(0, Math.ceil(height));
    }

    function setHeaderOffset(offsetPx: number) {
      root.style.setProperty(APP_SHELL_TOP_OFFSET_VAR, `${offsetPx}px`);
    }

    function repairOverlapIfNeeded() {
      repairFrame = null;
      if (!shouldOffsetDesktopHeader()) return;
      const headerElement = getHeaderElement();
      const appElement = document.getElementById('App');
      if (!headerElement || !appElement) return;

      const headerBottom = headerElement.getBoundingClientRect().bottom;
      const appTop = appElement.getBoundingClientRect().top;
      if (appTop >= headerBottom - 1) return;
      setHeaderOffset(Math.max(0, Math.ceil(headerBottom)));
    }

    function measureAndApplyOffset() {
      measureFrame = null;
      setHeaderOffset(readHeaderOffset());
      if (repairFrame !== null) {
        window.cancelAnimationFrame(repairFrame);
      }
      repairFrame = window.requestAnimationFrame(repairOverlapIfNeeded);
    }

    function scheduleMeasure() {
      if (measureFrame !== null) {
        window.cancelAnimationFrame(measureFrame);
      }
      measureFrame = window.requestAnimationFrame(measureAndApplyOffset);
    }

    measureAndApplyOffset();

    const headerElement = getHeaderElement();
    if (headerElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(headerElement);
    }

    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('orientationchange', scheduleMeasure);
    window.addEventListener('pageshow', scheduleMeasure);
    visualViewport?.addEventListener('resize', scheduleMeasure);

    return () => {
      if (measureFrame !== null) {
        window.cancelAnimationFrame(measureFrame);
      }
      if (repairFrame !== null) {
        window.cancelAnimationFrame(repairFrame);
      }
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      window.removeEventListener('pageshow', scheduleMeasure);
      visualViewport?.removeEventListener('resize', scheduleMeasure);
    };
  }, [headerVisible, routeKey]);
}
