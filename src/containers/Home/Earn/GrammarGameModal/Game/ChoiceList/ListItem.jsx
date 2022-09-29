import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

ListItem.propTypes = {
  conditionPassStatus: PropTypes.string.isRequired,
  listItem: PropTypes.object.isRequired,
  index: PropTypes.number,
  onSelect: PropTypes.func.isRequired
};
export default function ListItem({
  conditionPassStatus,
  listItem,
  onSelect,
  index
}) {
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
      onClick={handleSelect}
      key={index}
    >
      <div style={{ padding: '0', textAlign: 'center' }}>
        <div dangerouslySetInnerHTML={{ __html: listItem.label }} />
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
