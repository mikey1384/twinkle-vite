import React from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

export default function RecentGroupItem({
  groupName,
  isMember,
  thumbPath,
  pathId
}: {
  groupName: string;
  isMember: boolean;
  thumbPath: string;
  pathId: number;
}) {
  const navigate = useNavigate();

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 0.5rem;
      `}
    >
      <div
        className={css`
          width: 30px;
          height: 30px;
          border-radius: 50%;
          margin-right: 1rem;
          background-color: ${Color.lightGray()};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        `}
      >
        {thumbPath ? (
          <img
            src={`${cloudFrontURL}/thumbs/${thumbPath}/thumb.png`}
            alt={groupName}
            className={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
            `}
          />
        ) : (
          <Icon icon="users" />
        )}
      </div>
      <span
        className={css`
          font-size: 1.3rem;
          color: ${Color.darkerGray()};
          flex-grow: 1;
        `}
      >
        {groupName}
      </span>
      <button
        className={css`
          background: ${isMember ? Color.logoBlue() : Color.green()};
          color: white;
          border: none;
          border-radius: 3px;
          padding: 0.3rem 0.5rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          &:hover {
            filter: brightness(110%);
          }
        `}
        onClick={() => navigate(`/chat/${pathId}`)}
      >
        <Icon
          icon={isMember ? 'right-from-bracket' : 'user-plus'}
          style={{ marginRight: '0.3rem' }}
        />
        <span>{isMember ? 'Go' : 'Join'}</span>
      </button>
    </div>
  );
}
