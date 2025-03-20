import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface WordCollectionBarProps {
  wordsCollected?: number;
  maxWords?: number;
}

export default function WordCollectionBar({
  wordsCollected = 3, // Temporarily set to 3 to show bottom 3 lit up
  maxWords = 50
}: WordCollectionBarProps) {
  // Generate an array of "segments" (in this case, circles)
  const segments = useMemo(() => {
    const segmentsArray: JSX.Element[] = [];

    // Reverse the order so we fill from bottom to top
    for (let i = maxWords - 1; i >= 0; i--) {
      const isCollected = maxWords - i - 1 < wordsCollected;
      const wordNumber = maxWords - i;
      const isMultipleOfTen = wordNumber % 10 === 0 && wordNumber > 0;
      const isFinal = wordNumber === maxWords;

      if (isFinal) {
        // Add a special marker for the final position
        segmentsArray.push(
          <div
            key={i}
            className={css`
              width: 36%;
              height: 1.4%;
              border-radius: 50%;
              background-color: ${isCollected
                ? Color.gold()
                : Color.borderGray()};
              transition: background-color 0.3s ease;
              box-shadow: ${isCollected ? `0 0 5px ${Color.gold()}` : 'none'};
              aspect-ratio: 1 / 1;
              border: ${isCollected
                ? `1px solid ${Color.gold()}`
                : `1px dashed ${Color.darkGray()}`};
            `}
          />
        );
      } else {
        segmentsArray.push(
          <div
            key={i}
            className={css`
              width: ${isMultipleOfTen ? '30%' : '26%'};
              height: ${isMultipleOfTen ? '1.2%' : '1%'};
              border-radius: 50%;
              background-color: ${isCollected
                ? Color.green()
                : Color.borderGray()};
              transition: all 0.3s ease;
              box-shadow: ${isCollected ? `0 0 4px ${Color.green()}` : 'none'};
              aspect-ratio: 1 / 1;
              ${isMultipleOfTen
                ? `border: 1px solid ${
                    isCollected ? Color.green() : Color.gray(0.5)
                  };`
                : ''}
            `}
          />
        );
      }
    }

    return segmentsArray;
  }, [wordsCollected, maxWords]);

  // Determine whether the user has hit the max
  const reachedMax = useMemo(
    () => wordsCollected >= maxWords,
    [wordsCollected, maxWords]
  );

  return (
    <div
      className={css`
        position: absolute;
        left: 0;
        top: 0;
        width: 32px;
        height: 100%;
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        padding: 10px 0;
        background-color: #fff;
        border-right: 1px solid ${Color.borderGray()};
        z-index: 10;
        box-shadow: 1px 0 3px rgba(0, 0, 0, 0.05);
        gap: 1%;
      `}
    >
      {segments}
      {reachedMax && (
        <div
          className={css`
            margin-top: auto;
            margin-bottom: 1rem;
            font-size: 1rem;
            font-weight: 500;
            text-align: center;
            color: ${Color.rose()};
            padding: 4px 0;
          `}
        >
          Max!
        </div>
      )}
    </div>
  );
}
