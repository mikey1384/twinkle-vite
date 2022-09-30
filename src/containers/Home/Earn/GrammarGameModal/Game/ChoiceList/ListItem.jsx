import { useEffect, useState } from 'react';
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
  onSelect,
  index,
  answerIndex,
  selectedChoiceIndex
}) {
  const [className, setClassName] = useState('');
  useEffect(() => {
    if (selectedChoiceIndex === answerIndex && selectedChoiceIndex === index) {
      setClassName('correct ');
    }
  }, [selectedChoiceIndex, answerIndex, index]);

  return (
    <nav
      className={`${className}${css`
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
      <div style={{ padding: '0', textAlign: 'center' }}>
        <div dangerouslySetInnerHTML={{ __html: listItem }} />
      </div>
    </nav>
  );

  function handleSelect() {
    onSelect(index);
  }
}
