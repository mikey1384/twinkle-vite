import React from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, borderRadius } from '~/constants/css';
import Icon from '~/components/Icon';
import { getColorFromName } from '~/helpers/stringHelpers';

export default function SelectedGroupItem({
  group,
  onDeselect
}: {
  group: {
    id: number;
    channelName: string;
    thumbPath?: string;
    members: any[];
    isPublic?: boolean;
  };
  onDeselect: (groupId: number) => void;
}) {
  const bgColor = getColorFromName(group.channelName);

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: ${borderRadius};
        border: 1px solid ${Color.borderGray()};
        position: relative;
        width: calc(50% - 0.5rem);
        margin-bottom: 1rem;
      `}
    >
      <div
        className={css`
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          margin-right: 1rem;
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
              font-size: 1.5rem;
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
          overflow: hidden;
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
              font-size: 1.1rem;
              font-weight: bold;
              color: ${Color.darkerGray()};
              margin-right: 0.5rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {group.channelName}
          </div>
          {group.isPublic && (
            <span
              className={css`
                padding: 0.1rem 0.3rem;
                background-color: ${Color.green()};
                color: white;
                border-radius: 0.3rem;
                font-size: 0.7rem;
                font-weight: bold;
              `}
            >
              Public
            </span>
          )}
        </div>
        <div
          className={css`
            font-size: 0.9rem;
            color: ${Color.gray()};
          `}
        >
          {group.members.length} members
        </div>
      </div>
      <button
        className={css`
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.2rem;
          &:hover {
            color: ${Color.red()};
          }
        `}
        onClick={() => onDeselect(group.id)}
      >
        <Icon icon="times" />
      </button>
    </div>
  );
}
