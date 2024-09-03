import React from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, borderRadius } from '~/constants/css';
import Icon from '~/components/Icon';
import { getColorFromName } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';

export default function GroupItem({
  group,
  isSelectedTabActive,
  onSelect,
  onDeselect,
  isSelected,
  noHoverEffect
}: {
  group: {
    id: number;
    channelName: string;
    thumbPath?: string;
    members: any[];
    allMemberIds: number[];
    isPublic?: boolean;
  };
  onSelect?: (groupId: number) => void;
  onDeselect?: (groupId: number) => void;
  isSelectedTabActive?: boolean;
  isSelected?: boolean;
  noHoverEffect?: boolean;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const bgColor = getColorFromName(group.channelName);

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 1rem;
        cursor: pointer;
        border-radius: ${borderRadius};
        border: ${isSelected ? '2px' : '1px'} solid
          ${isSelected ? Color[profileTheme]() : Color.borderGray()};
        transform: ${isSelected ? 'scale(1.02)' : 'scale(1)'};
        &:hover {
          ${!noHoverEffect &&
          `
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            transform: ${isSelected ? 'scale(1.02)' : 'scale(1.01)'};
          `}
        }
        @keyframes popIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
          }
        }
      `}
      onClick={() =>
        isSelected || isSelectedTabActive
          ? onDeselect?.(group.id)
          : onSelect?.(group.id)
      }
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
          opacity: ${isSelected ? 1 : 0.8};
          transition: opacity 0.2s;
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
                background-color: ${Color.green()};
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
          {group.allMemberIds.length}{' '}
          {group.allMemberIds.length === 1 ? 'member' : 'members'}
        </div>
      </div>
      {isSelected && (
        <Icon
          icon="check-circle"
          style={{
            marginLeft: '1rem',
            color: Color[profileTheme](),
            fontSize: '2rem',
            animation: 'popIn 0.3s ease-out'
          }}
        />
      )}
    </div>
  );
}
