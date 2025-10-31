import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';

export default function FullTextReveal({
  direction = 'right',
  style,
  show,
  text,
  className
}: {
  className?: string;
  direction?: 'left' | 'right';
  show: boolean;
  style?: React.CSSProperties;
  text: string | React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: string; left?: string; right?: string } | null>(null);

  const bubbleClass = useMemo(
    () =>
      css`
        position: fixed;
        z-index: 100000000; /* ensure always on top */
        padding: 0.8rem 1rem;
        font-size: 1.3rem;
        background: #fff;
        color: ${Color.black()};
        border: 1px solid var(--ui-border);
        border-radius: ${wideBorderRadius};
        box-shadow: 0 12px 20px -14px rgba(15, 23, 42, 0.22),
          0 1px 2px rgba(15, 23, 42, 0.06);
        min-width: 14rem;
        width: max-content;
        max-width: min(90vw, 36rem);
        line-height: 1.5;
        word-break: keep-all;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        pointer-events: none;
        &::before {
          content: '';
          position: absolute;
          top: -6px;
          ${direction === 'left' ? 'left: 1.2rem;' : 'right: 1.2rem;'}
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid #fff;
          filter: drop-shadow(0 -1px 0 var(--ui-border));
        }
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.2rem;
          max-width: min(94vw, 36rem);
        }
      `,
    [direction]
  );

  const computeCoords = useCallback(() => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const top = `calc(${rect.top + rect.height}px + 0.5rem)`;
    if (direction === 'left') {
      return { top, left: `${rect.left}px` };
    }
    return { top, right: `${window.innerWidth - rect.right}px` };
  }, [direction]);

  useLayoutEffect(() => {
    if (!show) return;
    setCoords(computeCoords());
  }, [show, computeCoords, text]);

  useEffect(() => {
    if (!show) return;
    const onResize = () => setCoords(computeCoords());
    const onScroll = () => setCoords(computeCoords());
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [show, computeCoords]);

  const portalTarget = typeof document !== 'undefined'
    ? (document.getElementById('outer-layer') as HTMLElement | null)
    : null;

  return (
    <ErrorBoundary
      componentPath="FullTextReveal"
      innerRef={containerRef}
      style={{ position: 'relative' }}
    >
      {show && portalTarget && coords
        ? createPortal(
            <div
              className={`${bubbleClass} ${className || ''}`}
              style={{
                top: coords.top,
                left: coords.left,
                right: coords.right,
                ...style
              }}
            >
              {text}
            </div>,
            portalTarget
          )
        : null}
    </ErrorBoundary>
  );
}
