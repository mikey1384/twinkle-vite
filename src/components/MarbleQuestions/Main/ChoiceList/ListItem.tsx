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
        padding: 1rem;
        width: 100%;
        cursor: ${isCompleted ? 'default' : 'pointer'};
        /* Improve mobile tap behavior */
        touch-action: manipulation;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        /* Apply hover effects only on devices that actually support hover */
        @media (hover: hover) and (pointer: fine) {
          &:hover {
            &.wrong {
              color: #fff;
              border: 1px solid ${Color.red()};
              background: ${Color.red()};
            }
            background: ${Color.highlightGray()};
          }
        }
        /* Provide active feedback on touch devices */
        @media (hover: none) {
          &:active {
            background: ${Color.highlightGray()};
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
