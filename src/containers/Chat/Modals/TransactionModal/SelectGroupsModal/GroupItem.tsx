import React from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, borderRadius } from '~/constants/css';
import Icon from '~/components/Icon';
import { getColorFromName } from '~/helpers/stringHelpers';

interface GroupItemProps {
  group: {
    id: number;
    channelName: string;
    thumbPath?: string;
    members: any[];
    isPublic?: boolean;
  };
  isSelected: boolean;
  onSelect: (groupId: number) => void;
  onDeselect: (groupId: number) => void;
}

export default function GroupItem({
  group,
  isSelected,
  onSelect,
  onDeselect
}: GroupItemProps) {
  const bgColor = getColorFromName(group.channelName);

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 1rem;
        cursor: pointer;
        border-radius: ${borderRadius};
        background-color: ${isSelected ? Color.highlightGray() : 'white'};
        border: 1px solid ${Color.borderGray()};
        transition: all 0.2s;
        &:hover {
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
      `}
      onClick={() => (isSelected ? onDeselect(group.id) : onSelect(group.id))}
    >
      <div
        className={css`
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          margin-right: 1.5rem;
          flex-shrink: 0;
          background-color: ${group.thumbPath ? Color.lightGray() : bgColor};
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
          <div
            className={css`
              font-size: 2rem;
              font-weight: bold;
              color: white;
              font-family: 'Roboto', sans-serif;
            `}
          >
            {group.channelName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div
        className={css`
          flex-grow: 1;
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            margin-bottom: 0.3rem;
          `}
        >
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: bold;
              color: ${Color.darkerGray()};
              margin-right: 0.5rem;
            `}
          >
            {group.channelName}
          </div>
          {group.isPublic && (
            <span
              className={css`
                padding: 0.2rem 0.4rem;
                background-color: ${Color.logoBlue()};
                color: white;
                border-radius: 0.3rem;
                font-size: 0.8rem;
                font-weight: bold;
              `}
            >
              Public
            </span>
          )}
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
