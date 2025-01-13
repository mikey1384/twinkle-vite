import React from 'react';
import { css } from '@emotion/css';
import WordRegisterStatus from './WordRegisterStatus';
import SearchResult from './SearchResult';
import { Color } from '~/constants/css';
import EmptyState from './EmptyState';

interface VocabularyWidgetProps {
  widgetHeight: string;
  wordRegisterStatus: any;
  inputTextIsEmpty: boolean;
  searchedWord: any;
  socketConnected: boolean;
  notFoundLabel: string;
}

export default function VocabularyWidget({
  widgetHeight,
  wordRegisterStatus,
  inputTextIsEmpty,
  searchedWord,
  socketConnected,
  notFoundLabel
}: VocabularyWidgetProps) {
  const hasWordRegisterStatus = Boolean(wordRegisterStatus);

  const showWordRegisterStatus = inputTextIsEmpty && hasWordRegisterStatus;
  const showEmptyState = !hasWordRegisterStatus && inputTextIsEmpty;
  const showSearchResult = !inputTextIsEmpty;

  return (
    <div
      className={css`
        z-index: 5;
        width: 100%;
        height: ${widgetHeight};
        box-shadow: ${!hasWordRegisterStatus && inputTextIsEmpty
          ? `0 -5px 6px -3px ${Color.gray()}`
          : 'none'};
        border-top: ${hasWordRegisterStatus || !inputTextIsEmpty
          ? `1px solid ${Color.borderGray()}`
          : 'none'};
      `}
    >
      {showWordRegisterStatus && <WordRegisterStatus />}

      {showEmptyState && <EmptyState />}

      {showSearchResult && (
        <SearchResult
          searchedWord={searchedWord}
          socketConnected={socketConnected}
          notFoundLabel={notFoundLabel}
        />
      )}
    </div>
  );
}
