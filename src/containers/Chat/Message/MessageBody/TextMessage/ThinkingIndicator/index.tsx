import React, { useRef } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAutoFollow } from '../useAutoFollow';
import { metaFor } from './statusMeta';
import { shimmerAnimation } from '~/components/StreamingThoughtContent/animations';
import StatusIcon from './StatusIcon';
import StatusDots from './StatusDots';
import StreamingThoughtContent from '~/components/StreamingThoughtContent';

export interface ThinkingIndicatorProps {
  status?: string;
  thoughtContent?: string;
  isStreamingThoughts?: boolean;
  isThinkingHard?: boolean;
  compact?: boolean;
}

export default function ThinkingIndicator({
  status,
  thoughtContent,
  isStreamingThoughts,
  isThinkingHard,
  compact
}: ThinkingIndicatorProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useAutoFollow(scrollRef, !!isStreamingThoughts);

  const { text, color } = metaFor(status);

  if (compact) {
    return (
      <div
        className={css`
          margin-top: 1rem;
          padding: 0.6rem 1rem;
          background: ${Color.wellGray(0.15)};
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
        `}
      >
        <StatusIcon status={status} size="small" />
        <span
          className={css`
            font-size: 1.2rem;
            font-weight: 500;
            color: ${color};
          `}
        >
          {text}
        </span>
        {status !== 'thinking_complete' && <StatusDots color={color} small />}
      </div>
    );
  }

  return (
    <div
      className={css`
        margin: 1.5rem 0;
        padding: 1.2rem 1.8rem;
        background: linear-gradient(
          135deg,
          ${Color.wellGray(0.3)} 0%,
          ${Color.wellGray(0.1)} 100%
        );
        border: 1px solid var(--ui-border);
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 1rem;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -200px;
          width: 200px;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: ${status === 'thinking_complete'
              ? 'none'
              : shimmerAnimation}
            2s infinite;
        }
      `}
    >
      <StatusIcon status={status} />

      <div
        className={css`
          flex: 1;
          z-index: 1;
        `}
      >
        {isStreamingThoughts && thoughtContent ? (
          <StreamingThoughtContent
            thoughtContent={thoughtContent}
            scrollRef={scrollRef}
            isThinkingHard={isThinkingHard}
            status={status}
          />
        ) : (
          <>
            <div
              className={css`
                font-weight: 600;
                font-size: 1.4rem;
                color: ${color};
                margin-bottom: 0.2rem;
              `}
            >
              {text}
            </div>

            {status !== 'thinking_complete' && <StatusDots color={color} />}

            {status === 'thinking_hard' && !isStreamingThoughts && (
              <div
                className={css`
                  font-size: 1.1rem;
                  color: ${Color.darkGray()};
                  margin-top: 0.4rem;
                  font-style: italic;
                `}
              >
                Thinking Hard...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
