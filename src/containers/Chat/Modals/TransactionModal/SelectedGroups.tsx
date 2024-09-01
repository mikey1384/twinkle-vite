import React from 'react';
import { css } from '@emotion/css';
import SelectedGroupItem from './SelectedGroupItem';

export default function SelectedGroups({
  style,
  selectedGroups,
  onDeselectGroup
}: {
  style?: React.CSSProperties;
  selectedGroups: Array<{
    id: number;
    channelName: string;
    thumbPath?: string;
  }>;
  onDeselectGroup: (groupId: number) => void;
}) {
  return (
    <div style={style}>
      {selectedGroups.map((group) => (
        <div
          key={group.id}
          className={css`
            margin-bottom: 1rem;
          `}
        >
          <SelectedGroupItem group={group} onDeselect={onDeselectGroup} />
        </div>
      ))}
    </div>
  );
}
