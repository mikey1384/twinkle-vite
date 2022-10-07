import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

ListItem.propTypes = {
  answerIndex: PropTypes.number,
  listItem: PropTypes.string.isRequired,
  index: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  selectedChoiceIndex: PropTypes.number
};

export default function ListItem({
  listItem,
  index,
  answerIndex,
  selectedChoiceIndex,
  onSelect
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
        cursor: pointer;
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
