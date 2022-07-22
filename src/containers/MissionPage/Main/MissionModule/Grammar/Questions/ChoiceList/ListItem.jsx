import React from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

ListItem.propTypes = {
  answerIndex: PropTypes.number,
  conditionPassStatus: PropTypes.string.isRequired,
  listItem: PropTypes.object.isRequired,
  index: PropTypes.number,
  onSelect: PropTypes.func.isRequired
};
export default function ListItem({
  answerIndex,
  conditionPassStatus,
  listItem,
  onSelect,
  index
}) {
  return (
    <nav
      className={css`
        display: flex;
        align-items: center;
        width: 100%;
        cursor: pointer;
        &:hover {
          background: ${Color.highlightGray()};
        }
      `}
      onClick={handleSelect}
      key={index}
    >
      <section
        className={css`
          height: 4.3rem;
          width: 4.3rem;
          background: ${Color.checkboxAreaGray()};
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        <input
          type="checkbox"
          checked={listItem.checked}
          onChange={handleSelect}
        />
      </section>
      <div style={{ padding: '0 2rem', display: 'flex', alignItems: 'center' }}>
        <div dangerouslySetInnerHTML={{ __html: listItem.label }} />
        {conditionPassStatus === 'fail' && index === answerIndex && (
          <Icon
            style={{ color: Color.green(), marginLeft: '1rem' }}
            icon="check"
          />
        )}
        {conditionPassStatus === 'fail' && listItem.checked && (
          <Icon
            style={{ color: Color.rose(), marginLeft: '1rem' }}
            icon="times"
          />
        )}
      </div>
    </nav>
  );

  function handleSelect() {
    if (conditionPassStatus && conditionPassStatus !== '') {
      return;
    }
    onSelect(index);
  }
}
