import React from 'react';
import { css } from '@emotion/css';
import { innerBorderRadius, mobileMaxWidth } from '~/constants/css';
import { renderText } from '~/helpers/stringHelpers';

export default function SearchInput({
  searchText,
  onSetSearchText
}: {
  searchText: string;
  onSetSearchText: (text: string) => void;
}) {
  return (
    <div
      className={css`
        margin-top: 0.5rem;
        display: flex;
        justify-content: center;
      `}
    >
      <input
        type="text"
        placeholder="Search..."
        autoFocus
        value={searchText}
        onChange={(event) => onSetSearchText(renderText(event.target.value))}
        className={css`
          width: 100%;
          padding: 0.8rem;
          border-radius: ${innerBorderRadius};
          border: 1px solid #ccc;
          box-shadow: 2px 2px 5px #d1d1d1, -2px -2px 5px #ffffff;
          font-size: 1.2rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1rem;
          }
        `}
      />
    </div>
  );
}
