import React from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, borderRadius } from '~/constants/css';
import Icon from '~/components/Icon';

interface GroupItemProps {
  group: {
    id: number;
    channelName: string;
    thumbPath?: string;
    members: any[];
  };
  isSelected: boolean;
  onSelect: (groupId: number) => void;
}

export default function GroupItem({
  group,
  isSelected,
  onSelect
}: GroupItemProps) {
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 1rem;
        cursor: pointer;
        border-radius: ${borderRadius};
        background-color: ${isSelected ? Color.highlightGray() : 'transparent'};
        &:hover {
          background-color: ${Color.highlightGray()};
        }
      `}
      onClick={() => onSelect(group.id)}
    >
      <div
        className={css`
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          margin-right: 1.5rem;
          flex-shrink: 0;
          background-color: ${Color.lightGray()};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        `}
      >
        {group.thumbPath ? (
          <img
            src={`${cloudFrontURL}/thumbs/${group.thumbPath}/thumb.png`}
            alt={group.channelName}
            className={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
            `}
          />
        ) : (
          <Icon icon="users" style={{ fontSize: '2rem' }} />
        )}
      </div>
      <div
        className={css`
          flex-grow: 1;
        `}
      >
        <div
          className={css`
            font-size: 1.3rem;
            font-weight: bold;
            color: ${Color.darkerGray()};
          `}
        >
          {group.channelName}
        </div>
        <div
          className={css`
            font-size: 1.1rem;
            color: ${Color.gray()};
          `}
        >
          {group.members.length} members
        </div>
      </div>
      {isSelected && (
        <Icon
          icon="check"
          style={{
            marginLeft: '1rem',
            color: Color.green(),
            fontSize: '1.5rem'
          }}
        />
      )}
    </div>
  );
}
