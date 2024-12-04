import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { getColorFromName } from '~/helpers/stringHelpers';

export default function RecentGroupItem({
  groupName,
  thumbPath
}: {
  groupName: string;
  thumbPath: string;
}) {
  const navigate = useNavigate();
  const bgColor = useMemo(() => getColorFromName(groupName), [groupName]);

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem 0.5rem 3rem;
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
          flex-shrink: 0;
          background-color: ${thumbPath ? Color.lightGray() : bgColor};
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
            loading="lazy"
            className={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
            `}
          />
        ) : (
          <div
            className={css`
              font-size: 1rem;
              font-weight: bold;
              color: white;
              font-family: 'Roboto', sans-serif;
            `}
          >
            {groupName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span
        className={css`
          font-size: 1.1rem;
          color: ${Color.darkerGray()};
          flex-grow: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `}
        title={groupName}
      >
        {groupName}
      </span>
    </div>
  );
}
