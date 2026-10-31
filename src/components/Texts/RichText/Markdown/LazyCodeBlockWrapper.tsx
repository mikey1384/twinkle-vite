import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import CodeBlock from './CodeBlock';
import { useInView } from 'react-intersection-observer';

interface LazyCodeBlockWrapperProps {
  language: string;
  value: string;
  stickyTopGap?: number | string;
}

// Syntax colours wait until the block is near the screen, but the block is
// its full height from the first frame. It used to open as a "Loading code..."
// box of estimated height and grow on screen, which moved a chat pinned to
// its newest message (the Word Master drift class, 10-25).
function LazyCodeBlockWrapper({
  language,
  value,
  stickyTopGap
}: LazyCodeBlockWrapperProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px'
  });

  return (
    <ErrorBoundary componentPath="RichText/Markdown/LazyCodeBlockWrapper">
      <div ref={ref}>
        <CodeBlock
          language={language}
          value={value}
          stickyTopGap={stickyTopGap}
          plain={!inView}
        />
      </div>
    </ErrorBoundary>
  );
}

export default LazyCodeBlockWrapper;
