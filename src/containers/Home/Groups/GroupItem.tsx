import React from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function GroupItem({ groupName }: { groupName: string }) {
  return (
    <ErrorBoundary componentPath="Home/Groups/GroupItem">
      <div
        className={css`
          display: flex;
          background: #fff;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          margin: 8px 0;
          border: 1px solid gray;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `}
      >
        <div
          className={css`
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          `}
        >
          <img
            src="https://via.placeholder.com/50"
            alt="Group"
            className={css`
              border-radius: 50%;
              width: 50px;
              height: 50px;
              object-fit: cover;
            `}
          />
          <button
            className={css`
              background: #4caf50;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 8px 16px;
              cursor: pointer;
              font-size: 14px;
              &:hover {
                background: #45a049;
              }
            `}
          >
            Join
          </button>
        </div>
        <h2
          className={css`
            margin: 8px 0;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
          `}
        >
          {groupName}
        </h2>
        <p
          className={css`
            margin: 4px 0;
            font-size: 14px;
            color: #666;
          `}
        >
          Category: <strong>Social</strong>
        </p>
        <p
          className={css`
            margin: 4px 0;
            font-size: 14px;
            color: #666;
          `}
        >
          Members: <strong>120</strong> (Online: <strong>20</strong>)
        </p>
        <p
          className={css`
            margin: 8px 0;
            font-size: 14px;
            color: #666;
            text-align: center;
          `}
        >
          This is a brief description of the group. It gives a quick overview of
          what the group is about.
        </p>
      </div>
    </ErrorBoundary>
  );
}
