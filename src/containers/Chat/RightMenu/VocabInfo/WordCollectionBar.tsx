import React, { useMemo } from 'react';
import { css, keyframes } from '@emotion/css';
import { Color } from '~/constants/css';

interface WordCollectionBarProps {
  wordsHitToday?: number;
  maxWords?: number;
}

const goldenPulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(255, 215, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
  }
`;

export default function WordCollectionBar({
  wordsHitToday = 0,
  maxWords = 50
}: WordCollectionBarProps) {
  const segments = useMemo(() => {
    const segmentsArray: JSX.Element[] = [];

    const isComplete = wordsHitToday >= maxWords;

    const checkpointsPassed = Math.floor(wordsHitToday / 10);

    let gradientColors;
    let borderColor;
    let shadowColor;

    if (isComplete) {
      gradientColors = `linear-gradient(
          135deg, #ffc700 0%, #ffdf00 40%, #ffffaa 50%, #ffdf00 60%, #ffc700 100%
        )`;
      borderColor = '#ffc700';
      shadowColor = 'rgba(255, 199, 0, 0.6)';
    } else {
      switch (checkpointsPassed) {
        case 0:
          gradientColors = 'linear-gradient(135deg, #57c84d 0%, #83eb75 100%)';
          borderColor = '#57c84d';
          shadowColor = 'rgba(87, 200, 77, 0.3)';
          break;
        case 1:
          gradientColors = 'linear-gradient(135deg, #7ad45a 0%, #aeeb75 100%)';
          borderColor = '#7ad45a';
          shadowColor = 'rgba(122, 212, 90, 0.3)';
          break;
        case 2:
          gradientColors = 'linear-gradient(135deg, #a8d741 0%, #d5eb75 100%)';
          borderColor = '#a8d741';
          shadowColor = 'rgba(168, 215, 65, 0.3)';
          break;
        case 3:
          gradientColors = 'linear-gradient(135deg, #fbab7e 0%, #f7ce68 100%)';
          borderColor = '#fba45c';
          shadowColor = 'rgba(251, 164, 92, 0.3)';
          break;
        default:
          gradientColors =
            'linear-gradient(135deg, #f2994a 0%, #f2c94c 50%, #ffdd00 100%)';
          borderColor = '#f2994a';
          shadowColor = 'rgba(242, 153, 74, 0.5)';
          break;
      }
    }

    for (let i = maxWords - 1; i >= 0; i--) {
      const isCollected = maxWords - i - 1 < wordsHitToday;
      const wordNumber = maxWords - i;
      const isMultipleOfTen = wordNumber % 10 === 0 && wordNumber > 0;
      const isFinal = wordNumber === maxWords;

      const baseSegment = css`
        width: 85%;
        height: clamp(0.4rem, 2vh, 1.2rem);
        border-radius: 4px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        flex-shrink: 0;

        &:hover {
          transform: scale(1.06);
        }
      `;

      const uncollectedStyle = css`
        background-color: #f0f0f0;
        border: 1px solid ${Color.gray(0.5)};
      `;

      const collectedStyle = css`
        background: ${gradientColors};
        border: 1px solid ${borderColor};
        box-shadow: 0 0 4px ${shadowColor};
      `;

      const checkpointStyle = css`
        background: ${isCollected
          ? 'linear-gradient(135deg, #f5576c, #f093fb)'
          : '#f5e7ea'};
        border: ${isCollected ? '1px solid #d3485c' : `1px dashed #d4bc6a`};
        box-shadow: ${isCollected ? '0 0 5px rgba(245, 87, 108, 0.4)' : 'none'};
      `;

      const finalStyle = css`
        animation: ${isCollected ? goldenPulse : ''} 2s infinite;
        background: ${isCollected
          ? 'radial-gradient(circle, #ffd700, #ff9d00)'
          : 'linear-gradient(135deg, #f0e6c0, #ece3c8)'};
        border: ${isCollected ? '2px solid #ffd700' : `1px dashed #d4bc6a`};
        box-shadow: ${isCollected ? '0 0 12px rgba(255, 215, 0, 0.7)' : 'none'};
        width: 90%;
      `;

      let segmentStyle: string;
      if (isFinal) {
        segmentStyle = `${baseSegment} ${finalStyle}`;
      } else if (isMultipleOfTen) {
        segmentStyle = `${baseSegment} ${checkpointStyle}`;
      } else {
        segmentStyle = `${baseSegment} ${
          isCollected ? collectedStyle : uncollectedStyle
        }`;
      }

      segmentsArray.push(<div key={i} className={segmentStyle} />);
    }

    return segmentsArray;
  }, [wordsHitToday, maxWords]);

  return (
    <div
      className={css`
        position: absolute;
        left: 0;
        top: 0;
        width: 3.5rem;
        height: 100%;
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        justify-content: flex-start;
        background: linear-gradient(180deg, #ffffff 0%, #fef8f5 100%);
        border-right: 1px solid ${Color.borderGray()};
        box-shadow: 1px 0 3px rgba(0, 0, 0, 0.05);
        z-index: 10;
        overflow-y: auto;

        @media (max-width: 768px) {
          width: 3rem;
        }

        @media (max-height: 600px) {
          padding: 0.5rem 0;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column-reverse;
          justify-content: center;
          align-items: center;
          width: 100%;
          min-height: 100%;
          padding: 0.2vh 0;
          gap: calc(0.25vh + 0.1rem);
        `}
      >
        {segments}
      </div>
    </div>
  );
}
