import React from 'react';
import GroupItem from './GroupItem';

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
    <div className="selected-groups">
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
