import React, { memo, useCallback } from 'react';
import Textarea from '~/components/Texts/Textarea';

function EditChoiceListItem({
  checked,
  choiceId,
  onEdit,
  onSelect,
  placeholder,
  text
}: {
  checked: boolean;
  choiceId: number;
  onEdit: (v: any) => void;
  onSelect: (v: any) => void;
  placeholder: string;
  text: string;
}) {
  const handleEdit = useCallback(
    (event: any) => {
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
