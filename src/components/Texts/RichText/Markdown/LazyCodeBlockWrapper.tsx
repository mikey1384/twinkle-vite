import React, { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import CodeBlockPlaceholder from './CodeBlockPlaceholder';
import { css } from '@emotion/css';

const LazyCodeBlock = lazy(() => import('./CodeBlock'));

interface LazyCodeBlockWrapperProps {
  language: string;
  value: string;
}

const wrapperStyle = css`
  position: relative;
`;

const hiddenPreStyle = css`
  visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  font-family: 'Fira Code', 'Source Code Pro', Menlo, Monaco, Consolas,
    'Courier New', monospace;
  font-size: 14px;
  @media (max-width: 600px) {
    font-size: 11px;
  }
`;

function LazyCodeBlockWrapper({ language, value }: LazyCodeBlockWrapperProps) {
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
    <div
      ref={ref}
      className={wrapperStyle}
      style={{ minHeight: estimatedHeight }}
    >
      <pre ref={hiddenPreRef} className={hiddenPreStyle}>
        {value}
      </pre>
      {inView ? (
        <Suspense fallback={<CodeBlockPlaceholder height={estimatedHeight} />}>
          <LazyCodeBlock language={language} value={value} />
        </Suspense>
      ) : (
        <CodeBlockPlaceholder height={estimatedHeight} />
      )}
    </div>
  );
}

export default LazyCodeBlockWrapper;
