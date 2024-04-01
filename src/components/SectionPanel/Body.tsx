import React, { useMemo } from 'react';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

export default function Body({
  emptyMessage,
  searchQuery,
  isSearching,
  isEmpty,
  statusMsgStyle,
  content,
  loadMoreButtonShown
}: {
  emptyMessage?: string;
  searchQuery: string;
  isSearching?: boolean;
  isEmpty?: boolean;
  statusMsgStyle: string;
  content: React.ReactNode;
  loadMoreButtonShown?: boolean;
}) {
  const searchQueryIsEmpty = useMemo(
    () => stringIsEmpty(searchQuery),
    [searchQuery]
  );
  return (
    <div
      className={css`
        width: 100%;
      `}
    >
      {(!searchQueryIsEmpty && isSearching) ||
      (isEmpty && !loadMoreButtonShown) ? (
        <div
          className={`${css`
            width: 100%;
          `} ${statusMsgStyle}`}
        >
          {searchQuery && isSearching
            ? 'Searching...'
            : searchQuery
            ? 'No Results'
            : emptyMessage}
        </div>
      ) : (
        content
      )}
    </div>
  );
}
