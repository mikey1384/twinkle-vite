import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useDrag, useDrop } from 'react-dnd';
import ItemTypes from '~/constants/itemTypes';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

ChoiceListItem.propTypes = {
  id: PropTypes.number.isRequired,
  onSelect: PropTypes.func,
  checked: PropTypes.bool,
  checkDisabled: PropTypes.bool,
  label: PropTypes.string,
  onMove: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  questionIndex: PropTypes.number.isRequired
};

export default function ChoiceListItem({
  checked,
  checkDisabled,
  id,
  label,
  onMove,
  onSelect,
  placeholder,
  questionIndex
}) {
  const Draggable = useRef(null);
  const [{ opacity }, drag] = useDrag({
    type: ItemTypes.LIST_ITEM,
    item: { id, questionIndex },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0 : 1
    })
  });
  const [, drop] = useDrop({
    accept: ItemTypes.LIST_ITEM,
    hover(item) {
      if (!Draggable.current) {
        return;
      }
      if (item.id === id) {
        return;
      }
      if (item.questionIndex !== questionIndex) {
        return;
      }
      onMove({ sourceId: item.id, targetId: id });
    }
  });

  return (
    <nav
      ref={drag(drop(Draggable))}
      style={{
        opacity,
        cursor: !checkDisabled && 'ns-resize'
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
              color: !label && '#999'
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
          style={{ cursor: !checkDisabled && 'pointer' }}
        />
      </aside>
    </nav>
  );
}
