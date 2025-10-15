import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { getColorFromName } from '~/helpers/stringHelpers';
import { useHomeContext } from '~/contexts/hooks';

export default function RecentGroupItem({
  groupName,
  thumbPath
}: {
  groupName: string;
  thumbPath: string;
}) {
  const navigate = useNavigate();
  const bgColor = useMemo(() => getColorFromName(groupName), [groupName]);
  const onResetGroups = useHomeContext((v) => v.actions.onResetGroups);

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 0.6rem 1.4rem 0.6rem 3rem;
        margin: 0.2rem 1rem;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.35);
        box-shadow: 0 14px 26px -22px rgba(15, 23, 42, 0.38);
        cursor: pointer;
        transition: background 0.2s ease, box-shadow 0.2s ease,
          border-color 0.2s ease, transform 0.15s ease;
        &:hover {
          background: ${Color.highlightGray()};
          border-color: ${Color.borderGray()};
          box-shadow: 0 18px 30px -24px rgba(15, 23, 42, 0.42);
          transform: translateX(4px);
        }
      `}
      onClick={() => {
        onResetGroups();
        navigate('/groups');
      }}
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
          border: 1px solid rgba(148, 163, 184, 0.35);
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
          font-size: 1.2rem;
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
