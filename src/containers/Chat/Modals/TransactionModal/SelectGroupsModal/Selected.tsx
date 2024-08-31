import React from 'react';
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
  const selectedGroups = groups.filter((group) =>
    selectedGroupIds.includes(group.id)
  );

  const handleRemoveGroup = (groupId: number) => {
    const updatedSelectedIds = selectedGroupIds.filter((id) => id !== groupId);
    onSetSelectedGroupIds(updatedSelectedIds);
  };

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
          key={group.id}
          group={group}
          isSelected={true}
          onSelect={() => handleRemoveGroup(group.id)}
          onDeselect={() => handleRemoveGroup(group.id)}
        />
      ))}
    </div>
  );
}
