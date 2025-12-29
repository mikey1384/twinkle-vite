import React, { useMemo } from 'react';
import SortableListGroup from '~/components/SortableListGroup';

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
  const filteredDefIds = useMemo(
    () => defIds.filter((id) => !deletedDefIds.includes(id)),
    [defIds, deletedDefIds]
  );
  return defIds?.length > 0 ? (
    <div style={style}>
      <p
        style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}
      >
        {type}
      </p>
      <SortableListGroup
        numbered
        listItemLabel="title"
        listItemObj={posObject}
        itemIds={filteredDefIds}
        listItemType={type}
        onMove={onListItemMove}
      />
    </div>
  ) : null;
}
