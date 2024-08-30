import React from 'react';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function SelectedGroups({
  style,
  selectedGroupIds,
  onDeselect
}: {
  style?: React.CSSProperties;
  selectedGroupIds: number[];
  onDeselect: (id: number) => void;
}) {
  return (
    <div style={style}>
      {selectedGroupIds.map((groupId) => (
        <div
          key={groupId}
          className={css`
            border: 1px solid ${Color.borderGray()};
            padding: 1rem;
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          `}
        >
          <span>Group ID: {groupId}</span>
          <Button color="rose" onClick={() => onDeselect(groupId)}>
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
