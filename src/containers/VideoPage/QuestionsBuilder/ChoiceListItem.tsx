import React from 'react';
import { useDragSort } from '~/helpers/hooks';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

export default function ChoiceListItem({
  checked,
  checkDisabled,
  id,
  label,
  onMove,
  onSelect,
  placeholder,
  questionIndex
}: {
  checked: boolean;
  checkDisabled: boolean;
  id: number;
  label: string;
  onMove: (v: any) => void;
  onSelect: (v: any) => void;
  placeholder: string;
  questionIndex: number;
}) {
  const { isDragging, dragProps } = useDragSort({
    group: `choice-${questionIndex}`,
    id,
    onMove
  });

  return (
    <nav
      {...dragProps}
      style={{
        opacity: isDragging ? 0 : 1,
        cursor: !checkDisabled ? 'ns-resize' : '',
        touchAction: 'none'
      }}
      className="unselectable"
    >
      <main>
        <section>
          <div style={{ width: '10%' }}>
            <Icon icon="align-justify" style={{ color: Color.borderGray() }} />
          </div>
          <div
            style={{
              width: '90%',
              color: !label ? '#999' : ''
            }}
          >
            {label || placeholder}
          </div>
        </section>
      </main>
      <aside>
        <input
          type="radio"
          onChange={onSelect}
          checked={checked}
          disabled={checkDisabled}
          style={{ cursor: !checkDisabled ? 'pointer' : '' }}
        />
      </aside>
    </nav>
  );
}
