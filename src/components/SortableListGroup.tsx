import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import SortableListItem from './SortableListItem';
import { mobileMaxWidth } from '~/constants/css';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';

const Backend = isMobile(navigator) ? TouchBackend : HTML5Backend;

export default function SortableListGroup({
  listItemObj,
  listItemLabel = 'label',
  onMove,
  itemIds,
  listItemType,
  numbered,
  style
}: {
  listItemObj: any;
  listItemLabel?: string;
  onMove: (arg0: { sourceId: number; targetId: number }) => void;
  itemIds: any[];
  listItemType?: string;
  numbered?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <DndProvider backend={Backend}>
      <div
        style={style}
        className={css`
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          padding: 0.2rem 0.1rem;
          @media (max-width: ${mobileMaxWidth}) {
            gap: 0.7rem;
          }
        `}
      >
        {itemIds.map((id, index) => {
          const label =
            listItemObj[id]?.[listItemLabel] ??
            listItemObj[id]?.label ??
            id;
          return (
            <SortableListItem
              numbered={numbered}
              key={id}
              index={index}
              listItemId={id}
              listItemLabel={label}
              listItemType={listItemType}
              onMove={onMove}
            />
          );
        })}
      </div>
    </DndProvider>
  );
}
