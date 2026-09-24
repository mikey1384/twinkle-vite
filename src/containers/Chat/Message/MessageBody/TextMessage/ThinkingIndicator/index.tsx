import React, { useRef } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAutoFollow } from '../hooks/useAutoFollow';
import { metaFor } from './constants/statusMeta';
import { shimmerAnimation } from '~/components/StreamingThoughtContent/animations';
import StatusIcon from './StatusIcon';
import StatusDots from '~/components/StatusDots';
import StreamingThoughtContent from '~/components/StreamingThoughtContent';

export interface ThinkingIndicatorProps {
  status?: string;
  thoughtContent?: string;
  isStreamingThoughts?: boolean;
  isThinkingHard?: boolean;
  compact?: boolean;
  // Compact only: what the assistant is doing right now, in place of the
  // generic status word.
  activity?: string;
}

export default function ThinkingIndicator({
  status,
  thoughtContent,
  isStreamingThoughts,
  isThinkingHard,
  compact,
  activity
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
            max-width: 32rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          `}
        >
          {activity || text}
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
        {status !== 'talking_with_lumine' &&
        isStreamingThoughts &&
        thoughtContent ? (
          <StreamingThoughtContent
            thoughtContent={thoughtContent}
            scrollRef={scrollRef}
            isThinkingHard={isThinkingHard}
            status={status}
            label={isThinkingHard ? undefined : 'Working on it...'}
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

// The last line of the streamed thoughts: for Zero and Ciel working on the
// website, the step they are on now.
export function latestThoughtLine(thoughts?: string) {
  const lines = String(thoughts || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[lines.length - 1] || '';
}

// Statuses that mean the assistant is still working after words have
// appeared ('responding' is the words themselves).
export const AI_WORKING_STATUSES = [
  'thinking',
  'thinking_hard',
  'searching_web',
  'analyzing_code',
  'saving_file',
  'reading_file',
  'reading',
  'recalling',
  'talking_with_lumine',
  'retrieving_memory'
];
