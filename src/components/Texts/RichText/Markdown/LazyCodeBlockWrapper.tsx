import React, { useEffect, useState, useRef } from 'react';
import CodeBlockPlaceholder from './CodeBlockPlaceholder';
import ErrorBoundary from '~/components/ErrorBoundary';
import CodeBlock from './CodeBlock';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useInView } from 'react-intersection-observer';

interface LazyCodeBlockWrapperProps {
  language: string;
  value: string;
  stickyTopGap?: number | string;
}

function LazyCodeBlockWrapper({
  language,
  value,
  stickyTopGap
}: LazyCodeBlockWrapperProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px'
  });

  const [estimatedHeight, setEstimatedHeight] = useState<number>(100);
  const hiddenPreRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (hiddenPreRef.current) {
      const height = hiddenPreRef.current.offsetHeight;
      setEstimatedHeight(Math.max(height, 100));
    }
  }, [value]);

  return (
    <ErrorBoundary componentPath="RichText/Markdown/LazyCodeBlockWrapper">
      <div
        ref={ref}
        className={css`
          position: relative;
        `}
        style={{ minHeight: estimatedHeight }}
      >
        <pre
          ref={hiddenPreRef}
          className={css`
            visibility: hidden;
            position: absolute;
            top: 0;
            left: 0;
            z-index: -1;
            width: 100%;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: 'Fira Code', 'Source Code Pro', Menlo, Monaco, Consolas,
              'Courier New', monospace;
            font-size: 1.4rem;
            line-height: 1.5;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
            }
          `}
        >
          {value}
        </pre>
        {inView ? (
          <CodeBlock
            language={language}
            value={value}
            stickyTopGap={stickyTopGap}
          />
        ) : (
          <CodeBlockPlaceholder height={estimatedHeight} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default LazyCodeBlockWrapper;
