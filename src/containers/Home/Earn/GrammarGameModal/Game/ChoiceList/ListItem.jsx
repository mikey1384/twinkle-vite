import { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

ListItem.propTypes = {
  answerIndex: PropTypes.number,
  listItem: PropTypes.string.isRequired,
  index: PropTypes.number,
  onCorrectAnswer: PropTypes.func.isRequired,
  onSetGotWrong: PropTypes.func
};

export default function ListItem({
  listItem,
  index,
  answerIndex,
  onCorrectAnswer,
  onSetGotWrong
}) {
  const [className, setClassName] = useState('');
  return (
    <nav
      className={`${className}unselectable ${css`
        padding: 1rem;
        width: 100%;
        cursor: pointer;
        &:hover {
          background: ${Color.highlightGray()};
        }
      `}`}
      onMouseDown={handleSelect}
      key={index}
    >
      <div style={{ padding: '0', textAlign: 'center' }}>{listItem}</div>
    </nav>
  );

  function handleSelect() {
    if (index === answerIndex) {
      setClassName('correct ');
      onCorrectAnswer();
    } else {
      onSetGotWrong(true);
      setTimeout(() => {
        onSetGotWrong(false);
      }, 100);
    }
  }
}
