import React, { useMemo, useRef } from 'react';
import ItemTypes from '~/constants/itemTypes';
import Icon from '~/components/Icon';
import { useDrag, useDrop } from 'react-dnd';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function SortableListItem({
  index,
  listItemId,
  listItemLabel,
  listItemType,
  numbered,
  onMove
}: {
  index: number;
  listItemId: number | string;
  listItemLabel: React.ReactNode;
  listItemType?: string;
  numbered?: boolean;
  onMove: (arg0: any) => void;
}) {
  const Draggable = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.LIST_ITEM,
    item: {
      id: listItemId,
      index,
      itemType: listItemType
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });
  const [{ isOver }, drop] = useDrop({
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
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true })
    })
  });
  const rowStyle = useMemo(() => {
    const active = isOver && !isDragging;
    return {
      opacity: isDragging ? 0.45 : 1,
      transform: isDragging ? 'scale(0.98)' : 'scale(1)',
      borderColor: active ? Color.logoBlue(0.35) : 'var(--ui-border)',
      background: active ? Color.whiteBlueGray(0.9) : '#fff',
      boxShadow: active
        ? '0 18px 30px -26px rgba(15, 23, 42, 0.45)'
        : '0 12px 24px -24px rgba(15, 23, 42, 0.35)'
    };
  }, [isDragging, isOver]);

  return (
    <nav
      ref={drag(drop(Draggable)) as any}
      style={rowStyle}
      className={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 1.2rem 1.5rem;
        border-radius: ${borderRadius};
        border: 1px solid var(--ui-border);
        transition:
          transform 120ms ease,
          box-shadow 140ms ease,
          border-color 140ms ease,
          background 140ms ease;
        cursor: grab;
        touch-action: none;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.1rem 1.3rem;
        }
        &:active {
          cursor: grabbing;
        }
      `}
    >
      <section
        className={css`
          display: flex;
          align-items: center;
          gap: 0.9rem;
          color: ${Color.darkerGray()};
          font-weight: 600;
          font-size: 1.6rem;
          line-height: 1.4;
          word-break: break-word;
        `}
      >
        {numbered && (
          <span
            className={css`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 2.2rem;
              height: 2.2rem;
              border-radius: 999px;
              background: ${Color.highlightGray()};
              color: ${Color.darkGray()};
              font-size: 1.1rem;
              font-weight: 700;
            `}
          >
            {index + 1}
          </span>
        )}
        <span>{listItemLabel}</span>
      </section>
      <div
        className={css`
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 0.6rem;
          border-radius: 999px;
          background: ${Color.highlightGray()};
          border: 1px solid ${Color.borderGray(0.7)};
          color: ${Color.darkGray()};
        `}
      >
        <Icon icon="align-justify" />
      </div>
    </nav>
  );
}
