import { useLayoutEffect } from 'react';
import {
  APP_SHELL_HEADER_OFFSET_FALLBACK,
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
    let mutationObserver: MutationObserver | null = null;
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
      if (!headerVisible) return '0px';
      if (!shouldOffsetDesktopHeader()) return '0px';
      const headerElement = getHeaderElement();
      if (!headerElement) return APP_SHELL_HEADER_OFFSET_FALLBACK;
      const { height } = headerElement.getBoundingClientRect();
      const measuredHeight = Math.max(0, Math.ceil(height));
      return measuredHeight > 0
        ? `${measuredHeight}px`
        : APP_SHELL_HEADER_OFFSET_FALLBACK;
    }

    function setHeaderOffset(offset: string) {
      if (
        root.style.getPropertyValue(APP_SHELL_TOP_OFFSET_VAR).trim() === offset
      ) {
        return;
      }
      root.style.setProperty(APP_SHELL_TOP_OFFSET_VAR, offset);
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
      setHeaderOffset(readHeaderOffset());
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
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(scheduleMeasure);
      mutationObserver.observe(root, {
        attributeFilter: ['style'],
        attributes: true
      });
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
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      window.removeEventListener('pageshow', scheduleMeasure);
      visualViewport?.removeEventListener('resize', scheduleMeasure);
    };
  }, [headerVisible, routeKey]);
}
