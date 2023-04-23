import React from 'react';
import { stringIsEmpty } from '~/helpers/stringHelpers';

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
  return (
    <div style={{ width: '100%' }}>
      {(!stringIsEmpty(searchQuery) && isSearching) ||
      (isEmpty && !loadMoreButtonShown) ? (
        <div style={{ width: '100%' }} className={statusMsgStyle}>
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
