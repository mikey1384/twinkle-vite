import React from 'react';
import PropTypes from 'prop-types';
import { stringIsEmpty } from '~/helpers/stringHelpers';

Body.propTypes = {
  emptyMessage: PropTypes.string,
  searchQuery: PropTypes.string,
  isSearching: PropTypes.bool,
  isEmpty: PropTypes.bool,
  loadMoreButtonShown: PropTypes.bool,
  statusMsgStyle: PropTypes.string,
  content: PropTypes.node
};

export default function Body({
  emptyMessage,
  searchQuery,
  isSearching,
  isEmpty,
  statusMsgStyle,
  content,
  loadMoreButtonShown
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
