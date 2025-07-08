import React, { useRef } from 'react';
import { css, keyframes } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import { useAutoFollow } from './useAutoFollow';

const pulseAnimation = keyframes`
  0% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.4; transform: scale(1); }
`;

const shimmerAnimation = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const dotAnimation = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

const blinkAnimation = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

interface ThinkingIndicatorProps {
  status?: string;
  thoughtContent?: string;
  isStreamingThoughts?: boolean;
  isThinkingHard?: boolean;
}

export default function ThinkingIndicator({
  status,
  thoughtContent,
  isStreamingThoughts,
  isThinkingHard
}: ThinkingIndicatorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useAutoFollow(scrollContainerRef, isStreamingThoughts || false);

  const getStatusText = () => {
    switch (status) {
      case 'thinking_hard':
        return 'Thinking hard...';
      case 'thinking_complete':
        return 'Thinking complete.';
      case 'retrieving_memory':
        return 'Remembering...';
      case 'reading_file':
        return 'Reading files...';
      case 'analyzing_code':
        return 'Analyzing code...';
      case 'searching_web':
        return 'Searching the web...';
      case 'reading':
        return 'Reading and thinking...';
      case 'recalling':
        return 'Recalling memories...';
      default:
        return 'Thinking...';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'thinking_hard':
        return 'brain';
      case 'thinking_complete':
        return 'check';
      case 'retrieving_memory':
        return 'history';
      case 'reading_file':
        return 'file-text';
      case 'analyzing_code':
        return 'code';
      case 'searching_web':
        return 'search';
      case 'reading':
        return 'magnifying-glass';
      case 'recalling':
        return 'clock';
      default:
        return 'lightbulb';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'thinking_hard':
        return Color.orange();
      case 'thinking_complete':
        return Color.green();
      case 'retrieving_memory':
        return Color.blue();
      case 'reading_file':
        return Color.purple();
      case 'analyzing_code':
        return Color.logoBlue();
      case 'searching_web':
        return Color.pink();
      case 'reading':
        return Color.redOrange();
      case 'recalling':
        return Color.darkBlue();
      default:
        return Color.gray();
    }
  };

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
        border: 1px solid ${Color.borderGray()};
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
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${getStatusColor()};
          color: white;
          font-size: 1.4rem;
          animation: ${status === 'thinking_complete' ? 'none' : pulseAnimation}
            2s infinite;
          z-index: 1;
        `}
      >
        <Icon icon={getStatusIcon()} />
      </div>

      <div
        className={css`
          flex: 1;
          z-index: 1;
        `}
      >
        {isStreamingThoughts && thoughtContent ? (
          <div>
            <div
              className={css`
                font-weight: 600;
                font-size: 1.4rem;
                color: ${isThinkingHard ? Color.orange() : Color.logoBlue()};
                margin-bottom: 0.5rem;
              `}
            >
              {isThinkingHard ? 'Thinking Hard...' : 'Thinking...'}
            </div>
            <div
              ref={scrollContainerRef}
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
        ) : (
          <div>
            <div
              className={css`
                font-weight: 600;
                font-size: 1.4rem;
                color: ${getStatusColor()};
                margin-bottom: 0.2rem;
              `}
            >
              {getStatusText()}
            </div>

            {status !== 'thinking_complete' && (
              <div
                className={css`
                  display: flex;
                  gap: 0.3rem;
                  align-items: center;
                `}
              >
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={css`
                      width: 6px;
                      height: 6px;
                      border-radius: 50%;
                      background: ${getStatusColor()};
                      animation: ${dotAnimation} 1.4s infinite ease-in-out both;
                      animation-delay: ${index * 0.16}s;
                    `}
                  />
                ))}
              </div>
            )}

            {status === 'thinking_hard' && !isStreamingThoughts && (
              <div
                className={css`
                  font-size: 1.1rem;
                  color: ${Color.darkGray()};
                  margin-top: 0.4rem;
                  font-style: italic;
                `}
              >
                Thinking really hard...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
