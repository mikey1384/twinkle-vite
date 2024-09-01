import React, { useMemo } from 'react';
import SelectedGroupItem from './SelectedGroupItem';
import ShowMoreGroupsButton from './ShowMoreGroupsButton';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function SelectedGroups({
  selectedGroups,
  onDeselectGroup,
  onShowGroupSelector
}: {
  selectedGroups: Array<{
    id: number;
    channelName: string;
    thumbPath?: string;
    members: any[];
    isPublic?: boolean;
  }>;
  onDeselectGroup: (id: number) => void;
  onShowGroupSelector: () => void;
}) {
  const displayedGroups = useMemo(() => {
    const numShown = deviceIsMobile ? 3 : 5;
    return selectedGroups.slice(0, numShown);
  }, [selectedGroups]);

  const numMore = selectedGroups.length - displayedGroups.length;

  return (
    <div
      className={css`
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        width: 100%;
      `}
    >
      {displayedGroups.map((group) => (
        <SelectedGroupItem
          key={group.id}
          group={group}
          onDeselect={onDeselectGroup}
        />
      ))}
      <ShowMoreGroupsButton onClick={onShowGroupSelector} numMore={numMore} />
    </div>
  );
}
