import React from 'react';
import SortableListItem from '~/components/SortableListItem';
import { css } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';

export default function PartOfSpeechesList({
  onListItemMove,
  partOfSpeeches
}: {
  onListItemMove: (v: any) => void;
  partOfSpeeches: string[];
}) {
  return (
    <div
      className={css`
        width: 100%;
        cursor: ns-resize;
        display: flex;
        flex-direction: column;
        nav {
          align-items: center;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          margin-bottom: -1px;
          border: 1px solid ${Color.borderGray()};
        }
        nav:first-of-type {
          border-top-left-radius: ${borderRadius};
          border-top-right-radius: ${borderRadius};
        }
        nav:last-child {
          border-bottom-left-radius: ${borderRadius};
          border-bottom-right-radius: ${borderRadius};
        }
      `}
    >
      {partOfSpeeches.map((pos, index) => {
        return (
          <SortableListItem
            numbered
            key={pos}
            index={index}
            listItemId={pos}
            listItemLabel={pos}
            onMove={onListItemMove}
          />
        );
      })}
    </div>
  );
}
