import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

type ThinkingLevel = 0 | 1 | 2;

function AIThinkingLevelSelector({
  aiThinkingLevel = 0,
  displayedThemeColor,
  onAIThinkingLevelChange
}: {
  aiThinkingLevel: ThinkingLevel;
  displayedThemeColor: string;
  onAIThinkingLevelChange: (level: ThinkingLevel) => void;
}) {
  const levelInfo = useMemo(
    () => getLevelInfo(aiThinkingLevel),
    [aiThinkingLevel]
  );

  const buttons = useMemo(() => {
    return ([0, 1, 2] as ThinkingLevel[]).map((level, index) => (
      <button
        key={level}
        onClick={() => onAIThinkingLevelChange(level)}
        className={css`
          flex: 1;
          padding: 8px 12px;
          border: none;
          background-color: ${aiThinkingLevel === level
            ? Color[displayedThemeColor]()
            : 'transparent'};
          color: ${aiThinkingLevel === level ? '#fff' : Color.darkGray()};
          border-radius: ${index === 0
            ? '16px 0 0 16px'
            : index === 2
            ? '0 16px 16px 0'
            : '0'};
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: ${aiThinkingLevel === level ? 'bold' : 'normal'};
          box-shadow: ${aiThinkingLevel === level
            ? '0 2px 4px rgba(0, 0, 0, 0.1)'
            : 'none'};

          &:hover {
            background-color: ${aiThinkingLevel === level
              ? Color[displayedThemeColor]()
              : Color[displayedThemeColor](0.8)};
            color: #fff;
          }
        `}
      >
        {getLevelLabel(level)}
      </button>
    ));
  }, [aiThinkingLevel, displayedThemeColor, onAIThinkingLevelChange]);

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
        Thinking Mode
      </h3>
      <p
        className={css`
          font-size: 1.2rem;
          color: ${Color.gray()};
          margin-bottom: 0.5rem;
        `}
      >
        Price:{' '}
        {levelInfo.price !== 'Free' && <Icon icon={['far', 'badge-dollar']} />}{' '}
        {levelInfo.price}
      </p>
      <p
        className={css`
          font-size: 1.2rem;
          color: ${Color.gray()};
          margin-bottom: 1rem;
        `}
      >
        Model: {levelInfo.model}
      </p>
      <div
        className={css`
          display: flex;
          background-color: ${Color.highlightGray()};
          border-radius: 20px;
          padding: 4px;
        `}
      >
        {buttons}
      </div>
    </div>
  );
}

function getLevelLabel(level: ThinkingLevel): string {
  switch (level) {
    case 0:
      return 'Normal';
    case 1:
      return 'Programming';
    case 2:
      return 'Ultra';
    default:
      return 'Normal';
  }
}

function getLevelInfo(level: ThinkingLevel): {
  price: string;
  model: string;
} {
  switch (level) {
    case 0:
      return { price: 'Free', model: 'GPT-4o' };
    case 1:
      return { price: '100', model: 'o1-mini' };
    case 2:
      return { price: '1,000', model: 'o1-preview' };
    default:
      return { price: 'Free', model: 'GPT-4o' };
  }
}

export default AIThinkingLevelSelector;
