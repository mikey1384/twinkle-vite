import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import {
  NEON,
  PIXEL_FONT,
  READ_FONT,
  rgba,
  sparkFly
} from '../../../ClassicArcade/theme';

// Where each pixel spark of the right-answer burst flies to.
const SPARKS: [number, number, number][] = [
  [-70, -26, 8],
  [-48, 24, 6],
  [-20, -34, 6],
  [8, 30, 8],
  [34, -30, 6],
  [60, 22, 6],
  [82, -14, 8],
  [-90, 6, 6],
  [100, 10, 6],
  [0, -40, 6]
];

export default function ListItem({
  listItem,
  index,
  answerIndex,
  selectedChoiceIndex,
  isPending,
  onSelect,
  isCompleted
}: {
  listItem: string;
  index: number;
  answerIndex?: number;
  selectedChoiceIndex: number;
  // Being checked on the server: looks pressed, the same as hovering it.
  isPending?: boolean;
  onSelect: (arg0: number) => void;
  isCompleted?: boolean;
}) {
  const isWrong = useMemo(
    () => selectedChoiceIndex === index && selectedChoiceIndex !== answerIndex,
    [answerIndex, index, selectedChoiceIndex]
  );
  // only decides whether the spark burst is drawn
  const isRightPick =
    selectedChoiceIndex === index && selectedChoiceIndex === answerIndex;
  // alternate cyan and violet rims, like the cover's track lights
  const rimRgb = index % 2 === 0 ? NEON.cyanRgb : NEON.violetRgb;
  return (
    <nav
      className={`${
        selectedChoiceIndex === index
          ? selectedChoiceIndex === answerIndex
            ? 'correct '
            : 'wrong '
          : ''
      }${isPending ? 'pending ' : ''}unselectable ${css`
        position: relative;
        padding: 1.2rem 1.6rem;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: ${isCompleted ? 'default' : 'pointer'};
        min-height: 52px;
        border-radius: 14px;
        font-family: ${READ_FONT};
        font-weight: 700;
        line-height: 1.35;
        /* Neutral state: a dark glass arcade button with a neon rim */
        &:not(.correct):not(.wrong) {
          color: #f3f6ff;
          background: linear-gradient(
            180deg,
            rgba(34, 42, 122, 0.82) 0%,
            rgba(14, 18, 64, 0.92) 100%
          );
          border: 2px solid ${rgba(rimRgb, 0.6)};
          box-shadow:
            0 4px 0 #050824,
            0 0 12px ${rgba(rimRgb, 0.22)},
            inset 0 1px 0 rgba(255, 255, 255, 0.14);
        }
        &.pending:not(.correct):not(.wrong) {
          transform: translateY(3px);
          border-color: ${rgba(rimRgb, 1)};
          box-shadow:
            0 1px 0 #050824,
            0 0 18px ${rgba(rimRgb, 0.5)};
        }
        transition:
          background 0.15s ease,
          transform 0.08s ease,
          box-shadow 0.15s ease,
          border-color 0.15s ease;
        /* Improve mobile tap behavior */
        touch-action: manipulation;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        .key-hint {
          display: none;
        }
        /* Apply hover effects only on devices that actually support hover */
        @media (hover: hover) and (pointer: fine) {
          padding-left: 3.2rem;
          padding-right: 3.2rem;
          &:not(.correct):not(.wrong):hover {
            border-color: ${rgba(rimRgb, 1)};
            box-shadow:
              0 4px 0 #050824,
              0 0 20px ${rgba(rimRgb, 0.5)},
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          .key-hint {
            display: block;
          }
        }
        /* Press-down on tap or click */
        &:not(.correct):active {
          transform: translateY(3px);
          box-shadow:
            0 1px 0 #050824,
            0 0 16px ${rgba(rimRgb, 0.45)};
        }
      `}`}
      onPointerDown={() => onSelect(index)}
      onClick={() => onSelect(index)}
      key={index}
    >
      {index < 4 ? (
        // the keyboard key that picks this choice (1-4), on desktop only
        <span
          aria-hidden
          className={`key-hint ${css`
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            font-family: ${PIXEL_FONT};
            font-size: 1rem;
            color: ${rgba(rimRgb, 0.75)};
            pointer-events: none;
          `}`}
        >
          {index + 1}
        </span>
      ) : null}
      <div style={{ padding: '0', textAlign: 'center' }}>
        {isWrong ? 'Wrong!' : listItem}
      </div>
      {isRightPick ? (
        <span
          aria-hidden
          className={css`
            position: absolute;
            left: 50%;
            top: 50%;
            width: 0;
            height: 0;
            pointer-events: none;
            z-index: 2;
          `}
        >
          {SPARKS.map(([dx, dy, size], i) => (
            <span
              key={i}
              className={css`
                position: absolute;
                left: 0;
                top: 0;
                width: ${size}px;
                height: ${size}px;
                opacity: 0;
                background: ${i % 3 === 2 ? '#ffffff' : 'var(--cg-grade, #ffd54a)'};
                box-shadow: 0 0 8px
                  ${i % 3 === 2 ? NEON.green : 'var(--cg-grade, #ffd54a)'};
                animation: ${sparkFly} 700ms cubic-bezier(0.2, 0.7, 0.3, 1)
                  forwards;
                animation-delay: ${(i % 4) * 25}ms;
              `}
              style={
                {
                  '--dx': `${dx * 2}px`,
                  '--dy': `${dy * 1.6}px`
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      ) : null}
    </nav>
  );
}
