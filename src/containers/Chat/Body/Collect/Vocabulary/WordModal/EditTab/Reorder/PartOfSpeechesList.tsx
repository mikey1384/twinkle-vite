import React, { useMemo } from 'react';
import SortableListGroup from '~/components/SortableListGroup';

export default function PartOfSpeechesList({
  onListItemMove,
  partOfSpeeches
}: {
  onListItemMove: (v: any) => void;
  partOfSpeeches: string[];
}) {
  const listItemObj = useMemo(() => {
    const obj: Record<string, { label: string }> = {};
    for (const pos of partOfSpeeches) {
      obj[pos] = { label: pos };
    }
    return obj;
  }, [partOfSpeeches]);
  return (
    <SortableListGroup
      numbered
      listItemObj={listItemObj}
      itemIds={partOfSpeeches}
      onMove={onListItemMove}
    />
  );
}
