import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Textarea from '~/components/Texts/Textarea';

EditChoiceListItem.propTypes = {
  checked: PropTypes.bool.isRequired,
  choiceId: PropTypes.number.isRequired,
  onEdit: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  text: PropTypes.string
};

function EditChoiceListItem({
  checked,
  choiceId,
  onEdit,
  onSelect,
  placeholder,
  text
}) {
  const handleEdit = useCallback(
    (event) => {
      onEdit({ choiceId, text: event.target.value });
    },
    [choiceId, onEdit]
  );

  return (
    <nav>
      <main>
        <Textarea
          onChange={handleEdit}
          value={text}
          placeholder={placeholder}
        />
      </main>
      <aside>
        <input
          type="radio"
          onChange={onSelect}
          checked={checked}
          style={{ cursor: 'pointer' }}
        />
      </aside>
    </nav>
  );
}

export default memo(EditChoiceListItem);
