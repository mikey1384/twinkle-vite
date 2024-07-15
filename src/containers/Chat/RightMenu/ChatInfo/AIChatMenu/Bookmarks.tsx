import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function Bookmarks({
  bookmarkedMessages,
  onSetSelectedBookmark
}: {
  bookmarkedMessages: any[];
  onSetSelectedBookmark: (message: any) => void;
}) {
  return (
    <div
      className={css`
        display: grid;
        grid-template-rows: auto 1fr;
        overflow: hidden;
      `}
    >
      <h3
        className={css`
          font-size: 1.4rem;
          margin-bottom: 0.5rem;
          color: #333;
          border-bottom: 1px solid ${Color.borderGray()};
          padding-bottom: 0.5rem;
          white-space: normal;
        `}
      >
        <Icon icon="bookmark" />
        <span style={{ marginLeft: '0.7rem' }}>Bookmarks</span>
      </h3>
      {bookmarkedMessages.length === 0 ? (
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #999;
            font-size: 1.3rem;
          `}
        >
          No bookmarks, yet
        </div>
      ) : (
        <ul
          className={css`
            list-style: none;
            padding: 0;
            white-space: normal;
            overflow-y: auto;
            margin: 0;
          `}
        >
          {bookmarkedMessages.map((message, index) => (
            <li
              key={index}
              className={css`
                font-size: 1rem;
                color: #666;
                margin-bottom: 0.5rem;
                cursor: pointer;
                white-space: normal;
                &:hover {
                  color: #000;
                }
              `}
              onClick={() => onSetSelectedBookmark(message)}
            >
              {message.content.length > 100
                ? `${message.content.slice(0, 100)}...`
                : message.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
