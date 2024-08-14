import React from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

export default function RecentGroupItem({
  groupName,
  thumbPath
}: {
  groupName: string;
  thumbPath: string;
}) {
  const navigate = useNavigate();

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: background-color 0.3s;
        &:hover {
          background-color: ${Color.highlightGray()};
        }
      `}
      onClick={() => navigate('/groups')}
    >
      <div
        className={css`
          width: 2rem;
          height: 2rem;
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
          font-size: 1.1rem;
          color: ${Color.darkerGray()};
          flex-grow: 1;
        `}
      >
        {groupName}
      </span>
    </div>
  );
}
