import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

ListItem.propTypes = {
  listItem: PropTypes.string.isRequired,
  index: PropTypes.number,
  onSelect: PropTypes.func.isRequired
};
export default function ListItem({ listItem, onSelect, index }) {
  return (
    <nav
      className={css`
        padding: 1rem;
        width: 100%;
        cursor: pointer;
        &:hover {
          background: ${Color.highlightGray()};
        }
      `}
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
