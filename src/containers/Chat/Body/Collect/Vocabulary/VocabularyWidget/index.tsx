import React from 'react';
import { css } from '@emotion/css';
import WordRegisterStatus from './WordRegisterStatus';
import SearchResult from './SearchResult';
import Backdrop from './Backdrop';
import PromptMessage from './PromptMessage';

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
  const isSearching = !inputTextIsEmpty;

  return (
    <div
      className={css`
        position: relative;
        z-index: 5;
        width: 100%;
        height: ${widgetHeight};
      `}
    >
      <Backdrop />

      {!hasWordRegisterStatus && <PromptMessage isSearching={isSearching} />}

      {hasWordRegisterStatus && inputTextIsEmpty && <WordRegisterStatus />}

      <SearchResult
        searchedWord={searchedWord}
        socketConnected={socketConnected}
        notFoundLabel={notFoundLabel}
        isVisible={isSearching}
      />
    </div>
  );
}
