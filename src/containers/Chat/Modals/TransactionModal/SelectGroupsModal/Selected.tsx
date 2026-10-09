import React, { useMemo } from 'react';
import GroupItem from './GroupItem';
import { css } from '@emotion/css';

export default function Selected({
  groupObjs,
  selectedGroupIds,
  onSetSelectedGroupIds
}: {
  groupObjs: Record<number, any>;
  selectedGroupIds: number[];
  onSetSelectedGroupIds: (v: number[]) => void;
}) {
  const selectedGroups = useMemo(
    () => selectedGroupIds.map((id) => groupObjs[id]).filter(Boolean),
    [groupObjs, selectedGroupIds]
  );

  const noGroupsLabel = (
    <div
      className={css`
        font-weight: bold;
        font-size: 1.7rem;
        @media (max-width: 768px) {
          font-size: 1.5rem;
        }
      `}
    >
      {`You haven't selected any groups`}
    </div>
  );

  return (
    <div
      className={css`
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1.4rem;
        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      `}
    >
      {selectedGroups.length ? (
        selectedGroups.map((group) => (
          <GroupItem
            key={`selected-${group.id}`}
            group={group}
            isSelectedTabActive
            onDeselect={() => handleRemoveGroup(group.id)}
            noHoverEffect
          />
        ))
      ) : (
        <div
          style={{
            width: '100%',
            height: '20rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gridColumn: '1 / -1'
          }}
        >
          {noGroupsLabel}
        </div>
      )}
    </div>
  );

  function handleRemoveGroup(groupId: number) {
    const updatedSelectedIds = selectedGroupIds.filter((id) => id !== groupId);
    onSetSelectedGroupIds(updatedSelectedIds);
  }
}
