import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';

export default function FullTextRevealFromOuterLayer({
  textContext,
  style,
  text,
  className
}: {
  className?: string;
  style?: React.CSSProperties;
  textContext: any;
  text: string | React.ReactNode;
}) {
  const { x, y, width, height } = textContext;

  const bubbleClass = useMemo(
    () =>
      css`
        position: absolute;
        z-index: 1000;
        padding: 0.8rem 1rem;
        font-size: 1.3rem;
        background: #fff;
        color: ${Color.black()};
        border: 1px solid var(--ui-border);
        border-radius: ${wideBorderRadius};
        box-shadow: 0 12px 20px -14px rgba(15, 23, 42, 0.22),
          0 1px 2px rgba(15, 23, 42, 0.06);
        min-width: 14rem;
        max-width: min(90vw, 36rem);
        line-height: 1.5;
        word-break: keep-all;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        pointer-events: none;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.2rem;
          max-width: min(94vw, 36rem);
        }
      `,
    []
  );

  return createPortal(
    <ErrorBoundary
      componentPath="FullTextRevealFromOuterLayer"
      style={{
        zIndex: 100_000_000,
        top: 0,
        position: 'fixed'
      }}
    >
      <div
        className={`${bubbleClass} ${className || ''}`}
        style={{
          width: `${width}px`,
          left: `${x}px`,
          top: `CALC(${y}px + ${height}px)`,
          ...style
        }}
      >
        {text}
      </div>
    </ErrorBoundary>,
    document.getElementById('outer-layer') as HTMLElement
  );
}
