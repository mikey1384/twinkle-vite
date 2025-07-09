import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { blinkAnimation } from './animations';

interface StreamingThoughtContentProps {
  thoughtContent: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  isThinkingHard?: boolean;
  status?: string;
}

export default function StreamingThoughtContent({
  thoughtContent,
  scrollRef,
  isThinkingHard,
  status
}: StreamingThoughtContentProps) {
  return (
    <div>
      <div
        className={css`
          font-weight: 600;
          font-size: 1.4rem;
          color: ${isThinkingHard ? Color.orange() : Color.logoBlue()};
          margin-bottom: 0.5rem;
        `}
      >
        {isThinkingHard ? 'Thinking Really Hard...' : 'Thinking Hard...'}
      </div>
      <div
        ref={scrollRef}
        className={css`
          font-size: 1.3rem;
          line-height: 1.4;
          color: ${Color.darkGray()};
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 8px;
          border-left: 3px solid
            ${isThinkingHard ? Color.orange() : Color.logoBlue()};
          max-height: 200px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
          scroll-behavior: smooth;
        `}
      >
        {thoughtContent}
        {!status?.includes('complete') && (
          <span
            className={css`
              animation: ${blinkAnimation} 1s infinite;
              margin-left: 2px;
            `}
          >
            |
          </span>
        )}
      </div>
    </div>
  );
}
