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
  onSelect: Function;
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
        &:hover {
          &.wrong {
            color: #fff;
            border: 1px solid ${Color.red()};
            background: ${Color.red()};
          }
          background: ${Color.highlightGray()};
        }
      `}`}
      onMouseDown={() => onSelect(index)}
      key={index}
    >
      <div style={{ padding: '0', textAlign: 'center' }}>
        {isWrong ? 'Wrong!' : listItem}
      </div>
    </nav>
  );
}
