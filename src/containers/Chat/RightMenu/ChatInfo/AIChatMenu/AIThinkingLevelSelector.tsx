import React, { useMemo, useCallback } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import { ThinkingLevel, LevelInfo } from './index';

const levelDescriptions = {
  0: 'Fastest response, great for most questions.',
  1: 'Longer thinking time, better at math and programming.',
  2: 'Longest thinking time, best technological answers possible.'
};

function AIThinkingLevelSelector({
  aiThinkingLevel = 0,
  displayedThemeColor,
  onAIThinkingLevelChange,
  twinkleCoins,
  onGetLevelInfo
}: {
  aiThinkingLevel: ThinkingLevel;
  displayedThemeColor: string;
  onAIThinkingLevelChange: (level: ThinkingLevel) => void;
  twinkleCoins: number;
  onGetLevelInfo: (level: ThinkingLevel) => LevelInfo;
}) {
  const levelInfo = useMemo(
    () => onGetLevelInfo(aiThinkingLevel),
    [aiThinkingLevel, onGetLevelInfo]
  );

  const handleLevelChange = useCallback(
    (level: ThinkingLevel) => {
      const { price } = onGetLevelInfo(level);
      const numericPrice = price === 'Free' ? 0 : Number(price);
      if (twinkleCoins >= numericPrice) {
        onAIThinkingLevelChange(level);
      }
    },
    [onAIThinkingLevelChange, twinkleCoins, onGetLevelInfo]
  );

  const buttons = useMemo(() => {
    return ([0, 1, 2] as ThinkingLevel[]).map((level, index) => {
      const { price, label } = onGetLevelInfo(level);
      const numericPrice = price === 'Free' ? 0 : Number(price);
      const isDisabled = twinkleCoins < numericPrice;

      return (
        <button
          key={level}
          onClick={() => handleLevelChange(level)}
          disabled={isDisabled}
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
            cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
            transition: all 0.3s ease;
            font-weight: ${aiThinkingLevel === level ? 'bold' : 'normal'};
            box-shadow: ${aiThinkingLevel === level
              ? '0 2px 4px rgba(0, 0, 0, 0.1)'
              : 'none'};
            opacity: ${isDisabled ? 0.5 : 1};

            &:hover {
              background-color: ${!isDisabled &&
              (aiThinkingLevel === level
                ? Color[displayedThemeColor]()
                : Color[displayedThemeColor](0.8))};
              color: ${!isDisabled && '#fff'};
            }

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 0.9rem;
              white-space: nowrap;
              padding: 6px 4px;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          `}
        >
          {label}
        </button>
      );
    });
  }, [
    aiThinkingLevel,
    displayedThemeColor,
    onGetLevelInfo,
    handleLevelChange,
    twinkleCoins
  ]);

  return (
    <div
      className={css`
        width: 100%;
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 0;

        @media (max-width: ${mobileMaxWidth}) {
          padding: 0.5rem 0;
        }
      `}
    >
      <h3
        className={css`
          font-size: 1.3rem;
          color: #333;
          margin-bottom: 0.5rem;

          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
          }
        `}
      >
        {levelInfo.label} Thinking Mode
      </h3>
      <p
        className={css`
          font-size: 1rem;
          color: ${Color.gray()};
          margin-bottom: 0.5rem;
          line-height: 1.2;

          @media (max-width: ${mobileMaxWidth}) {
            font-size: 0.9rem;
          }
        `}
      >
        {levelDescriptions[aiThinkingLevel]}
      </p>
      <p
        className={css`
          font-size: 1.1rem;
          color: ${Color.gray()};
          margin-bottom: 0.5rem;
        `}
      >
        {levelInfo.price !== 'Free' ? (
          <>
            <Icon icon={['far', 'badge-dollar']} />{' '}
            <strong>{Number(levelInfo.price).toLocaleString()}</strong> per
            message
          </>
        ) : (
          <strong>Free</strong>
        )}
      </p>
      <p
        className={css`
          font-size: 1.1rem;
          color: ${Color.gray()};
          margin-bottom: 1rem;

          @media (max-width: ${mobileMaxWidth}) {
            font-size: 0.9rem;
          }
        `}
      >
        Model: {levelInfo.model}
      </p>
      <div
        className={css`
          display: flex;
          width: 100%;
          background-color: ${Color.highlightGray()};
          border-radius: 20px;
          padding: 4px;

          @media (max-width: ${mobileMaxWidth}) {
            padding: 2px;
          }
        `}
      >
        {buttons}
      </div>
    </div>
  );
}

export default AIThinkingLevelSelector;
