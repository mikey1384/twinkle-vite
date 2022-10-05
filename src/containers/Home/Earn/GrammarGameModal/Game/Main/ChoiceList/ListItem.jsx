import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

ListItem.propTypes = {
  answerIndex: PropTypes.number,
  listItem: PropTypes.string.isRequired,
  index: PropTypes.number,
  onCorrectAnswer: PropTypes.func.isRequired,
  onSetGotWrong: PropTypes.func,
  selectedChoiceIndex: PropTypes.number
};

export default function ListItem({
  listItem,
  index,
  answerIndex,
  selectedChoiceIndex,
  onCorrectAnswer,
  onSetGotWrong
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
      onMouseDown={handleSelect}
      key={index}
    >
      <div style={{ padding: '0', textAlign: 'center' }}>
        {isWrong ? 'Wrong!' : listItem}
      </div>
    </nav>
  );

  function handleSelect() {
    if (index === answerIndex) {
      onCorrectAnswer();
    } else {
      onSetGotWrong(index);
    }
  }
}
