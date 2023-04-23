import React, { useRef } from 'react';
import ItemTypes from '~/constants/itemTypes';
import Icon from '~/components/Icon';
import { useDrag, useDrop } from 'react-dnd';
import { Color } from '~/constants/css';

export default function SortableListItem({
  index,
  listItemId,
  listItemLabel,
  listItemType,
  numbered,
  onMove
}: {
  index: number;
  listItemId: number;
  listItemLabel: string;
  listItemType?: string;
  numbered?: boolean;
  onMove: (arg0: { sourceId: number; targetId: number }) => void;
}) {
  const Draggable = useRef(null);
  const [{ opacity }, drag] = useDrag({
    type: ItemTypes.LIST_ITEM,
    item: {
      id: listItemId,
      index,
      itemType: listItemType
    },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0 : 1
    })
  });
  const [, drop] = useDrop({
    accept: ItemTypes.LIST_ITEM,
    hover(item: any) {
      if (!Draggable.current) {
        return;
      }
      if (item.id === listItemId) {
        return;
      }
      if (listItemType && item.itemType !== listItemType) {
        return;
      }
      onMove({ sourceId: item.id, targetId: listItemId });
    }
  });

  return (
    <nav
      ref={drag(drop(Draggable)) as any}
      style={{
        opacity,
        borderTop: index === 0 ? `1px solid ${Color.borderGray()}` : '',
        color: Color.darkerGray()
      }}
    >
      <section>
        {numbered ? `${index + 1}. ` : ''}
        {listItemLabel}
      </section>
      <Icon icon="align-justify" style={{ color: Color.darkerBorderGray() }} />
    </nav>
  );
}
