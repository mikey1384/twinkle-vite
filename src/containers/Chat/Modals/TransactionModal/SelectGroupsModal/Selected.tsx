import React, { useMemo } from 'react';
import GroupItem from './GroupItem';
import { css } from '@emotion/css';

export default function Selected({
  groups,
  selectedGroupIds,
  onSetSelectedGroupIds
}: {
  groups: any[];
  selectedGroupIds: number[];
  onSetSelectedGroupIds: (v: number[]) => void;
}) {
  const selectedGroups = useMemo(
    () => groups.filter((group) => selectedGroupIds.includes(group.id)),
    [groups, selectedGroupIds]
  );

  return (
    <div
      className={css`
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      `}
    >
      {selectedGroups.map((group) => (
        <GroupItem
          key={`selected-${group.id}`}
          group={group}
          isSelectedTabActive
          onDeselect={() => handleRemoveGroup(group.id)}
          noHoverEffect
        />
      ))}
    </div>
  );

  function handleRemoveGroup(groupId: number) {
    const updatedSelectedIds = selectedGroupIds.filter((id) => id !== groupId);
    onSetSelectedGroupIds(updatedSelectedIds);
  }
}
