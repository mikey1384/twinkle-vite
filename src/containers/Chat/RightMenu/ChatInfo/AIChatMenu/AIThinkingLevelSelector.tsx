import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

type ThinkingLevel = 'default' | 'hard' | 'veryHard';

function AIThinkingLevelSelector({
  aiName,
  aiThinkingLevel,
  onAIThinkingLevelChange
}: {
  aiName: string;
  aiThinkingLevel: ThinkingLevel;
  onAIThinkingLevelChange: (level: ThinkingLevel) => void;
}) {
  return (
    <div
      className={css`
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 0;
      `}
    >
      <h3
        className={css`
          font-size: 1.4rem;
          color: #333;
          margin-bottom: 0.5rem;
        `}
      >
        How {aiName} thinks
      </h3>
      <p
        className={css`
          font-size: 1.2rem;
          color: ${Color.gray()};
          margin-bottom: 0.5rem;
        `}
      >
        <Icon icon={['far', 'badge-dollar']} /> Deep: 100 coins | Intense: 5000
        coins
      </p>
      <div
        className={css`
          display: flex;
          background-color: ${Color.highlightGray()};
          border-radius: 20px;
          padding: 4px;
        `}
      >
        {(['default', 'hard', 'veryHard'] as ThinkingLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => onAIThinkingLevelChange(level)}
            className={css`
              flex: 1;
              padding: 8px 12px;
              border: none;
              background-color: ${aiThinkingLevel === level
                ? '#fff'
                : 'transparent'};
              color: ${aiThinkingLevel === level
                ? Color.black()
                : Color.gray()};
              border-radius: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
              font-weight: ${aiThinkingLevel === level ? 'bold' : 'normal'};
              box-shadow: ${aiThinkingLevel === level
                ? '0 2px 4px rgba(0, 0, 0, 0.1)'
                : 'none'};

              &:hover {
                background-color: ${aiThinkingLevel === level
                  ? '#fff'
                  : Color.lightGray()};
              }
            `}
          >
            {level === 'default'
              ? 'Normal'
              : level === 'hard'
              ? 'Deep'
              : 'Intense'}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AIThinkingLevelSelector;
