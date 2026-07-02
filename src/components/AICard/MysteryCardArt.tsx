import React, { useId } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';

const mysteryCardArt = css`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${Color.midnightBlack()};
  container-type: size;
  .mystery-card-art__dots {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .mystery-card-art__frame {
    position: absolute;
    inset: 4.5cqmin;
    border: max(1px, 0.8cqmin) solid var(--mystery-card-frame);
    border-radius: 4cqmin;
    pointer-events: none;
  }
  .mystery-card-art__diamond {
    position: absolute;
    width: 62cqmin;
    height: 62cqmin;
    border: max(1px, 1cqmin) solid var(--mystery-card-diamond);
    border-radius: 14%;
    background: var(--mystery-card-diamond-fill);
    transform: rotate(45deg);
  }
  .mystery-card-art__question {
    position: relative;
    font-size: 36cqmin;
    line-height: 1;
    font-weight: 800;
    color: ${Color.gold()};
    text-shadow: 0 1cqmin 2.6cqmin rgba(0, 0, 0, 0.55),
      0 0 5cqmin ${Color.gold(0.45)};
  }
  .mystery-card-art__spark {
    position: absolute;
    line-height: 1;
    color: ${Color.gold(0.75)};
    text-shadow: 0 0 3cqmin ${Color.gold(0.5)};
  }
  .mystery-card-art__spark--top {
    top: 12cqh;
    right: 15cqw;
    font-size: 9cqmin;
  }
  .mystery-card-art__spark--bottom {
    bottom: 11cqh;
    left: 14cqw;
    font-size: 6.5cqmin;
  }
`;

export default function MysteryCardArt({
  level,
  className,
  style
}: {
  level?: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const patternId = `mystery-card-dots-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const colorKey = cardLevelHash[Number(level)]?.color || 'logoBlue';
  const accent =
    colorKey === 'midnightBlack'
      ? (opacity: number) => `rgba(214, 223, 242, ${opacity})`
      : (opacity: number) =>
          (Color as Record<string, (opacity?: number) => string>)[colorKey](
            opacity
          );

  return (
    <div
      className={`${mysteryCardArt}${className ? ` ${className}` : ''}`}
      style={
        {
          '--mystery-card-frame': accent(0.5),
          '--mystery-card-diamond': accent(0.65),
          '--mystery-card-diamond-fill': accent(0.12),
          ...style
        } as React.CSSProperties
      }
    >
      <svg className="mystery-card-art__dots" aria-hidden="true">
        <defs>
          <pattern
            id={patternId}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.3" cy="1.3" r="1.3" fill={accent(0.25)} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className="mystery-card-art__frame" />
      <div className="mystery-card-art__diamond" />
      <span className="mystery-card-art__spark mystery-card-art__spark--top">
        ✦
      </span>
      <span className="mystery-card-art__spark mystery-card-art__spark--bottom">
        ✦
      </span>
      <span className="mystery-card-art__question">?</span>
    </div>
  );
}
