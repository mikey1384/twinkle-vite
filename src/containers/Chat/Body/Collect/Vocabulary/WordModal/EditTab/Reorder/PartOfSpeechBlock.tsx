import React from 'react';
import SortableListItem from '~/components/SortableListItem';
import { borderRadius, Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function PartOfSpeechBlock({
  deletedDefIds,
  type,
  onListItemMove,
  defIds,
  posObject,
  style
}: {
  deletedDefIds: number[];
  type: string;
  onListItemMove: (v: any) => void;
  defIds: number[];
  posObject: { [key: number]: any };
  style?: React.CSSProperties;
}) {
  return defIds?.length > 0 ? (
    <div style={style}>
      <p
        style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}
      >
        {type}
      </p>
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
        {defIds
          .filter((id) => !deletedDefIds.includes(id))
          .map((id, index) => {
            return (
              <SortableListItem
                numbered
                key={id}
                index={index}
                listItemId={id}
                listItemLabel={posObject[id]?.title}
                listItemType={type}
                onMove={onListItemMove}
              />
            );
          })}
      </div>
    </div>
  ) : null;
}
