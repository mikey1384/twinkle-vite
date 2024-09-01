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
          font-size: 1.1rem;
          font-weight: bold;
          color: ${Color.darkerGray()};
        `}
      >
        {group.channelName}
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
