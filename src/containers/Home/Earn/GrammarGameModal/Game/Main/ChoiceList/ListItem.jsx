import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

ListItem.propTypes = {
  answerIndex: PropTypes.number,
  gotWrong: PropTypes.bool,
  listItem: PropTypes.string.isRequired,
  index: PropTypes.number,
  isCompleted: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  selectedChoiceIndex: PropTypes.number
};

export default function ListItem({
  listItem,
  index,
  gotWrong,
  answerIndex,
  selectedChoiceIndex,
  onSelect,
  isCompleted
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
      onMouseDown={() => (gotWrong ? null : onSelect(index))}
      key={index}
    >
      <div style={{ padding: '0', textAlign: 'center' }}>
        {isWrong ? 'Wrong!' : listItem}
      </div>
    </nav>
  );
}
