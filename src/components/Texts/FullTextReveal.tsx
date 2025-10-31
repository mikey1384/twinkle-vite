import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';
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
  const bubbleClass = useMemo(
    () =>
      css`
        position: absolute;
        top: calc(100% + 0.5rem);
        ${direction === 'left' ? 'left: 0;' : 'right: 0;'}
        z-index: 1000;
        display: ${show ? 'block' : 'none'};
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
    [direction, show]
  );

  return (
    <ErrorBoundary
      componentPath="FullTextReveal"
      style={{ position: 'relative' }}
    >
      <div className={`${bubbleClass} ${className || ''}`} style={style}>
        {text}
      </div>
    </ErrorBoundary>
  );
}
