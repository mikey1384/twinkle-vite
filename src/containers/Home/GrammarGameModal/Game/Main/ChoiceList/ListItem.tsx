import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function ListItem({
  listItem,
  index,
  answerIndex,
  selectedChoiceIndex,
  onSelect,
  isCompleted
}: {
  listItem: string;
  index: number;
  answerIndex: number;
  selectedChoiceIndex: number;
  onSelect: (arg0: number) => void;
  isCompleted?: boolean;
}) {
  const isWrong = useMemo(
    () => selectedChoiceIndex === index && selectedChoiceIndex !== answerIndex,
    [answerIndex, index, selectedChoiceIndex]
  );
  return (
    <nav
      className={`${
        selectedChoiceIndex === index
          ? selectedChoiceIndex === answerIndex
            ? 'correct '
            : 'wrong '
          : ''
      }unselectable ${css`
        padding: 1.1rem 1.25rem;
        width: 100%;
        cursor: ${isCompleted ? 'default' : 'pointer'};
        min-height: 48px;
        border-radius: 12px;
        /* Default surface for neutral state (no borders) */
        &:not(.correct):not(.wrong) {
          background: ${Color.whiteGray()};
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.045);
        }
        transition: background 0.15s ease, transform 0.08s ease,
          box-shadow 0.15s ease;
        /* Improve mobile tap behavior */
        touch-action: manipulation;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        /* Apply hover effects only on devices that actually support hover */
        @media (hover: hover) and (pointer: fine) {
          &:not(.correct):hover {
            background: ${Color.highlightGray()};
          }
          &.wrong:hover {
            color: #fff;
            border: 0;
            background: ${Color.red()};
          }
        }
        /* Provide active feedback on touch devices */
        @media (hover: none) {
          &:not(.correct):active {
            background: ${Color.highlightGray()};
            transform: scale(0.995);
          }
        }
      `}`}
      onPointerDown={() => onSelect(index)}
      onClick={() => onSelect(index)}
      key={index}
    >
      <div style={{ padding: '0', textAlign: 'center' }}>
        {isWrong ? 'Wrong!' : listItem}
      </div>
    </nav>
  );
}
